import { useEffect, useMemo, useState } from 'react';
import { pickPersistable, useCover } from './store';
import { STORAGE_KEY } from './constants';
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
      className={`relative flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold transition-all duration-300 active:scale-95 ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-inner'
          : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
      }`}
    >
      <span aria-hidden>{icon}</span>
      {label}
      {active && <span className="absolute inset-x-8 bottom-1 h-1 rounded-full bg-white/90 animate-pulse" aria-hidden />}
    </button>
  );
}

export default function App() {
  const cover = useCover();
  const setCover = useCover((state) => state.set);
  const emblemUrl = useMemo(() => emblemDataUrl(cover.accentColor), [cover.accentColor]);

  // Restore the last cover as soon as the app starts, then keep it current in
  // local storage whenever the user edits a field or style. The explicit Save
  // button remains available for reassurance, but no action is required to
  // preserve work between visits.
  useEffect(() => {
    let restored = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { data?: Record<string, unknown>; settings?: Record<string, unknown> };
        setCover({ ...(saved.data ?? {}), ...(saved.settings ?? {}) });
        restored = true;
      }
    } catch {
      // Ignore malformed or unavailable storage and continue with defaults.
    }

    const unsubscribe = useCover.subscribe((state) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...pickPersistable(state) }));
      } catch {
        // Storage can be unavailable/full; the editor should remain usable.
      }
    });

    // Persist defaults for a first-time visitor, and ensure restored data is
    // normalized through the same persistence path.
    if (!restored) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...pickPersistable(useCover.getState()) }));
      } catch {
        // Ignore unavailable storage.
      }
    }
    return unsubscribe;
  }, [setCover]);
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
        <span className="flex items-center px-1 text-lg font-black text-indigo-400 transition-transform duration-300" aria-hidden>
          →
        </span>
        <TabButton
          active={mobileView === 'preview'}
          onClick={() => setMobileView('preview')}
          icon="📄"
          label="Preview"
        />
      </nav>

      {/*
        Off-screen, unscaled copy of the sheet used as the export/print source,
        so exports rasterize exact 1:1 A4 pixels and @media print shows only this.
      */}
      <div id="print-sheet" className="offscreen-sheet" aria-hidden="true">
        <Sheet {...cover} emblemUrl={emblemUrl} />
      </div>

      <ToastViewport />
    </div>
  );
}
