/**
 * Line-break freezing for the export capture.
 *
 * The export re-renders the sheet inside an SVG `<foreignObject>`, so the
 * browser lays the text out a second time — with its own glyph advances. Screen
 * text and SVG-image text can round advances differently (on Linux, on-screen
 * text snaps every advance to whole CSS pixels while the rasterized copy keeps
 * fractional ones), so a paragraph that sits close to its wrap point can break
 * on a *different word* in the download than in the preview.
 *
 * The fix is to stop re-deciding: measure where the live preview actually broke
 * each line, write those breaks into the export sheet as real newlines, and
 * restore the markup right after the capture. The download then shows exactly
 * the line breaks the user sees — the remaining spacing drift (well under a
 * pixel per space) can no longer change how the text flows.
 */

/** Visual lines of a text node, as the browser laid them out on screen. */
function visualLines(node: Text): string[] {
  const text = node.data;
  const range = document.createRange();
  const lines: { top: number; from: number; to: number }[] = [];

  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rect = range.getBoundingClientRect();
    const last = lines[lines.length - 1];

    // Zero-size rects (a space that got hung at the end of a line) stay on the
    // line they belong to instead of starting a new one.
    if (rect.width === 0 && rect.height === 0) {
      if (last) last.to = i + 1;
      continue;
    }

    if (last && Math.abs(Math.round(rect.top) - last.top) <= 1) {
      last.to = i + 1;
    } else {
      lines.push({ top: Math.round(rect.top), from: i, to: i + 1 });
    }
  }

  return lines.map((line) => text.slice(line.from, line.to).replace(/\s+/g, ' ').trim());
}

/**
 * Writes the live line breaks into the sheet as explicit newlines.
 * Returns a restore function; call it in a `finally` after the capture.
 */
export function freezeLineBreaks(root: HTMLElement): () => void {
  const restores: (() => void)[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    if (!node.data.trim()) continue;
    const parent = node.parentElement;
    if (!parent) continue;

    // Only blocks that actually wrap are worth freezing.
    const whiteSpace = getComputedStyle(parent).whiteSpace;
    if (whiteSpace === 'pre' || whiteSpace === 'nowrap') continue;

    const lines = visualLines(node);
    if (lines.length < 2) continue;

    const previousText = node.data;
    const previousWhiteSpace = parent.style.whiteSpace;
    parent.style.whiteSpace = 'pre-line';
    node.data = lines.join('\n');

    restores.push(() => {
      node.data = previousText;
      parent.style.whiteSpace = previousWhiteSpace;
    });
  }

  return () => {
    for (const restore of restores.reverse()) restore();
  };
}
