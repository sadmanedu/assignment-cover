import { useRef } from 'react'
import type { CoverState } from '../types'
import {
  ACCENT_SWATCHES,
  BACKGROUND_OPTIONS,
  BORDER_OPTIONS,
  FONT_OPTIONS,
  LOGO_SHAPE_OPTIONS,
  LOGO_SIZE_OPTIONS,
} from '../options'
import { ActionButton, Field, SectionCard, SegmentedControl, SelectInput, TextArea, TextInput } from './ui'

/* ---- tiny inline icons ---- */
const I = {
  academic: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  ),
  student: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" />
    </svg>
  ),
  teacher: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c.7-3 3-4.5 6-4.5s5.3 1.5 6 4.5" />
      <path d="M16 11.5 22 9v6" />
    </svg>
  ),
  palette: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-6.3-9-6.3Z" />
      <circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" />
      <circle cx="10.5" cy="7.8" r="1.1" fill="currentColor" />
      <circle cx="15" cy="7.8" r="1.1" fill="currentColor" />
    </svg>
  ),
  logo: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="m21 15-4.5-4.5L6 21" />
    </svg>
  ),
  save: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v5h7V3M8 21v-7h8v7" />
    </svg>
  ),
  upload: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  ),
  pdf: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  image: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  print: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V3h12v6" />
      <rect x="4" y="14" width="16" height="7" rx="1" />
      <path d="M8 14v-2h8v2" />
    </svg>
  ),
}

interface ControlPanelProps {
  state: CoverState
  patch: (p: Partial<CoverState>) => void
  onLogoFile: (file: File) => void
  onResetLogo: () => void
  onSave: () => void
  onLoadFile: (file: File) => void
  onCopy: () => void
  onReset: () => void
  onExportPNG: () => void
  onExportPDF: () => void
  onPrint: () => void
  busy: boolean
}

