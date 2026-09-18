import { useEffect, useState, type ReactNode } from 'react';
import { useToast } from '../lib/toast';

/**
 * Collapsible form section. The header stays compact (one line) and can carry a
 * completion badge, so the whole panel can be scanned without opening everything.
 */
export function Section({
  title,
  icon,
  badge,
  note,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  badge?: ReactNode;
  note?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3.5 py-2 text-left transition hover:bg-slate-50"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-50 text-[13px]" aria-hidden>
          {icon}
        </span>
        <span className="min-w-0 text-[13px] font-bold text-slate-800">{title}</span>
        {note && <span className="truncate text-[11px] text-slate-400">{note}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {badge}
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {open && <div className="space-y-2 px-3.5 pb-3">{children}</div>}
    </section>
  );
}

/**
 * One labelled control. `hint` sits on the label line (right-aligned) so it adds
 * no height, and `optional` marks fields whose line disappears from the cover
 * when left empty.
 */
export function Field({
  label,
  hint,
  optional = false,
  className = '',
  children,
}: {
  label: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">
        <span className="min-w-0 truncate">{label}</span>
        {optional && (
          <span
            className="hidden shrink-0 font-medium normal-case tracking-normal text-slate-400 min-[380px]:inline"
            title="Left off the cover when empty"
          >
            optional
          </span>
        )}
        {hint && <span className="shrink-0 font-medium normal-case tracking-normal text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Evenly spaced columns for compact field rows. */
export function FieldRow({
  cols = 2,
  children,
}: {
  cols?: 2 | 3 | 'wide-narrow';
  children: ReactNode;
}) {
  // Phones keep one field per row (roomy tap targets); from 640px up the fields
  // sit side by side, which is what makes the panel short enough to scan.
  // NOTE: the class names must appear literally here — Tailwind scans this file
  // and would miss a class assembled from a variable.
  const layout =
    cols === 3
      ? 'sm:grid-cols-3'
      : cols === 'wide-narrow'
        ? 'sm:grid-cols-[minmax(0,1fr)_92px]'
        : 'sm:grid-cols-2';
  return <div className={`grid gap-2 ${layout}`}>{children}</div>;
}

/** A collapsed group of finer controls, with a one-line summary of the choices. */
export function Disclosure({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50"
      >
        <span className="text-[12px] font-semibold text-slate-700">{title}</span>
        {!open && summary && <span className="ml-auto truncate text-[11px] text-slate-400">{summary}</span>}
        <svg
          className={`${open ? 'ml-auto rotate-180' : ''} h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="space-y-2.5 px-2.5 pt-1 pb-2.5">{children}</div>}
    </div>
  );
}

/** Small "n of m filled" pill used in the section headers. */
export function CountBadge({ filled, total }: { filled: number; total: number }) {
  const done = filled >= total;
  return (
    <span
      title={`${filled} of ${total} fields filled`}
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
        done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      {done ? 'done' : `${filled}/${total}`}
    </span>
  );
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`seg ${
            value === o.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToastViewport() {
  const { msg, kind, id } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (id === null) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [id]);

  if (!visible || !msg) return null;
  const styles =
    kind === 'ok'
      ? 'bg-emerald-600 text-white'
      : kind === 'error'
        ? 'bg-rose-600 text-white'
        : 'bg-slate-800 text-white';
  return (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg ${styles}`}
    >
      {msg}
    </div>
  );
}
