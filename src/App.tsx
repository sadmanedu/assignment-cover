import { useMemo } from 'react';
import { useCover } from './store';
import { emblemDataUrl } from './lib/emblem';
import { Sheet } from './components/Sheet';
import { ControlsPanel } from './components/ControlsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ToastViewport } from './components/ui';

export default function App() {
  const cover = useCover();
  const emblemUrl = useMemo(() => emblemDataUrl(cover.accentColor), [cover.accentColor]);
  const logoUrl = cover.logoDataUrl ?? emblemUrl;

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-900 text-sm font-black text-white">
          AC
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight text-slate-800">
            Assignment Cover Studio
          </h1>
          <p className="truncate text-[11px] leading-tight text-slate-500">
            Live A4 cover designer · {cover.universityName || 'JAGANNATH UNIVERSITY, DHAKA'}
          </p>
        </div>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            A4 · 210 × 297 mm
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            PDF + PNG export
          </span>
        </div>
      </header>

      {/* Split screen: form left, live preview right */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ControlsPanel logoUrl={logoUrl} />
        <PreviewPanel />
      </main>

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
