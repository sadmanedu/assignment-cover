import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCover } from '../store';
import { A4 } from '../constants';
import { emblemDataUrl } from '../lib/emblem';
import { toast } from '../lib/toast';
import { clamp } from '../lib/format';
import { Sheet } from './Sheet';

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;

export function PreviewPanel({ mobileVisible }: { mobileVisible: boolean }) {
  const cover = useCover();
  const [zoom, setZoom] = useState(0.85);
  const [autoFit, setAutoFit] = useState(true);
  const [busy, setBusy] = useState<null | 'png' | 'pdf'>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoFitRef = useRef(autoFit);
  autoFitRef.current = autoFit;

  const emblemUrl = useMemo(() => emblemDataUrl(cover.accentColor), [cover.accentColor]);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const pad = 64;
    const z = Math.min(
      (el.clientWidth - pad) / A4.wPx,
      (el.clientHeight - pad) / A4.hPx,
    );
    setZoom(clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX));
  }, []);

  /* Auto-fit on mount and on container resize (until the user zooms manually). */
  useEffect(() => {
    if (autoFit) fit();
  }, [autoFit, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (autoFitRef.current) fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  const userZoom = (delta: number) => {
    setAutoFit(false);
    setZoom((z) => clamp(Math.round((z + delta) * 100) / 100, ZOOM_MIN, ZOOM_MAX));
  };

  const download = async (kind: 'png' | 'pdf') => {
    if (busy) return;
    setBusy(kind);
    try {
      await document.fonts.ready;
      // Lazy-load the heavy export stack (rasterizer + jsPDF) on demand.
      const { exportPdf, exportPng } = await import('../lib/exporters');
      if (kind === 'png') await exportPng({ backgroundKey: cover.backgroundKey });
      else await exportPdf({ backgroundKey: cover.backgroundKey });
      toast(kind === 'png' ? 'PNG downloaded' : 'PDF downloaded (A4, 100% scale)', 'ok');
    } catch (err) {
      console.error(err);
      toast(`Export failed: ${err instanceof Error ? err.message : 'unknown error'}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={`flex min-h-0 min-w-0 flex-1 flex-col ${mobileVisible ? 'mobile-pane-in' : 'hidden'} lg:flex`}>
      {/* Toolbar */}
      <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-1.5 gap-y-1 border-b border-slate-200 bg-white px-3 py-1.5 sm:gap-2 sm:px-4 sm:py-0">
        <button type="button" className="btn" title="Fit sheet to window" onClick={() => { setAutoFit(true); fit(); }}>
          Fit
        </button>
        <button type="button" className="btn w-9" title="Zoom out" onClick={() => userZoom(-ZOOM_STEP)}>
          −
        </button>
        <span className="w-12 text-center text-xs font-bold tabular-nums text-slate-600">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" className="btn w-9" title="Zoom in" onClick={() => userZoom(ZOOM_STEP)}>
          +
        </button>
        <span className="ml-2 hidden text-[11px] text-slate-400 md:inline">
          A4 · 210 × 297 mm · exports at 100% scale
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="btn"
            disabled={busy !== null}
            onClick={() => download('png')}
            title="Download the sheet as a PNG image"
          >
            {busy === 'png' ? 'Rendering…' : '⬇ PNG'}
          </button>
          <button
            type="button"
            className="btn"
            disabled={busy !== null}
            onClick={() => download('pdf')}
            title="Download the sheet as an A4 PDF"
          >
            {busy === 'pdf' ? 'Rendering…' : '⬇ PDF'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            title="Print with 100% scale and default margins"
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* Dotted preview canvas */}
      <div ref={containerRef} className="preview-bg min-h-0 flex-1 overflow-auto">
        <div className="mx-4 mt-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 text-center text-[11px] font-semibold text-indigo-700 shadow-sm sm:hidden">
          ✨ To edit this page, go to the <span className="font-extrabold">Details</span> tab below.
        </div>
        <div className="flex min-h-full items-start justify-center p-4 sm:p-8">
          <div
            className="relative shrink-0"
            style={{ width: A4.wPx * zoom, height: A4.hPx * zoom }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: '210mm',
              }}
            >
              <div className="shadow-[0_12px_45px_rgba(15,23,42,0.28)]">
                <Sheet {...cover} emblemUrl={emblemUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden shrink-0 border-t border-slate-200 bg-white px-4 py-1.5 text-[11px] text-slate-400 sm:block">
        PDF/PNG render at 100% scale on a true A4 page — use default printer margins.
      </div>
    </section>
  );
}
