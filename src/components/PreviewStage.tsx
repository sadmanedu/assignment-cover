import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import CoverSheet, { SHEET_PX } from './CoverSheet'
import type { CoverState } from '../types'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.1

function ZoomButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-200 active:scale-95"
    >
      {children}
    </button>
  )
}

export default function PreviewStage({
  state,
  sheetRef,
}: {
  state: CoverState
  sheetRef: RefObject<HTMLDivElement>
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(0.6)
  // null = follow "fit" automatically; number = explicit user zoom
  const [zoom, setZoom] = useState<number | null>(null)

  const recomputeFit = () => {
    const el = stageRef.current
    if (!el) return
    const availW = el.clientWidth - 56
    const availH = el.clientHeight - 56
    const byWidth = availW / SHEET_PX.width
    const byHeight = availH / SHEET_PX.height
    setFitScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.min(byWidth, byHeight))))
  }

  useLayoutEffect(() => {
    recomputeFit()
    const ro = new ResizeObserver(recomputeFit)
    if (stageRef.current) ro.observe(stageRef.current)
    window.addEventListener('resize', recomputeFit)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', recomputeFit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(MAX_ZOOM, (z ?? fitScale) + ZOOM_STEP))
      if (e.key === '-') setZoom((z) => Math.max(MIN_ZOOM, (z ?? fitScale) - ZOOM_STEP))
      if (e.key === '0') setZoom(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fitScale])

  const scale = zoom ?? fitScale

  return (
    <div className="relative flex h-full flex-col bg-slate-300/60">
      {/* Toolbar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-3">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white/95 px-1.5 py-1 shadow-lg backdrop-blur">
          <ZoomButton
            label="Zoom out (−)"
            onClick={() => setZoom(Math.max(MIN_ZOOM, scale - ZOOM_STEP))}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 9.25h12v1.5H4z" />
            </svg>
          </ZoomButton>
          <button
            type="button"
            onClick={() => setZoom(null)}
            title="Reset to fit"
            className="min-w-[52px] rounded-md px-1 py-1 text-[12.5px] font-semibold tabular-nums text-slate-700 hover:bg-slate-200"
          >
            {Math.round(scale * 100)}%
          </button>
          <ZoomButton
            label="Zoom in (+)"
            onClick={() => setZoom(Math.min(MAX_ZOOM, scale + ZOOM_STEP))}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.25 4h1.5v4.25H15v1.5h-4.25V14h-1.5v-4.25H4v-1.5h4.25z" />
            </svg>
          </ZoomButton>
          <div className="mx-1 h-5 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="rounded-md px-2.5 py-1 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-200"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-md px-2 py-1 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-200"
          >
            100%
          </button>
        </div>
      </div>

      {/* Sheet stage */}
      <div
        id="preview-stage"
        ref={stageRef}
        className="nice-scroll h-full overflow-auto"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(100,116,139,0.35) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div
          id="sheet-scaler"
          style={{
            width: SHEET_PX.width * scale,
            height: SHEET_PX.height * scale,
            margin: '44px auto',
          }}
        >
          <div
            id="sheet-transform"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: SHEET_PX.width,
              height: SHEET_PX.height,
            }}
          >
            <CoverSheet state={state} sheetRef={sheetRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
