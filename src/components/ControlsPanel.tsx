import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useCover, pickPersistable } from '../store';
import {
  ACCENT_PRESETS,
  BACKGROUNDS,
  BORDER_OPTIONS,
  CONTENT_SCALE_MAX,
  CONTENT_SCALE_MIN,
  CONTENT_SCALE_STEP,
  DIVIDER_OPTIONS,
  FONT_OPTIONS,
  FONT_STACKS,
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
  DEFAULT_LOGO_URL,
  STORAGE_KEY,
} from '../constants';
import { toast } from '../lib/toast';
import { buildDetailsText, copyText } from '../lib/format';
import type { BorderStyle, DividerStyle, FontKey, LogoShape } from '../types';
import { Field, Section, Seg } from './ui';

/**
 * True when the (scaled) content block no longer fits above the pinned
 * submission date, so the bottom of the cover would be clipped. Measured on the
 * off-screen 1:1 export sheet, which is independent of the preview's zoom.
 */
/** Computed style lengths come back in whatever unit the CSS used — read them as px. */
function cssPx(value: string): number {
  const n = parseFloat(value) || 0;
  if (value.endsWith('mm')) return (n * 96) / 25.4;
  if (value.endsWith('cm')) return (n * 96) / 2.54;
  if (value.endsWith('pt')) return (n * 96) / 72;
  if (value.endsWith('in')) return n * 96;
  return n;
}

function useContentOverflow(dep: unknown): boolean {
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const sheet = document.getElementById('print-sheet')?.firstElementChild as HTMLElement | null;
    const block = sheet?.querySelector<HTMLElement>('[data-content-block]');
    const date = sheet?.querySelector<HTMLElement>('[data-date-block]');
    if (!sheet || !block || !date) {
      setOverflow(false);
      return;
    }
    let live = true;
    // The date is pinned to the bottom of the padded content column by
    // `marginTop: auto`, so at rest it sits flush with that column's bottom
    // padding. If the scaled block needs more room than is left above it, the date
    // is pushed out of that resting spot — that displacement is what "no longer
    // fits" means (not a mere near-miss).
    const column = date.parentElement ?? sheet;
    const measure = () => {
      if (!live) return;
      const columnRect = column.getBoundingClientRect();
      const dateRect = date.getBoundingClientRect();
      const restBottom = columnRect.bottom - cssPx(getComputedStyle(column).paddingBottom);
      setOverflow(dateRect.bottom > restBottom + 1);
    };
    // Measure after this render is on screen…
    const frame = requestAnimationFrame(measure);
    // …and again whenever the sheet re-flows for any other reason, so the warning
    // stays correct when fonts finish loading or the text re-wraps.
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(block);
    observer?.observe(date);
    if (typeof document !== 'undefined' && document.fonts) document.fonts.ready.then(measure).catch(() => {});
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [dep]);
  return overflow;
}

/**
 * Miniature of each page border, drawn with the same shapes the sheet uses so the
 * picker shows what you get. `B` is the tiny frame the sample is drawn in.
 */
function BorderSample({ kind, accent }: { kind: BorderStyle; accent: string }) {
  const frame: CSSProperties = { position: 'absolute', inset: 3 };
  const line = (extra: CSSProperties): CSSProperties => ({ position: 'absolute', borderColor: accent, ...extra });
  switch (kind) {
    case 'none':
      return <span style={{ ...frame, border: '1px dashed #cbd5e1' }} />;
    case 'single':
      return <span style={{ ...frame, border: `2px solid ${accent}` }} />;
    case 'bold':
      return <span style={{ ...frame, border: `4px solid ${accent}` }} />;
    case 'stitched':
      return <span style={{ ...frame, border: `2px dashed ${accent}` }} />;
    case 'double':
      return <span style={{ ...frame, border: `4px double ${accent}` }} />;
    case 'inset':
      return (
        <>
          <span style={{ ...frame, border: `1px solid ${accent}` }} />
          <span style={{ position: 'absolute', inset: 7, border: `2px solid ${accent}` }} />
        </>
      );
    case 'decorative':
      return (
        <>
          <span style={{ ...frame, border: `4px double ${accent}` }} />
          <span style={{ position: 'absolute', inset: 8, border: `1px solid ${accent}` }} />
          {[
            { left: 1, top: 1 },
            { right: 1, top: 1 },
            { left: 1, bottom: 1 },
            { right: 1, bottom: 1 },
          ].map((spot, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                background: '#fff',
                border: `1.5px solid ${accent}`,
                transform: 'rotate(45deg)',
                ...spot,
              }}
            />
          ))}
        </>
      );
    case 'corners':
      return (
        <>
          {[
            { left: 2, top: 2, borderTop: `2.5px solid ${accent}`, borderLeft: `2.5px solid ${accent}` },
            { right: 2, top: 2, borderTop: `2.5px solid ${accent}`, borderRight: `2.5px solid ${accent}` },
            { left: 2, bottom: 2, borderBottom: `2.5px solid ${accent}`, borderLeft: `2.5px solid ${accent}` },
            { right: 2, bottom: 2, borderBottom: `2.5px solid ${accent}`, borderRight: `2.5px solid ${accent}` },
          ].map((spot, i) => (
            <span key={i} style={{ position: 'absolute', width: 15, height: 15, ...spot }} />
          ))}
        </>
      );
    case 'flourish':
      return (
        <>
          <span style={{ ...frame, border: `1.5px solid ${accent}` }} />
          {[
            { left: '50%', top: 0, marginLeft: -3 },
            { left: '50%', bottom: 0, marginLeft: -3 },
            { top: '50%', left: 0, marginTop: -3 },
            { top: '50%', right: 0, marginTop: -3 },
          ].map((spot, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                background: accent,
                transform: 'rotate(45deg)',
                ...spot,
              }}
            />
          ))}
          <span />
        </>
      );
    default:
      return <span style={{ ...frame, ...line({}) }} />;
  }
}

