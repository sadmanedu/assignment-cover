import { useMemo, useState } from 'react';
import { useCover } from './store';
import { emblemDataUrl } from './lib/emblem';
import { Sheet } from './components/Sheet';
import { ControlsPanel } from './components/ControlsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ToastViewport } from './components/ui';

type MobileView = 'form' | 'preview';

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition ${
        active ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
      {active && <span className="absolute inset-x-10 top-0 h-0.5 rounded-full bg-blue-600" aria-hidden />}
    </button>
  );
}

export default function App() {
  const cover = useCover();
  const emblemUrl = useMemo(() => emblemDataUrl(cover.accentColor), [cover.accentColor]);
  const logoUrl = cover.logoDataUrl ?? emblemUrl;

  // On phones the workspace is single-pane: switch between the form and the
  // live sheet with the bottom tab bar. On lg+ both panes are always shown.
  const [mobileView, setMobileView] = useState<MobileView>('preview');

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-900 text-sm font-black text-white">
          N
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight text-slate-800">
            Nexora Cover Design
          </h1>
          <p className="hidden truncate text-[11px] leading-tight text-slate-500 min-[420px]:block">
            Live A4 cover designer · {cover.universityName || 'JAGANNATH UNIVERSITY, DHAKA'}
          </p>
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            A4 · 210 × 297 mm
          </span>
          <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 md:inline">
            PDF + PNG export
          </span>
        </div>
      </header>

      {/* Split screen on desktop, single pane on mobile */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ControlsPanel logoUrl={logoUrl} mobileVisible={mobileView === 'form'} />
        <PreviewPanel mobileVisible={mobileView === 'preview'} />
      </main>

      {/* Mobile tab bar */}
      <nav className="flex shrink-0 border-t border-slate-200 bg-white lg:hidden" aria-label="Switch view">
        <TabButton
          active={mobileView === 'form'}
          onClick={() => setMobileView('form')}
          icon="📝"
          label="Details"
        />
        <TabButton
          active={mobileView === 'preview'}
          onClick={() => setMobileView('preview')}
          icon="📄"
          label="Preview"
        />
      </nav>

      {/*
        Off-screen, unscaled copy of the sheet used as the export/print source,
        so html2canvas captures exact 1:1 A4 pixels and @media print shows only this.
      */}
      <div id="print-sheet" className="offscreen-sheet" aria-hidden="true">
        <Sheet {...cover} emblemUrl={emblemUrl} />
      </div>

      <ToastViewport />
    </div>
  );
}