export default function ControlPanel({
  state,
  patch,
  onLogoFile,
  onResetLogo,
  onSave,
  onLoadFile,
  onCopy,
  onReset,
  onExportPNG,
  onExportPDF,
  onPrint,
  busy,
}: ControlPanelProps) {
  const logoInput = useRef<HTMLInputElement>(null)
  const jsonInput = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3.5">
      {/* Academic details */}
      <SectionCard title="Academic Details" icon={I.academic}>
        <Field label="University Name">
          <TextInput
            value={state.universityName}
            onChange={(e) => patch({ universityName: e.target.value })}
            placeholder="JAGANNATH UNIVERSITY, DHAKA"
          />
        </Field>
        <Field label="Department">
          <TextInput
            value={state.department}
            onChange={(e) => patch({ department: e.target.value })}
            placeholder="Department of ..."
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course Title">
            <TextInput
              value={state.courseTitle}
              onChange={(e) => patch({ courseTitle: e.target.value })}
            />
          </Field>
          <Field label="Course Code">
            <TextInput
              value={state.courseCode}
              onChange={(e) => patch({ courseCode: e.target.value })}
              placeholder="CSE 3101"
            />
          </Field>
        </div>
        <Field label="Assignment / Report Title">
          <TextArea
            rows={2}
            value={state.assignmentTitle}
            onChange={(e) => patch({ assignmentTitle: e.target.value })}
          />
        </Field>
      </SectionCard>

      {/* Student details */}
      <SectionCard title="Student Details" icon={I.student}>
        <Field label="Student Name">
          <TextInput
            value={state.studentName}
            onChange={(e) => patch({ studentName: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ID / Roll Number">
            <TextInput
              value={state.studentId}
              onChange={(e) => patch({ studentId: e.target.value })}
            />
          </Field>
          <Field label="Session">
            <TextInput
              value={state.session}
              onChange={(e) => patch({ session: e.target.value })}
              placeholder="2021-22"
            />
          </Field>
          <Field label="Year">
            <TextInput value={state.year} onChange={(e) => patch({ year: e.target.value })} />
          </Field>
          <Field label="Semester">
            <TextInput
              value={state.semester}
              onChange={(e) => patch({ semester: e.target.value })}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Faculty details */}
      <SectionCard title="Faculty Details" icon={I.teacher}>
        <Field label="Submitted To — Instructor Name">
          <TextInput
            value={state.instructorName}
            onChange={(e) => patch({ instructorName: e.target.value })}
          />
        </Field>
        <Field label="Designation">
          <TextInput
            value={state.instructorDesignation}
            onChange={(e) => patch({ instructorDesignation: e.target.value })}
            placeholder="Professor, Department of ..."
          />
        </Field>
        <Field label="Submission Date">
          <TextInput
            type="date"
            value={state.submissionDate}
            onChange={(e) => patch({ submissionDate: e.target.value })}
          />
        </Field>
      </SectionCard>

      {/* Theme & typography */}
      <SectionCard title="Theme, Borders & Typography" icon={I.palette}>
        <Field label="Accent Color">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_SWATCHES.map((s) => (
              <button
                key={s.value}
                type="button"
                title={s.name}
                onClick={() => patch({ accentColor: s.value })}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  state.accentColor.toLowerCase() === s.value.toLowerCase()
                    ? 'scale-110 border-slate-800 ring-2 ring-slate-300'
                    : 'border-white shadow ring-1 ring-slate-300 hover:scale-105'
                }`}
                style={{ background: s.value }}
              />
            ))}
            <label
              className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full shadow ring-1 ring-slate-300"
              title="Custom color"
              style={{
                background:
                  'conic-gradient(#ef4444,#f59e0b,#84cc16,#10b981,#06b6d4,#3b82f6,#8b5cf6,#ef4444)',
              }}
            >
              <input
                type="color"
                value={state.accentColor}
                onChange={(e) => patch({ accentColor: e.target.value })}
                className="absolute inset-0 h-full w-full opacity-0"
              />
            </label>
          </div>
        </Field>

        <Field label="Page Border">
          <SelectInput
            options={BORDER_OPTIONS}
            value={state.borderStyle}
            onChange={(e) =>
              patch({ borderStyle: e.target.value as CoverState['borderStyle'] })
            }
          />
        </Field>

        <Field label="Font Family">
          <SelectInput
            options={FONT_OPTIONS}
            value={state.fontFamily}
            onChange={(e) =>
              patch({ fontFamily: e.target.value as CoverState['fontFamily'] })
            }
          />
        </Field>

        <Field label="Page Background">
          <SelectInput
            options={BACKGROUND_OPTIONS}
            value={state.background}
            onChange={(e) =>
              patch({ background: e.target.value as CoverState['background'] })
            }
          />
        </Field>
      </SectionCard>

      {/* Logo */}
      <SectionCard title="Institution Logo" icon={I.logo}>
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <img
            src={state.logoDataUrl ?? `${import.meta.env.BASE_URL}jnu-logo.png`}
            alt="Logo preview"
            className="h-14 w-14 rounded-md border border-slate-200 bg-white object-contain p-1"
          />
          <div className="flex-1 space-y-1.5">
            <ActionButton variant="secondary" onClick={() => logoInput.current?.click()}>
              {I.upload} Upload Logo
            </ActionButton>
            <button
              type="button"
              onClick={onResetLogo}
              className="block text-[11.5px] font-medium text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline"
            >
              Reset to JNU logo
            </button>
          </div>
          <input
            ref={logoInput}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onLogoFile(f)
              e.target.value = ''
            }}
          />
        </div>

        <Field label="Logo Shape">
          <SegmentedControl
            ariaLabel="Logo shape"
            value={state.logoShape}
            options={LOGO_SHAPE_OPTIONS}
            onChange={(v) => patch({ logoShape: v })}
          />
        </Field>
        <Field label="Logo Size">
          <SegmentedControl
            ariaLabel="Logo size"
            value={state.logoSize}
            options={LOGO_SIZE_OPTIONS}
            onChange={(v) => patch({ logoSize: v })}
          />
        </Field>
      </SectionCard>

      {/* Export & data */}
      <SectionCard title="Export & Data">
        <div className="grid grid-cols-2 gap-2">
          <ActionButton variant="primary" onClick={onExportPDF} disabled={busy}>
            {I.pdf} Download PDF
          </ActionButton>
          <ActionButton variant="secondary" onClick={onExportPNG} disabled={busy}>
            {I.image} Export PNG
          </ActionButton>
        </div>
        <ActionButton
          variant="secondary"
          fullWidth
          onClick={onPrint}
          disabled={busy}
          title="Print to PDF at A4, 100% scale, default margins"
        >
          {I.print} Print / Browser PDF (A4 · 100% scale)
        </ActionButton>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <ActionButton variant="secondary" onClick={onSave}>
            {I.save} Save JSON
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => jsonInput.current?.click()}>
            {I.upload} Load JSON
          </ActionButton>
          <input
            ref={jsonInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onLoadFile(f)
              e.target.value = ''
            }}
          />
          <ActionButton variant="secondary" onClick={onCopy}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
            Copy Details
          </ActionButton>
          <ActionButton variant="danger" onClick={onReset}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset All
          </ActionButton>
        </div>
        <p className="pt-1 text-center text-[11px] text-slate-400">
          Work auto-saves in this browser as you type.
        </p>
      </SectionCard>
    </div>
  )
}
