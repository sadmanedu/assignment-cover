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
  ['content size control present', read('src/components/ControlsPanel.tsx').includes('Content size')],
  ['content size bounds defined', /CONTENT_SCALE_MIN\s*=\s*[\d.]+/.test(read('src/constants.ts'))],
  ['content size is persisted', /'contentScale'/.test(read('src/store.ts'))],
  ['content block is scaled', read('src/components/Sheet.tsx').includes('data-content-block')],
  ['default content size is 115%', /contentScale:\s*1\.15/.test(read('src/constants.ts'))],
  ['default divider is the diamond name-rule', /dividerStyle:\s*'diamond'/.test(read('src/constants.ts'))],
  ['divider designs defined (8)', (read('src/constants.ts').match(/DIVIDER_OPTIONS[\s\S]*?\n\];/)?.[0].match(/key: '/g) ?? []).length === 8],
  ['border designs defined (9)', (read('src/constants.ts').match(/BORDER_OPTIONS[\s\S]*?\n\];/)?.[0].match(/key: '/g) ?? []).length === 9],
  ['divider choice is persisted', /'dividerStyle'/.test(read('src/store.ts'))],
  ['submit layout is persisted', /'submitLayout'/.test(read('src/store.ts'))],
  ['two submit layouts defined', (read('src/constants.ts').match(/SUBMIT_LAYOUT_OPTIONS[\s\S]*?\n\];/)?.[0].match(/key: '/g) ?? []).length === 2],
  ['stacked is the default submit layout', /submitLayout:\s*'stacked'/.test(read('src/constants.ts'))],
  ['panel explains itself (readiness + help)', /required details/.test(read('src/components/ControlsPanel.tsx')) && /How this panel works/.test(read('src/components/ControlsPanel.tsx'))],
  ['readiness ignores optional fields', /REQUIRED = \{/.test(read('src/components/ControlsPanel.tsx')) && /OPTIONAL = \{/.test(read('src/components/ControlsPanel.tsx'))],
  ['fields are grouped in compact rows', /export function FieldRow/.test(read('src/components/ui.tsx'))],
  ['sheet draws every divider style', /case 'diamond':/.test(read('src/components/Sheet.tsx')) && /case 'fade':/.test(read('src/components/Sheet.tsx'))],
  ['sheet draws every border style', /bs === 'stitched'/.test(read('src/components/Sheet.tsx')) && /bs === 'corners'/.test(read('src/components/Sheet.tsx'))],
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

  /* Compact panel: the type/layout controls sit behind one disclosure — open it
     (as a user would) and re-read the panel. */
  const clickByText = (needle) => {
    const btn = [...dom.window.document.querySelectorAll('button')].find((b) => b.textContent.includes(needle));
    if (!btn) return false;
    btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    return true;
  };
  const openedFineTune = clickByText('Fine-tune type & layout');
  await new Promise((r) => setTimeout(r, 120));
  const openHtml = root.innerHTML;

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
    ['fine-tune controls are one click away', openedFineTune],
    ['saira font option', openHtml.includes('Saira Semi Condensed')],
    ['divider options in the panel', openHtml.includes('Three Dots') && openHtml.includes('Double Rule')],
    ['readiness bar explains the form', /required details|Cover ready/.test(html) && html.includes('optional')],
    ['sections map to cover regions', html.includes('Submitted By block') && html.includes('Submitted To block') && html.includes('top of the cover')],
    ['panel shows completion per section', /\d+\/5|done/.test(html) && /required details|Cover ready/.test(html)],
    ['look & styling section present', html.includes('Look &amp; Styling') || html.includes('Look & Styling')],
    ['logo + save sections are collapsed by default', html.match(/aria-expanded="false"/g)?.length >= 2],
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

  /* Content Size: the block must scale, the header/date must not. */
  try {
    const { useCover, pickPersistable } = await vite.ssrLoadModule('/src/store.ts');
    useCover.getState().set({ contentScale: 1.5 });
    await new Promise((r) => setTimeout(r, 120));
    const scaled = dom.window.document.getElementById('root').innerHTML;
    const hasStyle = (prop, value) =>
      new RegExp(`${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[;"]`).test(scaled);
    const scaledChecks = [
      ['content size scales the title (16pt → 24pt)', hasStyle('font-size', '24pt')],
      ['content size scales the department (12.5pt → 18.75pt)', hasStyle('font-size', '18.75pt')],
      ['content size scales the designation (10.5pt → 15.75pt)', hasStyle('font-size', '15.75pt')],
      ['content size scales the SUBMITTED TO label (8.5pt → 12.75pt)', hasStyle('font-size', '12.75pt')],
      ['content size scales the block gaps (10mm → 15mm)', hasStyle('margin-top', '15mm')],
      ['header stays fixed (university 18pt)', hasStyle('font-size', '18pt')],
      ['date stays fixed (11pt)', hasStyle('font-size', '11pt')],
      ['content size is stored in the save file', pickPersistable(useCover.getState()).settings.contentScale === 1.5],
    ];
    for (const [name, ok] of scaledChecks) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
      if (!ok) failed = true;
    }
    useCover.getState().set({ contentScale: 1 });
  } catch (err) {
    console.error('CONTENT SIZE CHECK ERROR:', err);
    failed = true;
  }

  /* Readiness strip: required details only, optional ones called out separately. */
  try {
    const { useCover } = await vite.ssrLoadModule('/src/store.ts');
    const strip = () => {
      const aside = dom.window.document.querySelector('aside');
      return {
        headline: aside.querySelector('.text-\\[11\\.5px\\]')?.textContent.trim() ?? '',
        sentence: aside.querySelector('p')?.textContent.trim() ?? '',
      };
    };
    const defaults = { ...useCover.getState() };
    useCover.getState().set({ assignmentTitle: '', courseTitle: '', courseCode: '' });
    await new Promise((r) => setTimeout(r, 120));
    const empty = strip();
    useCover.getState().set({ assignmentTitle: 'Impacts of Mughal Land Revenue Reforms' });
    await new Promise((r) => setTimeout(r, 120));
    const readyWithOptionalGaps = strip();
    useCover.getState().set({ courseTitle: 'Data Structures', courseCode: '2102' });
    await new Promise((r) => setTimeout(r, 120));
    const fullyFilled = strip();

    const readinessChecks = [
      ['readiness counts required details only', /required details$/.test(empty.headline)],
      ['readiness names the missing required detail', /Fill the 1 remaining required detail/.test(empty.sentence)],
      ['cover reports ready with optional fields empty', readyWithOptionalGaps.headline === 'Cover ready' && /optional fields? (?:is|are) left empty/.test(readyWithOptionalGaps.sentence)],
      ['cover reports every field filled', /Every field is filled/.test(fullyFilled.sentence)],
    ];
    for (const [name, ok] of readinessChecks) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
      if (!ok) failed = true;
    }
    useCover.getState().set({
      assignmentTitle: defaults.assignmentTitle,
      courseTitle: defaults.courseTitle,
      courseCode: defaults.courseCode,
    });
  } catch (err) {
    console.error('READINESS CHECK ERROR:', err);
    failed = true;
  }

  /* Divider + border designs: what the picker selects must reach the sheet. */
  try {
    const { useCover, pickPersistable } = await vite.ssrLoadModule('/src/store.ts');
    // Read the export sheet (not the whole panel — the pickers draw samples too).
    const sheetHtml = () => dom.window.document.getElementById('print-sheet').innerHTML;
    const settle = () => new Promise((r) => setTimeout(r, 120));

    const ruleHtml = () => dom.window.document.getElementById('print-sheet').innerHTML;
    const blockHtml = () =>
      dom.window.document.querySelector('#print-sheet [data-content-block]')?.innerHTML ?? '';

    useCover.getState().set({ dividerStyle: 'dots' });
    await settle();
    const dots = ruleHtml();
    useCover.getState().set({ dividerStyle: 'fade' });
    await settle();
    const fade = ruleHtml();
    useCover.getState().set({ dividerStyle: 'none' });
    await settle();
    const none = ruleHtml();
    useCover.getState().set({ dividerStyle: 'hairline' });
    await settle();
    const hairline = ruleHtml();

    useCover.getState().set({ borderStyle: 'corners' });
    await settle();
    const corners = ruleHtml();
    useCover.getState().set({ borderStyle: 'stitched' });
    await settle();
    const stitched = ruleHtml();

    useCover.getState().set({ dividerStyle: 'diamond' });
    await settle();
    const diamond = ruleHtml();
    const countIn = (haystack, needle) => haystack.split(needle).length - 1;

    const designChecks = [
      ['the cover has exactly one divider', countIn(diamond, 'data-divider') === 1],
      ['that divider is the rule under the university name', /rotate\(45deg\)/.test(diamond.slice(diamond.indexOf('data-divider'), diamond.indexOf('data-content-block')))],
      ['no divider inside the content block', countIn(blockHtml(), 'data-divider') === 0],
      ['no rule is drawn between the blocks', !/rgb\(209, 213, 219\)/.test(blockHtml())],
      ['the date block has no rule', countIn(none, 'data-divider') === 0],
      ['three-dot divider reaches the sheet', /border-radius:\s*50%/.test(dots)],
      ['fade divider reaches the sheet exactly once', countIn(fade, 'linear-gradient') === 1],
      ['hairline divider reaches the sheet', /height:\s*1px/.test(hairline)],
      ['corner-mark border reaches the sheet', /border-top-width:\s*3pt/.test(corners)],
      ['stitched border reaches the sheet', /1\.6pt dashed/.test(stitched)],
      ['divider choice is stored in the save file', pickPersistable(useCover.getState()).settings.dividerStyle === 'diamond'],
    ];
    for (const [name, ok] of designChecks) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
      if (!ok) failed = true;
    }
    useCover.getState().set({ borderStyle: 'double' });

    /* Submitted To / By arrangement. Geometry is checked in the browser harness;
       here we assert the choice reaches the sheet and travels in the save file. */
    const parties = () => {
      const wrap = dom.window.document.querySelector('#print-sheet [data-parties]');
      if (!wrap) return null;
      const to = wrap.children[0];
      const by = wrap.children[1];
      return {
        layout: wrap.dataset.parties,
        direction: wrap.style.flexDirection,
        panels: wrap.children.length,
        labels: [to?.textContent.trim().startsWith('Submitted To'), by?.textContent.trim().startsWith('Submitted By')],
        byOffset: by?.style.marginTop ?? '',
        topGap: wrap.style.marginTop,
        toAlign: to?.style.textAlign,
        byAlign: by?.style.textAlign,
        justify: wrap.style.justifyContent,
        toFlex: to?.style.flex || 'maxWidth',
        byFlex: by?.style.flex || 'maxWidth',
      };
    };

    useCover.getState().set({ submitLayout: 'stacked' });
    await settle();
    const stacked = parties();
    useCover.getState().set({ submitLayout: 'columns' });
    await settle();
    const columns = parties();

    const layoutChecks = [
      ['two panels are rendered', stacked?.panels === 2 && columns?.panels === 2],
      ['panels are Submitted To then Submitted By', stacked?.labels.every(Boolean) === true],
      ['stacked layout stacks the panels', stacked?.layout === 'stacked' && stacked?.direction === 'column'],
      ['two-column layout puts the panels side by side', columns?.layout === 'columns' && columns?.direction === 'row'],
      ['stacked layout leaves a gap above Submitted By', stacked?.byOffset !== '0mm' && stacked?.byOffset !== ''],
      ['two-column layout aligns the panels at the top', columns?.byOffset === '0mm'],
      ['two-column layout left-aligns both panels', columns?.toAlign === 'left' && columns?.byAlign === 'left'],
      ['stacked layout centres both panels', stacked?.toAlign === 'center' && stacked?.byAlign === 'center'],
      ['two-column pair sits lower on the page', columns?.topGap === '18mm' && stacked?.topGap === '7mm'],
      ['two-column panels size to their text', columns?.toFlex.startsWith('0 1') && columns?.byFlex.startsWith('0 1')],
      ['two-column pair is centred as a group', columns?.justify === 'center'],
      ['stacked panels keep full width', stacked?.toFlex.includes('maxWidth') || stacked?.direction === 'column'],
      ['submit layout is stored in the save file', pickPersistable(useCover.getState()).settings.submitLayout === 'columns'],
    ];
    for (const [name, ok] of layoutChecks) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
      if (!ok) failed = true;
    }
    useCover.getState().set({ submitLayout: 'stacked' });
  } catch (err) {
    console.error('DESIGN CHECK ERROR:', err);
    failed = true;
  }
} catch (err) {
  console.error('RENDER ERROR:', err);
  failed = true;
} finally {
  await vite.close();
}
process.exit(failed ? 1 : 0);
