import { JSDOM } from 'jsdom'

const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost:5173/', pretendToBeVisual: true },
)
const { window } = dom

const passthrough = [
  'document', 'navigator', 'HTMLElement', 'Node', 'Element', 'Image',
  'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'getComputedStyle',
  'HTMLInputElement', 'HTMLSelectElement',
  'localStorage', 'sessionStorage', 'XMLHttpRequest', 'URL', 'Blob',
  'FileReader', 'HTMLCanvasElement', 'DOMParser', 'MutationObserver',
  'requestAnimationFrame', 'cancelAnimationFrame',
]
for (const k of passthrough) {
  const v = window[k]
  if (v === undefined) continue
  const value = typeof v === 'function' ? v.bind(window) : v
  try {
    globalThis[k] = value
  } catch {
    Object.defineProperty(globalThis, k, { configurable: true, value })
  }
}
globalThis.window = window
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub
globalThis.ResizeObserver = ResizeObserverStub
if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  })
}
window.HTMLElement.prototype.scrollIntoView = () => {}

await import('./bundle.mjs')
await new Promise((r) => setTimeout(r, 900))

process.exit(globalThis.__SMOKE_FAILED__ ? 1 : 0)
