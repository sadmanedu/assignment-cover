import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import type { StyleOption } from '../types'

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 placeholder:text-slate-400'

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} resize-none ${props.className ?? ''}`} />
}

export function SelectInput<T extends string>({
  options,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { options: StyleOption<T>[] }) {
  return (
    <select {...rest} className={`${inputClass} cursor-pointer appearance-none pr-8`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function SectionCard({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-t-xl px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 [details[open]_&]:rounded-b-none">
        {icon && <span className="text-indigo-600">{icon}</span>}
        <span className="flex-1">{title}</span>
        <svg
          className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="space-y-3.5 border-t border-slate-100 p-4">{children}</div>
    </details>
  )
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: StyleOption<T>[]
  onChange: (v: T) => void
  ariaLabel?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-[12px] font-semibold"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2 py-1.5 transition ${
            value === o.value
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ActionButton({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  title,
  fullWidth,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  title?: string
  fullWidth?: boolean
}) {
  const styles: Record<string, string> = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:bg-indigo-300',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm disabled:text-slate-400',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-200',
    danger: 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-sm',
  }
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition disabled:cursor-not-allowed ${
        fullWidth ? 'w-full' : ''
      } ${styles[variant]}`}
    >
      {children}
    </button>
  )
}
