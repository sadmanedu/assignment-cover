import { useEffect, useState, type ReactNode } from 'react';
import { useToast } from '../lib/toast';

export function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="panel-section">
      <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-slate-800">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-50 text-sm" aria-hidden>
          {icon}
        </span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
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
