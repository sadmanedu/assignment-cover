import { SHEET_PX } from '../components/CoverSheet'
import { BACKGROUND_COLORS } from '../options'
import type { CoverState } from '../types'
import { downloadBlob, slugify } from './helpers'

async function renderSheet(sheet: HTMLElement, state: CoverState, scale: number) {
  // Heavy export libraries are code-split and only fetched on demand.
  const { default: html2canvas } = await import('html2canvas')

  // html2canvas renders the target node itself, so the preview zoom transform
  // (which lives on a wrapper) never affects the exported artwork.
  const canvas = await html2canvas(sheet, {
    scale,
    width: SHEET_PX.width,
    height: SHEET_PX.height,
    windowWidth: SHEET_PX.width + 80,
    windowHeight: SHEET_PX.height + 80,
    backgroundColor: BACKGROUND_COLORS[state.background],
    useCORS: true,
    allowTaint: false,
    logging: false,
  })
  return canvas
}

export async function exportPNG(sheet: HTMLElement, state: CoverState) {
  const canvas = await renderSheet(sheet, state, 3) // ~288 dpi
  canvas.toBlob((blob) => {
    if (!blob) throw new Error('Failed to encode PNG')
    downloadBlob(blob, `${slugify(state.assignmentTitle || 'assignment-cover')}.png`)
  }, 'image/png')
}

export async function exportPDF(sheet: HTMLElement, state: CoverState) {
  // Standard A4, 100% scale, zero page margins — the sheet is exactly A4 ratio.
  const { jsPDF } = await import('jspdf')
  const canvas = await renderSheet(sheet, state, 3) // ~288 dpi
  const img = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
  pdf.addImage(img, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
  pdf.save(`${slugify(state.assignmentTitle || 'assignment-cover')}.pdf`)
}

export function printSheet() {
  window.print()
}
