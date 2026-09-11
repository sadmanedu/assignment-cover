import { useEffect, useState, type ReactNode } from 'react';
import { useToast } from '../lib/toast';

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-slate-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-3.5 text-left transition hover:bg-slate-50"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-blue-50 text-sm" aria-hidden>
          {icon}
        </span>
        <span className="text-[13px] font-bold text-slate-800">{title}</span>
        <svg
          className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
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
      {open && <div className="space-y-3 px-5 pb-4">{children}</div>}
    </section>
  );
}

export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
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
