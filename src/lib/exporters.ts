import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BACKGROUNDS } from '../constants';
import type { BackgroundKey } from '../types';

function printSheetEl(): HTMLElement {
  const el = document.getElementById('print-sheet');
  if (!el) throw new Error('Sheet not found');
  return el;
}

interface CaptureOptions {
  backgroundKey: BackgroundKey;
}

async function capture(opts: CaptureOptions): Promise<HTMLCanvasElement> {
  const el = printSheetEl();
  return html2canvas(el, {
    scale: 2.5,
    backgroundColor: BACKGROUNDS[opts.backgroundKey].solid,
    useCORS: true,
    logging: false,
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Render the off-screen A4 sheet to a PNG download (~254 dpi). */
export async function exportPng(opts: CaptureOptions): Promise<void> {
  const canvas = await capture(opts);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
  if (!blob) throw new Error('PNG encoding failed');
  downloadBlob(blob, 'assignment-cover.png');
}

/** Render the off-screen A4 sheet into a true A4 (210×297mm) PDF at 100% scale. */
export async function exportPdf(opts: CaptureOptions): Promise<void> {
  const canvas = await capture(opts);
  const img = canvas.toDataURL('image/jpeg', 0.93);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.addImage(img, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  pdf.save('assignment-cover.pdf');
}