/** Miniature of each divider style — the same drawing the sheet uses, shrunk. */
function DividerSample({ kind, accent }: { kind: DividerStyle; accent: string }) {
  const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' };
  const bar: CSSProperties = { height: 1, background: '#cbd5e1' };
  switch (kind) {
    case 'none':
      return <span style={{ ...row, color: '#cbd5e1', fontSize: 12 }}>—</span>;
    case 'dashed':
      return <span style={{ ...row }}>
        <span style={{ width: '72%', borderTop: '1px dashed #9ca3af' }} />
      </span>;
    case 'double':
      return (
        <span style={{ ...row, flexDirection: 'column', gap: 3 }}>
          <span style={{ ...bar, width: '72%' }} />
          <span style={{ ...bar, width: '72%' }} />
        </span>
      );
    case 'diamond':
      return (
        <span style={{ ...row, gap: 4, width: '100%' }}>
          <span style={{ ...bar, flex: 1, marginLeft: '6%' }} />
          <span style={{ width: 6, height: 6, background: accent, transform: 'rotate(45deg)' }} />
          <span style={{ ...bar, flex: 1, marginRight: '6%' }} />
        </span>
      );
    case 'dots':
      return (
        <span style={{ ...row, gap: 4 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
        </span>
      );
    case 'accent':
      return <span style={{ ...row }}>
        <span style={{ width: '45%', height: 3, borderRadius: 2, background: accent }} />
      </span>;
    case 'fade':
      return <span style={{ ...row }}>
        <span style={{ width: '80%', height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      </span>;
    default:
      return <span style={{ ...row }}>
        <span style={{ width: '72%', ...bar }} />
      </span>;
  }
}

export function ControlsPanel({ logoUrl, mobileVisible }: { logoUrl: string; mobileVisible: boolean }) {
  const cover = useCover();
  const { set, reset } = cover;
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---------------- logo upload ---------------- */
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast('Please choose an image file (PNG, JPG, SVG…)', 'error');
      return;
    }
    if (f.size > 2.5 * 1024 * 1024) {
      toast('Image too large — keep it under 2.5 MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set({ logoDataUrl: String(reader.result) });
      toast('Logo uploaded', 'ok');
    };
    reader.readAsDataURL(f);
  };

  /* ---------------- persistence utilities ---------------- */
  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...pickPersistable(cover) }));
      toast('Cover saved to browser storage', 'ok');
    } catch {
      toast('Could not save (storage full?)', 'error');
    }
  };

  const load = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      toast('No saved cover found in this browser', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { data?: Record<string, unknown>; settings?: Record<string, unknown> };
      set({ ...(parsed.data ?? {}), ...(parsed.settings ?? {}) });
      toast('Saved cover loaded', 'ok');
    } catch {
      toast('Saved data could not be read', 'error');
    }
  };

  const copyDetails = async () => {
    const ok = await copyText(buildDetailsText(cover));
    toast(ok ? 'Details copied to clipboard' : 'Copy failed — select manually', ok ? 'ok' : 'error');
  };

  const doReset = () => {
    if (window.confirm('Reset all details and styling back to defaults?')) {
      reset();
      toast('Reset to defaults', 'ok');
    }
  };

  const contentOverflow = useContentOverflow(cover);

  const accent = cover.accentColor;
  const bgEntries = Object.entries(BACKGROUNDS) as [keyof typeof BACKGROUNDS, (typeof BACKGROUNDS)[keyof typeof BACKGROUNDS]][];

  return (
    <aside
      className={`${mobileVisible ? '' : 'hidden'} min-h-0 w-full flex-1 overflow-y-auto bg-white lg:block lg:w-[400px] lg:flex-1-none lg:shrink-0 lg:border-r lg:border-slate-200`}
    >
      {/* ---------- Academic ---------- */}
      <Section title="Academic Details" icon="🎓">
        <Field label="University Name">
          <input
            className="field-input"
            value={cover.universityName}
            onChange={(e) => set({ universityName: e.target.value })}
            placeholder="e.g. Jagannath University, Dhaka"
          />
        </Field>
        <Field label="Department">
          <input
            className="field-input"
            value={cover.department}
            onChange={(e) => set({ department: e.target.value })}
            placeholder="e.g. Department of CSE"
          />
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field label="Course Title">
            <input
              className="field-input"
              value={cover.courseTitle}
              onChange={(e) => set({ courseTitle: e.target.value })}
              placeholder="e.g. Data Structures"
            />
          </Field>
          <Field label="Course Code">
            <input
              className="field-input"
              value={cover.courseCode}
              onChange={(e) => set({ courseCode: e.target.value })}
              placeholder="CSE 2203"
            />
          </Field>
        </div>
        <Field label="Assignment / Report Title">
          <textarea
            className="field-input min-h-[64px] resize-y"
            rows={2}
            value={cover.assignmentTitle}
            onChange={(e) => set({ assignmentTitle: e.target.value })}
            placeholder="Full title of the assignment"
          />
        </Field>
      </Section>

      {/* ---------- Student ---------- */}
      <Section title="Student Details" icon="🧑‍🎓">
        <Field label="Student Name">
          <input
            className="field-input"
            value={cover.studentName}
            onChange={(e) => set({ studentName: e.target.value })}
            placeholder="Full name"
          />
        </Field>
        <Field label="ID / Roll Number">
          <input
            className="field-input"
            value={cover.studentId}
            onChange={(e) => set({ studentId: e.target.value })}
            placeholder="e.g. 2021-123456-12"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Session">
            <input
              className="field-input"
              value={cover.session}
              onChange={(e) => set({ session: e.target.value })}
              placeholder="2024"
            />
          </Field>
          <Field label="Year">
            <input
              className="field-input"
              value={cover.year}
              onChange={(e) => set({ year: e.target.value })}
              placeholder="2"
            />
          </Field>
          <Field label="Semester">
            <input
              className="field-input"
              value={cover.semester}
              onChange={(e) => set({ semester: e.target.value })}
              placeholder="4"
            />
          </Field>
        </div>
      </Section>

      {/* ---------- Faculty ---------- */}
      <Section title="Submitted To (Faculty)" icon="👨‍🏫">
        <Field label="Instructor Name">
          <input
            className="field-input"
            value={cover.instructorName}
            onChange={(e) => set({ instructorName: e.target.value })}
            placeholder="e.g. Prof. Dr. Name"
          />
        </Field>
        <Field label="Designation">
          <textarea
            className="field-input min-h-[52px] resize-y"
            rows={2}
            value={cover.instructorDesignation}
            onChange={(e) => set({ instructorDesignation: e.target.value })}
            placeholder="e.g. Professor, Department of CSE"
          />
        </Field>
        <p className="-mt-1 text-[11px] leading-snug text-slate-400">
          Tip: press{' '}
          <kbd className="rounded border border-slate-300 bg-slate-50 px-1 py-0.5 font-sans text-[10px] text-slate-500">
            Enter
          </kbd>{' '}
          (or type <code className="rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-500">\n</code>)
          {' '}to start the writing on the next line — it breaks the same way on the cover.
        </p>
      </Section>

      {/* ---------- Metadata ---------- */}
      <Section title="Metadata" icon="📅">
        <Field label="Submission Date">
          <input
            type="date"
            className="field-input"
            value={cover.submissionDate}
            onChange={(e) => set({ submissionDate: e.target.value })}
          />
        </Field>
      </Section>

      {/* ---------- Theme & style ---------- */}
      <Section title="Theme & Styling" icon="🎨">
        <div>
          <span className="field-label">Accent Color</span>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                title={p.name}
                onClick={() => set({ accentColor: p.value })}
                className={`h-7 w-7 rounded-full transition hover:scale-110 ${
                  accent.toLowerCase() === p.value.toLowerCase()
                    ? 'ring-2 ring-slate-800 ring-offset-2'
                    : 'ring-1 ring-black/10'
                }`}
                style={{ background: p.value }}
              />
            ))}
            <label
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:border-slate-400"
              title="Custom accent color"
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10"
                style={{ background: accent }}
              />
              Custom
              <input
                type="color"
                className="sr-only"
                value={accent}
                onChange={(e) => set({ accentColor: e.target.value })}
              />
            </label>
          </div>
        </div>

        <div>
          <span className="field-label">Page Border</span>
          <div className="grid grid-cols-4 gap-2">
            {BORDER_OPTIONS.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => set({ borderStyle: b.key })}
                className={`rounded-lg border p-1.5 text-center transition ${
                  cover.borderStyle === b.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="relative block h-9 w-full overflow-hidden rounded border border-slate-200 bg-white">
                  <BorderSample kind={b.key} accent={accent} />
                </span>
                <span className="mt-1 block text-[10px] font-semibold leading-tight text-slate-600">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Divider</span>
          <div className="grid grid-cols-4 gap-2">
            {DIVIDER_OPTIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => set({ dividerStyle: d.key })}
                className={`rounded-lg border p-1.5 text-center transition ${
                  cover.dividerStyle === d.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block h-6 w-full overflow-hidden rounded border border-slate-200 bg-white">
                  <DividerSample kind={d.key} accent={accent} />
                </span>
                <span className="mt-1 block text-[10px] font-semibold leading-tight text-slate-600">
                  {d.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Typography</span>
          <div className="flex gap-2">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => set({ fontKey: f.key as FontKey })}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-left transition ${
                  cover.fontKey === f.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block text-xs font-bold text-slate-700" style={{ fontFamily: FONT_STACKS[f.key] }}>
                  {f.label}
                </span>
                <span className="block text-[10px] text-slate-400">{f.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label flex items-center justify-between gap-2">
            <span>Content Size</span>
            <button
              type="button"
              onClick={() => set({ contentScale: 1 })}
              disabled={cover.contentScale === 1}
              title={cover.contentScale === 1 ? 'Content size is at 100%' : 'Reset content size to 100%'}
              className={`rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums transition ${
                cover.contentScale === 1
                  ? 'cursor-default text-slate-400'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              {Math.round(cover.contentScale * 100)}%
            </button>
          </span>
          <input
            type="range"
            min={CONTENT_SCALE_MIN}
            max={CONTENT_SCALE_MAX}
            step={CONTENT_SCALE_STEP}
            value={cover.contentScale}
            onChange={(e) => set({ contentScale: Number(e.target.value) })}
            aria-label="Content size"
            className="w-full accent-blue-600"
          />
          <p className="mt-1 text-[11px] leading-snug text-slate-400">
            Grows every text size, gap and rule from the department down to the session — the whole
            block scales together. The logo, university name and submission date stay fixed. Tap the
            percentage to reset.
          </p>
          {contentOverflow && (
            <p
              role="status"
              className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold leading-snug text-amber-800"
            >
              <span aria-hidden>⚠️</span>
              <span>
                Content no longer fits above the date — the bottom of the cover is pushed out of
                place. Lower the size or shorten the text.
              </span>
            </p>
          )}
        </div>

        <div>
          <span className="field-label">Page Background</span>
          <div className="flex flex-wrap gap-2">
            {bgEntries.map(([key, b]) => (
              <button
                key={key}
                type="button"
                title={b.label}
                onClick={() => set({ backgroundKey: key })}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  cover.backgroundKey === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-black/10"
                  style={{ background: b.swatch }}
                />
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- Logo ---------- */}
      <Section title="Logo" icon="🖼️">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white p-2">
            <img src={logoUrl} alt="Current logo preview" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              Upload Logo
            </button>
            {cover.logoDataUrl !== DEFAULT_LOGO_URL ? (
              <button type="button" className="btn btn-ghost" onClick={() => set({ logoDataUrl: DEFAULT_LOGO_URL })}>
                Use university logo
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Official JNU crest — upload to replace
              </span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <span className="field-label">Logo Shape</span>
          <Seg
            options={[
              { key: 'normal', label: 'Normal' },
              { key: 'circular', label: 'Circular' },
            ]}
            value={cover.logoShape}
            onChange={(v) => set({ logoShape: v as LogoShape })}
          />
        </div>

        <div>
          <span className="field-label flex items-center justify-between">
            <span>Logo Size</span>
            <span className="font-bold text-blue-700">{cover.logoSize} mm</span>
          </span>
          <input
            type="range"
            min={LOGO_SIZE_MIN}
            max={LOGO_SIZE_MAX}
            step={1}
            value={cover.logoSize}
            onChange={(e) => set({ logoSize: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
        </div>
      </Section>

      {/* ---------- Data utilities ---------- */}
      <Section title="Save & Export Data" icon="💾">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-primary" onClick={save}>
            Save
          </button>
          <button type="button" className="btn" onClick={load}>
            Load
          </button>
          <button type="button" className="btn" onClick={copyDetails}>
            Copy Details
          </button>
          <button
            type="button"
            className="btn !text-rose-600 hover:!border-rose-300 hover:!bg-rose-50"
            onClick={doReset}
          >
            Reset
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Save stores your cover in this browser (localStorage). Copy Details puts a plain-text
          summary on the clipboard.
        </p>
      </Section>
    </aside>
  );
}
