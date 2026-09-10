import { useCallback, useEffect, useRef, useState } from 'react'
import ControlPanel from './components/ControlPanel'
import PreviewStage from './components/PreviewStage'
import { DEFAULT_STATE, STORAGE_KEY } from './defaults'
import type { CoverState } from './types'
import {
  buildDetailsText,
  downloadText,
  fileToLogoDataUrl,
  slugify,
} from './utils/helpers'
import { exportPDF, exportPNG, printSheet } from './utils/exportArtwork'

interface Toast {
  id: number
  message: string
  kind: 'success' | 'error'
}

function loadInitialState(): CoverState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<CoverState>
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return DEFAULT_STATE
  }
}

export default function App() {
  const [state, setState] = useState<CoverState>(loadInitialState)
  const [busy, setBusy] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const sheetRef = useRef<HTMLDivElement>(null)
  const toastId = useRef(0)

  const notify = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  const patch = useCallback((p: Partial<CoverState>) => {
    setState((s) => ({ ...s, ...p }))
  }, [])

  /* ------- auto-save (debounced) ------- */
  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* storage full / unavailable — ignore */
      }
    }, 500)
    return () => window.clearTimeout(handle)
  }, [state])

  /* ------- logo ------- */
  const onLogoFile = useCallback(
    async (file: File) => {
      try {
        const dataUrl = await fileToLogoDataUrl(file)
        patch({ logoDataUrl: dataUrl })
        notify('Logo uploaded.')
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Could not load logo.', 'error')
      }
    },
    [patch, notify],
  )

  const onResetLogo = useCallback(() => {
    patch({ logoDataUrl: null })
    notify('Restored the default Jagannath University logo.')
  }, [patch, notify])

  /* ------- data handlers ------- */
  const onSave = useCallback(() => {
    const payload = JSON.stringify({ app: 'jnu-cover-designer', version: 1, state }, null, 2)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
    downloadText(payload, `${slugify(state.assignmentTitle || 'cover-details')}.json`)
    notify('Details saved as JSON.')
  }, [state, notify])

  const onLoadFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onerror = () => notify('Could not read the file.', 'error')
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result))
          const incoming: Partial<CoverState> = parsed.state ?? parsed
          const merged: CoverState = { ...DEFAULT_STATE, ...incoming }
          setState(merged)
          notify('Details loaded from JSON.')
        } catch {
          notify('The selected file is not a valid cover-page JSON.', 'error')
        }
      }
      reader.readAsText(file)
    },
    [notify],
  )

  const onCopy = useCallback(async () => {
    const text = buildDetailsText(state)
    try {
      await navigator.clipboard.writeText(text)
      notify('Cover details copied to clipboard.')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        notify('Cover details copied to clipboard.')
      } catch {
        notify('Could not copy details.', 'error')
      }
      ta.remove()
    }
  }, [state, notify])

  const onReset = useCallback(() => {
    const ok = window.confirm('Reset every field and style back to the defaults?')
    if (ok) {
      setState(DEFAULT_STATE)
      notify('Workspace reset to defaults.')
    }
  }, [notify])

  /* ------- exports ------- */
  const guard = async (fn: () => Promise<void>, label: string) => {
    if (!sheetRef.current) return
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      notify(`Could not export ${label}.`, 'error')
    } finally {
      setBusy(false)
    }
  }

  const onExportPDF = useCallback(
    () =>
      guard(async () => {
        await exportPDF(sheetRef.current!, state)
        notify('PDF generated (A4 · 100% scale).')
      }, 'PDF'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, notify],
  )

  const onExportPNG = useCallback(
    () =>
      guard(async () => {
        await exportPNG(sheetRef.current!, state)
        notify('PNG image downloaded.')
      }, 'PNG'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, notify],
  )

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900 lg:flex-row">
      {/* ============ Controls ============ */}
      <aside className="flex max-h-[46vh] w-full flex-col border-b border-slate-200 bg-slate-50 lg:max-h-none lg:w-[404px] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <img
            src={`${import.meta.env.BASE_URL}jnu-logo.png`}
            alt="Jagannath University logo"
            className="h-10 w-10 rounded-full border border-slate-200 bg-white object-contain p-0.5"
          />
          <div className="leading-tight">
            <h1 className="text-[14.5px] font-extrabold tracking-tight text-slate-800">
              Assignment Cover Page Designer
            </h1>
            <p className="text-[11.5px] font-medium text-slate-500">
              Jagannath University, Dhaka
            </p>
          </div>
          {busy && (
            <div className="ml-auto" role="status" aria-label="working">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
            </div>
          )}
        </div>

        <div className="nice-scroll flex-1 overflow-y-auto p-3.5">
          <ControlPanel
            state={state}
            patch={patch}
            onLogoFile={onLogoFile}
            onResetLogo={onResetLogo}
            onSave={onSave}
            onLoadFile={onLoadFile}
            onCopy={onCopy}
            onReset={onReset}
            onExportPNG={onExportPNG}
            onExportPDF={onExportPDF}
            onPrint={printSheet}
            busy={busy}
          />
        </div>
      </aside>

      {/* ============ Live preview ============ */}
      <main className="relative min-h-0 flex-1">
        <PreviewStage state={state} sheetRef={sheetRef} />
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-white/90">
          Live A4 preview · 210 × 297 mm
        </div>
      </main>

      {/* ============ Toasts ============ */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg px-4 py-2 text-[13px] font-semibold text-white shadow-xl ${
              t.kind === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
