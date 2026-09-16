import html2canvas from 'html2canvas';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { BACKGROUNDS } from '../constants';
import type { BackgroundKey } from '../types';

/** Supersample factor. The sheet is 793.7 CSS px wide (210 mm @ 96 dpi), so 2× ≈ 192 dpi. */
const SCALE = 2;

interface CaptureOptions {
  backgroundKey: BackgroundKey;
}

function getSheetTarget(): HTMLElement {
  const wrapper = document.getElementById('print-sheet');
  if (!wrapper) throw new Error('Sheet not found (missing #print-sheet)');
  // The actual A4 sheet is the first child div inside #print-sheet.
  // Capturing the inner sheet is more reliable than the fixed-position wrapper.
  const inner = wrapper.firstElementChild as HTMLElement | null;
  if (inner && inner instanceof HTMLElement) return inner;
  return wrapper;
}

function getWrapper(): HTMLElement | null {
  return document.getElementById('print-sheet');
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        // safety timeout
        setTimeout(done, 3000);
      });
    }),
  );
}

/* ------------------------------------------------------------------ */
/*  Primary renderer — the browser's own layout & paint engine        */
/* ------------------------------------------------------------------ */

/**
 * Rasterize the sheet by serializing it into an SVG `<foreignObject>` and letting
 * the browser draw it into a canvas — i.e. the exact same engine that renders the
 * live preview, so the download is a faithful copy of what the user sees.
 *
 * This replaced html2canvas as the primary renderer: html2canvas re-implements
 * layout and text baselines, and it painted text runs below their real position —
 * which left the university name sitting on top of the accent rule drawn under it,
 * with the preview's gap gone. Re-using the preview's own engine for export makes
 * that class of drift impossible.
 */
async function renderWithBrowser(target: HTMLElement, opts: CaptureOptions): Promise<HTMLCanvasElement> {
  const canvas = await toCanvas(target, {
    pixelRatio: SCALE,
    backgroundColor: BACKGROUNDS[opts.backgroundKey].solid,
    // Fonts & images are already in the HTTP cache — never bust it, otherwise an
    // export made while offline could silently fall back to a system font.
    cacheBust: false,
  });
  if (!canvas.width || !canvas.height) {
    throw new Error('Rasterization produced an empty image');
  }
  return canvas;
}

/* ------------------------------------------------------------------ */
/*  Fallback renderer — html2canvas                                   */
/* ------------------------------------------------------------------ */

/**
 * Used only if the browser rasterization above fails, so a download is always
 * produced. html2canvas paints text slightly lower than the browser does, so
 * this path is deliberately the exception, never the default.
 */
