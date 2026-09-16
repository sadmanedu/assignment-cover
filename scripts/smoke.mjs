/* Smoke test: render the app in jsdom via Vite's module loader and check key markup. */
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/* Guards for the export fidelity fixes (fonts + line breaks in PNG/PDF). */
const fontCss = read('src/fonts.css');
const exporters = read('src/lib/exporters.ts');
const html = read('index.html');
const staticChecks = [
  ['fonts are self-hosted (no Google Fonts link)', !html.includes('fonts.googleapis.com')],
  ['fonts.css declares Inter', fontCss.includes("font-family: 'Inter'")],
  ['fonts.css declares Saira Semi Condensed', fontCss.includes("font-family: 'Saira Semi Condensed'")],
  ['fonts.css declares Anek Bangla', fontCss.includes("font-family: 'Anek Bangla'")],
  ['fonts.css keeps per-glyph subsetting', /unicode-range:/.test(fontCss)],
  ['exports embed font files', exporters.includes('fontEmbedCSS')],
  ['exports pin preview line breaks', exporters.includes('freezeLineBreaks')],
  ['exports load every face first', exporters.includes('ensureSheetFontsLoaded')],
];

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
    ...staticChecks,
    ['app header rendered', html.includes('Nexora Cover Design')],
    ['university name on sheet', html.includes('JAGANNATH UNIVERSITY, DHAKA')],
    [
      'logo above university name (on sheet)',
      html.lastIndexOf('/jnu-logo.png') < html.lastIndexOf('JAGANNATH UNIVERSITY, DHAKA'),
    ],
    ['department block', html.includes('Department of Islamic History and Culture')],
    ['course code default', html.includes('Course code:') && html.includes('2102')],
    ['instructor default', html.includes('Dr. Kamal Hossain')],
    ['student id default', html.includes('B-2401040')],
    ['session default', html.includes('2024-25')],
    ['submitted-to label', html.toLowerCase().includes('submitted to')],
    [
      'assignment title before submitted-to (on sheet)',
      html.indexOf('An Assignment on') < html.lastIndexOf('Submitted To'),
    ],
    ['assignment title placeholder', html.includes('Assignment Title')],
    ['submitted-by label', html.toLowerCase().includes('submitted by')],
    ['year + semester line', html.includes('2nd Year, 4th Semester')],
    ['year-sem after student id', html.indexOf('2nd Year, 4th Semester') > html.indexOf('Student ID:')],
    ['date of submission', html.includes('Date of Submission')],
    ['zoom toolbar (Fit)', html.includes('Fit')],
    ['export buttons', html.includes('PNG') && html.includes('PDF') && html.includes('Print')],
    ['saira font option', html.includes('Saira Semi Condensed')],
    ['designation multiline ready', /white-space:\s*(?:&quot;|")?pre-line/i.test(html)],
    ['classic serif removed', !html.includes('Classic Serif')],
    ['modern sans is default', /font-family:\s*(?:&quot;|")?Inter/i.test(html)],
    ['anek bangla in font stack', html.includes('Anek Bangla')],
    ['mobile tab bar', html.includes('Switch view')],
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
