/**
 * Font plumbing for the export pipeline.
 *
 * The PNG/PDF exports rasterize the sheet by serializing it into an SVG
 * `<foreignObject>` and letting the browser draw that SVG into a canvas. Text in
 * that SVG is only correct if the *font files* travel with it: an SVG document
 * has no access to the page's font cache, so every `@font-face` used by the
 * sheet has to be re-declared inside the SVG with its sources inlined.
 *
 * `html-to-image` does try to do that on its own, but it walks
 * `document.styleSheets`, which throws `SecurityError` for cross-origin
 * stylesheets (Google Fonts) — and then it re-downloads every font file at click
 * time. When that re-download fails (offline, blocked CDN, CSP, slow network,
 * a sandboxed iframe) the capture silently renders with a *system* font: the
 * download no longer matches the preview, and because the fallback has different
 * metrics every paragraph re-flows and the line breaks move.
 *
 * So we build the font CSS ourselves, before the capture:
 *   1. self-hosted fonts (src/fonts.css) are same-origin, so their rules are
 *      always readable and their files are always in the HTTP cache, and
 *   2. every font used by the sheet is inlined as a `data:` URL, which means the
 *      capture needs *zero* network requests and cannot silently degrade.
 */

/** Computed font family → normalized (unquoted, lowercase) name. */
function normalizeFamily(family: string): string {
  return family.replace(/["']/g, '').trim().toLowerCase();
}

/** Quote a family name for use in a CSS font shorthand. */
function quoteFamily(family: string): string {
  return /^[a-z-]+$/i.test(family) ? family : `'${family.replace(/'/g, "\\'")}'`;
}

interface UsedFace {
  style: string;
  weight: string;
  family: string;
}

/**
 * The `(style, weight, family)` triples that can be rendered inside `root`.
 *
 * Every family of the computed stack is included, not just the first one: CSS
 * falls back *per glyph*, so a Bengali cover renders its Bengali runs with
 * 'Anek Bangla' — the second entry of the stack — while Latin stays in Inter.
 * Emitting only the first family is exactly how the Bengali text ends up in a
 * fallback face (and re-flowed lines) in the capture.
 */
export function collectUsedFaces(root: HTMLElement): UsedFace[] {
  const faces = new Map<string, UsedFace>();
  const add = (el: Element) => {
    const cs = getComputedStyle(el);
    const style = cs.fontStyle || 'normal';
    const weight = cs.fontWeight || '400';
    for (const family of cs.fontFamily.split(',')) {
      const name = normalizeFamily(family);
      if (!name) continue;
      faces.set(`${style}|${weight}|${name}`, { style, weight, family: name });
    }
  };

  add(root);
  root.querySelectorAll('*').forEach(add);
  return [...faces.values()];
}

/**
 * Make sure every face the sheet needs is actually loaded before we capture.
 * `document.fonts.ready` alone is not enough: it only waits for faces that were
 * requested *before* the call, so a face that has not been rendered yet (e.g.
 * the Bengali subset, or a weight only used by a heading) can still be pending.
 */
export async function ensureSheetFontsLoaded(root: HTMLElement): Promise<void> {
  if (!document.fonts) return;
  const text = root.textContent ?? '';
  const loads = collectUsedFaces(root).map(
    ({ style, weight, family }) =>
      // A face whose file is unreachable must not block the export.
      document.fonts.load(`${style} ${weight} 16px ${quoteFamily(family)}`, text).catch(() => [] as FontFace[]),
  );
  await withTimeout(Promise.all(loads), 8000);
  try {
    await withTimeout(document.fonts.ready, 8000);
  } catch {
    // Non-fatal: the capture still renders, just possibly with a fallback face.
  }
  await settleLayout(root);
}

/**
 * Wait until the sheet has actually been laid out with the loaded faces.
 *
 * A face that finishes loading only marks style as dirty; the sheet is re-laid
 * out on the next rendering opportunity. Until then the DOM still holds the
 * `font-display: swap` fallback metrics — and an export started in that window
 * (type a title, hit PNG) would freeze the fallback's line breaks while rendering
 * the real font's glyphs. Reading a layout property forces the recalculation
 * synchronously, and the two frames let the paint catch up.
 */
async function settleLayout(root: HTMLElement): Promise<void> {
  void root.offsetHeight;
  await new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      resolve();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  void root.offsetHeight;
}

/** Never let a stuck font request hold the export hostage. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err as Error);
      },
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Embedding font files as data URLs                                  */
/* ------------------------------------------------------------------ */

const dataUrlCache = new Map<string, Promise<string>>();

function resourceToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return Promise.resolve(url);

  const absolute = new URL(url, document.baseURI).href;
  const cached = dataUrlCache.get(absolute);
  if (cached) return cached;

  const promise = (async () => {
    // The preview has already fetched this exact file, so `force-cache` keeps
    // the export working with no network at all.
    const res = await fetch(absolute, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${absolute}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${absolute}`));
      reader.readAsDataURL(blob);
    });
  })();

  dataUrlCache.set(absolute, promise);
  // Never cache a failure — the next export should be able to retry.
  promise.catch(() => dataUrlCache.delete(absolute));
  return promise;
}

/** Every `@font-face` rule the given faces need, with the files inlined. */
async function buildFontEmbedCss(faces: UsedFace[]): Promise<string> {
  const wantedFamilies = new Set(faces.map((f) => f.family));
  const rules: string[] = [];
  const seen = new Set<string>();

  for (const sheet of Array.from(document.styleSheets)) {
    let cssRules: CSSRuleList | null = null;
    try {
      cssRules = sheet.cssRules;
    } catch {
      // Cross-origin stylesheet: unreadable, and nothing we need — our own
      // faces live in same-origin sheets. (This is the case that used to make
      // the export drop its fonts.)
      continue;
    }
    if (!cssRules) continue;

    for (const rule of Array.from(cssRules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;

      const family = normalizeFamily(rule.style.getPropertyValue('font-family'));
      if (!family || !wantedFamilies.has(family)) continue;

      const urls = Array.from(rule.cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g)).map((m) => m[2]);
      if (urls.length === 0) continue;

      let cssText = rule.cssText;
      let usable = true;
      for (const url of urls) {
        try {
          cssText = cssText.split(url).join(await resourceToDataUrl(url));
        } catch {
          usable = false; // Skip the whole face rather than embed it half-broken.
          break;
        }
      }
      if (!usable || seen.has(cssText)) continue;
      seen.add(cssText);
      rules.push(cssText);
    }
  }

  return rules.join('\n');
}

/** Cache of built CSS, keyed by the exact set of faces it covers. */
const embedCssCache = new Map<string, Promise<string>>();
const EMBED_CACHE_LIMIT = 8;

/**
 * Font CSS for the export: `@font-face` rules with the files inlined as data
 * URLs, so the capture needs no network access and cannot drop the webfonts.
 *
 * Resolves to `''` when nothing could be embedded, which tells the caller to let
 * `html-to-image` fall back to its own (network-dependent) font handling.
 */
export function getFontEmbedCss(root: HTMLElement): Promise<string> {
  const faces = collectUsedFaces(root);
  // Key by the faces in play: switching the typography (or adding Bengali text)
  // must not reuse a CSS bundle that is missing those families.
  const key = faces
    .map((f) => `${f.style}|${f.weight}|${f.family}`)
    .sort()
    .join(',');

  let promise = embedCssCache.get(key);
  if (!promise) {
    promise = buildFontEmbedCss(faces).catch((err) => {
      console.warn('[export] could not build the embedded font CSS:', err);
      return '';
    });
    embedCssCache.set(key, promise);
    if (embedCssCache.size > EMBED_CACHE_LIMIT) {
      const oldest = embedCssCache.keys().next().value;
      if (oldest !== undefined) embedCssCache.delete(oldest);
    }
  }
  return promise;
}
