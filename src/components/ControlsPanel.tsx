import { useRef, type ChangeEvent } from 'react';
import { useCover, pickPersistable } from '../store';
import {
  ACCENT_PRESETS,
  BACKGROUNDS,
  BORDER_OPTIONS,
  FONT_OPTIONS,
  FONT_STACKS,
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
  STORAGE_KEY,
} from '../constants';
import { toast } from '../lib/toast';
import { buildDetailsText, copyText } from '../lib/format';
import type { BorderStyle, FontKey, LogoShape } from '../types';
import { Field, Section, Seg } from './ui';

function borderSample(key: BorderStyle, accent: string): string {
  switch (key) {
    case 'none':
      return '1px dashed #cbd5e1';
    case 'single':
      return `2px solid ${accent}`;
    case 'double':
      return `4px double ${accent}`;
    case 'decorative':
      return `3px double ${accent}`;
  }
}

export function ControlsPanel({ logoUrl }: { logoUrl: string }) {
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

  const accent = cover.accentColor;
  const bgEntries = Object.entries(BACKGROUNDS) as [keyof typeof BACKGROUNDS, (typeof BACKGROUNDS)[keyof typeof BACKGROUNDS]][];

  return (
    <aside className="w-full overflow-y-auto bg-white max-lg:max-h-[44dvh] max-lg:border-b max-lg:border-slate-200 lg:w-[400px] lg:shrink-0 lg:border-r lg:border-slate-200">
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
          <input
            className="field-input"
            value={cover.instructorDesignation}
            onChange={(e) => set({ instructorDesignation: e.target.value })}
            placeholder="e.g. Professor, Department of CSE"
          />
        </Field>
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
                <span className="block h-9 w-full overflow-hidden rounded border border-slate-200 bg-white">
                  <span
                    className="block"
                    style={{ margin: '4px', border: borderSample(b.key, accent) }}
                  />
                </span>
                <span className="mt-1 block text-[10px] font-semibold leading-tight text-slate-600">
                  {b.label}
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
            {cover.logoDataUrl ? (
              <button type="button" className="btn btn-ghost" onClick={() => set({ logoDataUrl: null })}>
                Use default emblem
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Default emblem — auto-tints with your accent color
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
