/* Smoke test: render the app in jsdom via Vite's module loader and check key markup. */
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
});

for (const key of ['window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Element', 'Node', 'getComputedStyle', 'CSS']) {
  try {
    Object.defineProperty(globalThis, key, {
      value: dom.window[key === 'getComputedStyle' ? 'getComputedStyle' : key],
      configurable: true,
      writable: true,
    });
  } catch {}
}
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

let failed = false;
try {
  await vite.ssrLoadModule('/src/main.tsx');
  await new Promise((r) => setTimeout(r, 800));
  const root = dom.window.document.getElementById('root');
  const html = root.innerHTML;
  const checks = [
    ['app header rendered', html.includes('Assignment Cover Studio')],
    ['university name on sheet', html.includes('JAGANNATH UNIVERSITY, DHAKA')],
    ['department block', html.includes('Department of Computer Science')],
    ['submitted-to label', html.toLowerCase().includes('submitted to')],
    [
      'assignment title before submitted-to (on sheet)',
      html.indexOf('An Assignment on') < html.lastIndexOf('Submitted To'),
    ],
    ['assignment title', html.includes('Binary Search Trees')],
    ['submitted-by label', html.toLowerCase().includes('submitted by')],
    ['date of submission', html.includes('Date of Submission')],
    ['zoom toolbar (Fit)', html.includes('Fit')],
    ['export buttons', html.includes('PNG') && html.includes('PDF') && html.includes('Print')],
    ['JNU crest on sheet', html.includes('/jnu-logo.png')],
    ['JNU crest in logo panel', html.includes('jnu-logo.png')],
  ];
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) failed = true;
  }
} catch (err) {
  console.error('RENDER ERROR:', err);
  failed = true;
} finally {
  await vite.close();
}
process.exit(failed ? 1 : 0);
