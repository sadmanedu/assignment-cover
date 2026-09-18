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
  SUBMIT_LAYOUT_OPTIONS,
  FONT_STACKS,
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
  DEFAULT_LOGO_URL,
  STORAGE_KEY,
} from '../constants';
import { toast } from '../lib/toast';
import { buildDetailsText, copyText } from '../lib/format';
import type { BorderStyle, DividerStyle, FontKey, LogoShape, SubmitLayout } from '../types';
import { CountBadge, Disclosure, Field, FieldRow, Section, Seg } from './ui';

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

/** Miniature of the two "Submitted To / By" arrangements. */
function SubmitLayoutSample({ kind, accent }: { kind: SubmitLayout; accent: string }) {
  const bar = (w: string, strong = false): CSSProperties => ({
    width: w,
    height: strong ? 5 : 3,
    borderRadius: 1,
    background: strong ? accent : '#cbd5e1',
  });
  if (kind === 'columns') {
    return (
      <span style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 10, height: '100%', paddingTop: 8, paddingLeft: 4 }}>
        {[0, 1].map((col) => (
          <span key={col} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, flex: '1 1 0' }}>
            <span style={{ ...bar('60%'), height: 2 }} />
            <span style={bar('80%', true)} />
            <span style={bar('68%')} />
          </span>
        ))}
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, height: '100%', paddingTop: 1 }}>
      <span style={{ ...bar('60%'), height: 2 }} />
      <span style={bar('80%', true)} />
      <span style={bar('68%')} />
      <span style={{ height: 4 }} />
      <span style={{ ...bar('60%'), height: 2 }} />
      <span style={bar('80%', true)} />
    </span>
  );
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

  /* Completion per section — powers the header badges and the readiness bar, so a
     first-time visitor can see at a glance what is still missing. Optional fields
     (they simply disappear from the cover when empty) never hold the cover back:
     the bar tracks the required ones only, and the optional gaps are called out
     separately so the percentage cannot look "stuck". */
  const filledIn = (fields: (keyof typeof cover)[]) =>
    fields.filter((f) => String(cover[f] ?? '').trim() !== '').length;
  const REQUIRED = {
    academic: ['universityName', 'department', 'assignmentTitle'],
    student: ['studentName', 'submissionDate'],
    faculty: ['instructorName', 'instructorDesignation'],
  } as const;
  const OPTIONAL = {
    academic: ['courseTitle', 'courseCode'],
    student: ['studentId', 'session', 'year', 'semester'],
    faculty: [],
  } as const;
  const counts = {
    academic: filledIn([...REQUIRED.academic, ...OPTIONAL.academic]),
    student: filledIn([...REQUIRED.student, ...OPTIONAL.student]),
    faculty: filledIn([...REQUIRED.faculty, ...OPTIONAL.faculty]),
  };
  const totals = { academic: 5, student: 6, faculty: 2 };

  const filledRequired =
    filledIn([...REQUIRED.academic]) + filledIn([...REQUIRED.student]) + filledIn([...REQUIRED.faculty]);
  const totalRequired = REQUIRED.academic.length + REQUIRED.student.length + REQUIRED.faculty.length;
  const filledOptional =
    filledIn([...OPTIONAL.academic]) + filledIn([...OPTIONAL.student]) + filledIn([...OPTIONAL.faculty]);
  const totalOptional = OPTIONAL.academic.length + OPTIONAL.student.length + OPTIONAL.faculty.length;
  const percent = Math.round((filledRequired / totalRequired) * 100);
  const ready = filledRequired === totalRequired;
  const optionalLeft = totalOptional - filledOptional;

  const accent = cover.accentColor;
  const bgEntries = Object.entries(BACKGROUNDS) as [keyof typeof BACKGROUNDS, (typeof BACKGROUNDS)[keyof typeof BACKGROUNDS]][];

  return (
    <aside
      className={`${mobileVisible ? '' : 'hidden'} min-h-0 w-full flex-1 overflow-y-auto bg-white lg:block lg:w-[390px] lg:flex-1-none lg:shrink-0 lg:border-r lg:border-slate-200`}
    >
      {/* ---------- Readiness: what this panel does + what is still missing ---------- */}
      <div className="relative border-b border-slate-200 bg-slate-50/80 px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-bold text-slate-700">
            {ready ? 'Cover ready' : `${filledRequired} of ${totalRequired} required details`}
          </span>
          <span className="flex-1" />
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 sm:w-32">
            <div
              className={`h-full rounded-full transition-all duration-300 ${ready ? 'bg-emerald-500' : 'bg-blue-600'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className={`w-8 text-right text-[11px] font-bold tabular-nums ${ready ? 'text-emerald-600' : 'text-slate-500'}`}>
            {percent}%
          </span>
        </div>
        <div className="mt-1.5 flex items-start gap-1.5">
          <p className="min-w-0 flex-1 text-[10.5px] leading-snug text-slate-500">
            {ready ? (
              <>
                Every required detail is in.{' '}
                {optionalLeft > 0 ? (
                  <>
                    <span className="font-semibold text-slate-600">{optionalLeft} optional</span>{' '}
                    {optionalLeft === 1 ? 'field is' : 'fields are'} left empty and simply skipped on the cover.
                  </>
                ) : (
                  'Every field is filled.'
                )}
              </>
            ) : (
              <>
                Fill the {totalRequired - filledRequired} remaining required detail
                {totalRequired - filledRequired === 1 ? '' : 's'} · <span className="font-semibold text-slate-600">optional</span>{' '}
                fields are left off the cover when empty.
              </>
            )}
          </p>
          <button
            type="button"
            aria-label="How this panel works"
            className="peer grid h-4 w-4 shrink-0 place-items-center rounded-full border border-slate-300 text-[9px] font-bold text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
          >
            ?
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-3 z-30 mt-5 hidden w-60 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10.5px] leading-snug text-slate-600 shadow-lg peer-hover:block peer-focus-visible:block"
          >
            Sections follow the cover from top to bottom: the logo and name, what the assignment is, the student, the
            faculty and the date. The badge on each section counts the fields you have filled, and the bar above shows
            the cover&rsquo;s completeness.
          </span>
        </div>
      </div>

      {/* ---------- Submitted To / By arrangement — pinned to the top of the
     Details tab, right before the academic details ---------- */}
      <Section title="Submitted To / By" icon="🧱" note="how the panels sit">
        <div className="flex gap-1.5">
          {SUBMIT_LAYOUT_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => set({ submitLayout: o.key })}
              className={`opt flex-1 p-1 ${cover.submitLayout === o.key ? 'opt-on' : 'opt-off'}`}
            >
              <span className="block h-9 w-full overflow-hidden rounded border border-slate-200 bg-white">
                <SubmitLayoutSample kind={o.key} accent={accent} />
              </span>
              <span className="opt-label mt-0.5">
                {o.label} <span className="font-normal text-slate-400">· {o.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* ---------- Academic ---------- */}
      <Section title="Academic Details" icon="🎓" note="top of the cover" badge={<CountBadge filled={counts.academic} total={totals.academic} />}>
        <FieldRow>
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
        </FieldRow>
        <FieldRow>
          <Field label="Course Title" optional>
            <input
              className="field-input"
              value={cover.courseTitle}
              onChange={(e) => set({ courseTitle: e.target.value })}
              placeholder="e.g. Data Structures"
            />
          </Field>
          <Field label="Course Code" optional>
            <input
              className="field-input"
              value={cover.courseCode}
              onChange={(e) => set({ courseCode: e.target.value })}
              placeholder="2102"
            />
          </Field>
        </FieldRow>
        <Field label="Assignment / Report Title" hint="Enter = new line">
          <textarea
            className="field-input min-h-[52px] resize-y"
            rows={2}
            value={cover.assignmentTitle}
            onChange={(e) => set({ assignmentTitle: e.target.value })}
            placeholder="Full title of the assignment"
          />
        </Field>
      </Section>

      {/* ---------- Student ---------- */}
      <Section title="Student Details" icon="🧑‍🎓" note="Submitted By block" badge={<CountBadge filled={counts.student} total={totals.student} />}>
        <FieldRow>
          <Field label="Student Name">
            <input
              className="field-input"
              value={cover.studentName}
              onChange={(e) => set({ studentName: e.target.value })}
              placeholder="Full name"
            />
          </Field>
          <Field label="ID / Roll" optional>
            <input
              className="field-input"
              value={cover.studentId}
              onChange={(e) => set({ studentId: e.target.value })}
              placeholder="e.g. 2021-123456-12"
            />
          </Field>
        </FieldRow>
        <FieldRow cols={3}>
          <Field label="Session">
            <input
              className="field-input"
              value={cover.session}
              onChange={(e) => set({ session: e.target.value })}
              placeholder="2024"
            />
          </Field>
          <Field label="Year" hint="2 = 2nd">
            <input
              className="field-input"
              value={cover.year}
              onChange={(e) => set({ year: e.target.value })}
              placeholder="2"
            />
          </Field>
          <Field label="Semester" hint="4 = 4th">
            <input
              className="field-input"
              value={cover.semester}
              onChange={(e) => set({ semester: e.target.value })}
              placeholder="4"
            />
          </Field>
        </FieldRow>
        <Field label="Date of Submission" hint="prints at the bottom">
          <input
            type="date"
            className="field-input"
            value={cover.submissionDate}
            onChange={(e) => set({ submissionDate: e.target.value })}
          />
        </Field>
      </Section>

      {/* ---------- Faculty ---------- */}
      <Section title="Submitted To" icon="👨‍🏫" note="Submitted To block" badge={<CountBadge filled={counts.faculty} total={totals.faculty} />}>
        <FieldRow>
          <Field label="Instructor Name">
            <input
              className="field-input"
              value={cover.instructorName}
              onChange={(e) => set({ instructorName: e.target.value })}
              placeholder="e.g. Prof. Dr. Name"
            />
          </Field>
          <Field label="Designation" hint="Enter = new line">
            <textarea
              className="field-input min-h-[58px] resize-y"
              rows={3}
              value={cover.instructorDesignation}
              onChange={(e) => set({ instructorDesignation: e.target.value })}
              placeholder="e.g. Professor, Department of CSE"
            />
          </Field>
        </FieldRow>
        <p className="text-[10.5px] leading-snug text-slate-400">
          Each line of the designation prints on its own line under the instructor's name.
        </p>
      </Section>

      {/* ---------- Style ---------- */}
      <Section title="Look & Styling" icon="🎨" note="accent & frames">
        <div>
          <span className="field-label">
            <span>Accent Colour</span>
            <span className="shrink-0 font-medium normal-case tracking-normal text-slate-400">{accent}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                title={p.name}
                onClick={() => set({ accentColor: p.value })}
                className={`h-6 w-6 rounded-full transition hover:scale-110 ${
                  accent.toLowerCase() === p.value.toLowerCase()
                    ? 'ring-2 ring-slate-800 ring-offset-2'
                    : 'ring-1 ring-black/10'
                }`}
                style={{ background: p.value }}
              />
            ))}
            <label
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 hover:border-slate-400"
              title="Custom accent colour"
            >
              <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: accent }} />
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
          <span className="field-label">
            <span>Page Border</span>
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {BORDER_OPTIONS.map((b) => (
              <button
                key={b.key}
                type="button"
                title={b.label}
                onClick={() => set({ borderStyle: b.key })}
                className={`opt p-1 ${cover.borderStyle === b.key ? 'opt-on' : 'opt-off'}`}
              >
                <span className="relative block h-7 w-full overflow-hidden rounded border border-slate-200 bg-white">
                  <BorderSample kind={b.key} accent={accent} />
                </span>
                <span className="opt-label mt-0.5">{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Page Background</span>
          <div className="flex flex-wrap gap-1.5">
            {bgEntries.map(([key, b]) => (
              <button
                key={key}
                type="button"
                title={b.label}
                onClick={() => set({ backgroundKey: key })}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold transition ${
                  cover.backgroundKey === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: b.swatch }} />
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <Disclosure
          title="Fine-tune type & layout"
          summary={`${FONT_OPTIONS.find((f) => f.key === cover.fontKey)?.label ?? 'Inter'} · ${
            DIVIDER_OPTIONS.find((d) => d.key === cover.dividerStyle)?.label ?? 'Diamond'
          } · ${Math.round(cover.contentScale * 100)}%`}
        >
          <div>
            <span className="field-label">Typography</span>
            <div className="flex gap-1.5">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  title={`${f.label} — ${f.hint}`}
                  onClick={() => set({ fontKey: f.key as FontKey })}
                  className={`opt flex-1 px-1.5 py-1 text-left ${cover.fontKey === f.key ? 'opt-on' : 'opt-off'}`}
                >
                  <span className="block text-[11px] font-bold text-slate-700" style={{ fontFamily: FONT_STACKS[f.key] }}>
                    {f.label}
                  </span>
                  <span className="block text-[10px] text-slate-400">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">
              <span>Divider</span>
              <span className="shrink-0 font-medium normal-case tracking-normal text-slate-400">
                the rule under the university name
              </span>
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {DIVIDER_OPTIONS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  title={d.label}
                  onClick={() => set({ dividerStyle: d.key })}
                  className={`opt p-1 ${cover.dividerStyle === d.key ? 'opt-on' : 'opt-off'}`}
                >
                  <span className="block h-5 w-full overflow-hidden rounded border border-slate-200 bg-white">
                    <DividerSample kind={d.key} accent={accent} />
                  </span>
                  <span className="opt-label mt-0.5">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">
              <span>Content Size</span>
              <button
                type="button"
                onClick={() => set({ contentScale: 1 })}
                disabled={cover.contentScale === 1}
                title={cover.contentScale === 1 ? 'Content size is at 100%' : 'Reset content size to 100%'}
                className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold normal-case tabular-nums transition ${
                  cover.contentScale === 1 ? 'cursor-default text-slate-400' : 'text-blue-700 hover:bg-blue-50'
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
            <p className="mt-1 text-[10.5px] leading-snug text-slate-400">
              Grows every text size, gap and rule from the department down to the session together. The logo,
              university name and date stay fixed — tap the percentage to reset.
            </p>
            {contentOverflow && (
              <p
                role="status"
                className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold leading-snug text-amber-800"
              >
                <span aria-hidden>⚠️</span>
                <span>Content no longer fits above the date — lower the size or shorten the text.</span>
              </p>
            )}
          </div>

        </Disclosure>
      </Section>

      {/* ---------- Logo ---------- */}
      <Section title="Logo" icon="🖼️" note="crest" defaultOpen={false}>
        <div className="flex items-center gap-2.5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white p-1.5">
            <img src={logoUrl} alt="Current logo preview" className="h-full w-full object-contain" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              Upload Logo
            </button>
            {cover.logoDataUrl !== DEFAULT_LOGO_URL ? (
              <button type="button" className="btn btn-ghost" onClick={() => set({ logoDataUrl: DEFAULT_LOGO_URL })}>
                Use university logo
              </button>
            ) : (
              <span className="truncate text-[10.5px] text-slate-400">Official JNU crest — upload to replace</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div className="grid grid-cols-[110px_minmax(0,1fr)] items-end gap-2">
          <div>
            <span className="field-label">Shape</span>
            <Seg
              options={[
                { key: 'normal', label: 'Normal' },
                { key: 'circular', label: 'Circle' },
              ]}
              value={cover.logoShape}
              onChange={(v) => set({ logoShape: v as LogoShape })}
            />
          </div>
          <div>
            <span className="field-label">
              <span>Size</span>
              <span className="shrink-0 font-bold normal-case tabular-nums tracking-normal text-blue-700">
                {cover.logoSize} mm
              </span>
            </span>
            <input
              type="range"
              min={LOGO_SIZE_MIN}
              max={LOGO_SIZE_MAX}
              step={1}
              value={cover.logoSize}
              onChange={(e) => set({ logoSize: Number(e.target.value) })}
              aria-label="Logo size"
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </Section>

      {/* ---------- Data utilities ---------- */}
      <Section title="Save & Export" icon="💾" note="this browser" defaultOpen={false}>
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
        <p className="text-[10.5px] leading-relaxed text-slate-400">
          Save keeps your cover in this browser. Copy Details puts a plain-text summary on the clipboard.
        </p>
      </Section>
    </aside>
  );
}