async function renderWithHtml2Canvas(target: HTMLElement, opts: CaptureOptions): Promise<HTMLCanvasElement> {
  const wrapper = getWrapper();

  // Temporarily make the wrapper visible on-screen for html2canvas.
  // html2canvas can struggle with elements far off-screen (left:-220vw) or with z-index:-10.
  // We move it to 0,0 with high z-index but invisible to user via opacity 0 and pointer-events none,
  // but html2canvas will still render because we set backgroundColor.
  // To avoid a flash, we also set transform to scale(0.01) and then rely on onclone to restore scale.
  let restoreWrapper: (() => void) | null = null;
  if (wrapper) {
    const prevCssText = wrapper.getAttribute('style') || '';
    const prevClass = wrapper.className;
    // Save original inline style
    const originalLeft = wrapper.style.left;
    const originalTop = wrapper.style.top;
    const originalOpacity = wrapper.style.opacity;
    const originalZIndex = wrapper.style.zIndex;
    const originalPointerEvents = wrapper.style.pointerEvents;
    const originalVisibility = wrapper.style.visibility;
    const originalTransform = wrapper.style.transform;

    // Make it renderable
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.opacity = '0'; // keep invisible to user, but html2canvas backgroundColor will fill
    wrapper.style.zIndex = '9999';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.visibility = 'visible';
    wrapper.style.transform = 'none';

    restoreWrapper = () => {
      if (prevCssText) wrapper.setAttribute('style', prevCssText);
      else wrapper.removeAttribute('style');
      wrapper.className = prevClass;
      // restore individual to be safe
      wrapper.style.left = originalLeft;
      wrapper.style.top = originalTop;
      wrapper.style.opacity = originalOpacity;
      wrapper.style.zIndex = originalZIndex;
      wrapper.style.pointerEvents = originalPointerEvents;
      wrapper.style.visibility = originalVisibility;
      wrapper.style.transform = originalTransform;
    };
  }

  try {
    const canvas = await html2canvas(target, {
      scale: SCALE,
      backgroundColor: BACKGROUNDS[opts.backgroundKey].solid,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 15000,
      // Ensure the cloned document has the sheet visible
      onclone: (clonedDoc) => {
        const clonedWrapper = clonedDoc.getElementById('print-sheet') as HTMLElement | null;
        if (clonedWrapper) {
          clonedWrapper.style.left = '0';
          clonedWrapper.style.top = '0';
          clonedWrapper.style.opacity = '1';
          clonedWrapper.style.zIndex = '1';
          clonedWrapper.style.pointerEvents = 'none';
          clonedWrapper.style.visibility = 'visible';
          clonedWrapper.style.transform = 'none';
          clonedWrapper.style.position = 'fixed';
        }
        const clonedTarget = clonedWrapper?.firstElementChild as HTMLElement | null;
        if (clonedTarget) {
          clonedTarget.style.opacity = '1';
          clonedTarget.style.visibility = 'visible';
          clonedTarget.style.transform = 'none';
        }
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas capture produced empty image');
    }

    return canvas;
  } finally {
    if (restoreWrapper) restoreWrapper();
  }
}

/* ------------------------------------------------------------------ */
/*  Shared capture pipeline                                            */
/* ------------------------------------------------------------------ */

async function renderSheet(opts: CaptureOptions): Promise<HTMLCanvasElement> {
  const target = getSheetTarget();

  // Ensure fonts are ready
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  await waitForImages(target);

  try {
    return await renderWithBrowser(target, opts);
  } catch (err) {
    console.warn('[export] browser rasterization failed — falling back to html2canvas:', err);
    return await renderWithHtml2Canvas(target, opts);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  // Use MouseEvent for better compatibility
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  // Fallback
  try {
    a.click();
  } catch {
    // ignore
  }
  setTimeout(() => {
    try {
      a.remove();
    } catch {}
    URL.revokeObjectURL(url);
  }, 4000);
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, type, quality),
  );
  if (blob) return blob;
  // Fallback via dataURL -> fetch
  const dataUrl = canvas.toDataURL(type, quality);
  const response = await fetch(dataUrl);
  return await response.blob();
}

/** Render the off-screen A4 sheet to a PNG download (~192 dpi). */
export async function exportPng(opts: CaptureOptions): Promise<void> {
  const canvas = await renderSheet(opts);
  let blob: Blob;
  try {
    blob = await canvasToBlob(canvas, 'image/png');
  } catch (e) {
    throw new Error(`PNG encoding failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!blob || blob.size === 0) throw new Error('PNG encoding failed (empty blob)');
  downloadBlob(blob, 'assignment-cover.png');
}

/** Render the off-screen A4 sheet into a true A4 (210×297mm) PDF at 100% scale. */
export async function exportPdf(opts: CaptureOptions): Promise<void> {
  const canvas = await renderSheet(opts);
  let imgData: string;
  try {
    imgData = canvas.toDataURL('image/jpeg', 0.92);
  } catch (e) {
    // If canvas is tainted, toDataURL throws SecurityError
    if (e instanceof DOMException && e.name === 'SecurityError') {
      throw new Error(
        'Canvas is tainted by a cross-origin image. Try re-uploading the logo or using the default crest.',
      );
    }
    throw e;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Add image to fill full A4 page
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

  // Try native save, fallback to blob download
  try {
    pdf.save('assignment-cover.pdf');
  } catch {
    const pdfBlob = pdf.output('blob');
    downloadBlob(pdfBlob, 'assignment-cover.pdf');
  }
}
