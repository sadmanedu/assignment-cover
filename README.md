# Nexora Cover Design

A live A4 assignment cover page designer — built for **JAGANNATH UNIVERSITY, DHAKA** covers, but fully generic.

Split-screen workspace: **form controls on the left**, **live A4 preview on the right**. Type, restyle, then export a true A4 sheet as **PDF**, **PNG**, or straight to **Print**.

![stack](https://img.shields.io/badge/React_19-Vite_8-blue) ![tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
```

Other scripts:

```bash
npm run build    # production build → dist/
npm run preview  # serve the production build
npm run typecheck
```

## Features

### 1. State management & form inputs
- **Academic details** — University name, Department, Course title, Course code, Assignment/Report title.
- **Student details** — Name, ID/Roll number, Session, Year, Semester (numeric values auto-ordinal: `2` → `2nd`).
- **Faculty details** — Instructor name (“Submitted To”) and designation. Designation is multi-line: press Enter (or type a literal `\n`) and the cover renders the break on the next line.
- **Metadata** — Submission date (rendered long-form: *10 September 2026*).

All state lives in a [Zustand](https://zustand.docs.pmnd.rs/) store and updates the preview instantly.

### 2. Customization & styling engine
- **Theme & accent colors** — 7 presets + custom color picker; dynamically re-tints borders, headers, the title, the rules, and the default emblem.
- **Border styles** — nine frames, each with a live mini-preview: *None*, *Single Thin*, *Single Bold*,
  *Stitched* (dashed accent rule), *Double Classic*, *Classic Inset* (hairline outside, heavier line set in),
  *Decorative* (double frame + inner hairline + corner diamonds), *Corner Marks* (four bracketed corners, no
  continuous frame) and *Flourish* (hairline frame with a diamond at the middle of each side). Every frame is
  drawn inside the same 8 mm print area, so switching styles never moves the cover's content.
- **Logo customization** — official JNU crest by default; upload any image (PNG/JPG/SVG, ≤ 2.5 MB), shape toggle (*Normal* / *Circular*), size slider (24–60 mm). A generated accent-tinted academic emblem serves as the fallback.
- **Typography & background** — Modern Sans (Inter, default), Formal (Palatino), Saira Semi Condensed; backgrounds: Pure White, Off-White, Cream, Light Gray, Linen Texture. **Anek Bangla** is the built-in Bengali font: every stack falls back to it per-glyph, so Bengali text (university name, titles…) renders in Anek Bangla while English stays in the selected Latin font. Only light Anek Bangla weights (300–500) are loaded, so Bengali headings render at Medium — visibly lighter than the bold Latin headings. All three families are **self-hosted** (`src/fonts.css`, files from `@fontsource/*`) — the app makes no network request to a font CDN, and the subsetting behaves exactly as Google Fonts' (`unicode-range` per face).

- **Divider** — the cover has exactly one rule: the one under the university name. This control chooses its style —
  *Diamond* (default: line—diamond—line), *Hairline*, *Dashed*, *Double Rule*, *Three Dots*, *Accent Bar*,
  *Fade* (accent gradient) or *None* for no rule at all. Each option has a mini-preview. The rule belongs to the fixed
  header (it does not scale with the content size) and every style shares one 66 mm footprint, so switching only
  changes the look — never the layout. No other rules are drawn anywhere on the cover; the space the previous
  rules occupied is folded into the block spacing, so the vertical rhythm is unchanged.
- **Content size** — one slider (80–160 %, default **115 %**; 100 % is the design's own size) that scales the cover's body text as a group: Department line, course name/code, *An Assignment on*, the title, the *Submitted To* block (instructor + designation), the *Submitted By* block (name, ID, year/semester, session) and the hairline dividers and gaps between them. Every size in that block grows (or shrinks) by the same factor, so the block's internal proportions never change — the university header, its rule and the pinned submission date stay exactly where they are. Click the percentage badge to reset to 100 %. If the enlarged block no longer fits above the date — it pushes the pinned date out of its spot at the bottom of the page — an amber warning appears under the slider; lower the size or shorten the text.

### 3. Live A4 preview workspace
- A true 210 × 297 mm sheet rendered 1:1 and scaled for the viewport.
- Zoom controls **− / + / Fit** with percentage readout; auto-fits on window resize until you zoom manually.

### Responsive layout
- **Desktop (lg+)**: split screen — form controls left, live preview right.
- **Phones / tablets**: single-pane with a bottom **Details ⇄ Preview** tab bar, collapsible form sections (accordion headers), a wrapping export toolbar, and enlarged touch targets. The preview auto-fits the smaller viewport and re-fits when the tab is reopened.

### 4. Export, storage & utilities
- **PDF** — jsPDF: captures an off-screen 1:1 copy of the sheet (2× supersampled ≈ 192 dpi) into a true A4 page at **100% scale**, zero extra margins.
- **PNG** — same capture, downloaded as a ~192 dpi PNG.
- **Print** — optimized `@media print` stylesheet (A4, `@page margin: 0`, only the sheet is visible) → print at 100% scale with default margins.

> **Previews and downloads are rendered by the same engine.** Exports serialize the live sheet into an SVG `<foreignObject>` (`html-to-image`) and rasterize it with the browser's own layout/paint code, so text position, spacing, rules and dividers in a downloaded PNG/PDF are identical to the on-screen preview. `html2canvas` remains only as a fallback if that rasterization fails.

#### Why the download keeps the preview's fonts (and line breaks)

An SVG document has no access to the page's font cache, so every face the sheet
uses has to travel *inside* the SVG. `html-to-image` tries to do that on its own,
but it reads `document.styleSheets` — which throws `SecurityError` for a
cross-origin stylesheet — and then re-downloads each font file at click time.
When that re-download failed (offline, blocked CDN, slow/spotty network, a
sandboxed iframe), the capture silently rendered in a **system** font: the
download no longer matched the preview, and because the fallback has different
metrics every paragraph re-flowed, so the **line breaks moved**. The export
pipeline now closes both doors:

1. **Fonts are self-hosted** (`src/fonts.css`), so the rules are same-origin and
   readable, and the files are already in the HTTP cache.
2. **Font files are inlined** as `data:` URLs before the capture
   (`src/lib/fonts.ts`), so the rasterization needs *zero* network requests. Every
   family of a stack is collected — CSS falls back per glyph, so Bengali runs are
   painted by `Anek Bangla` (the second family) while Latin stays in `Inter`.
   `createObjectURL`-style blob URLs are avoided deliberately: they survive in a
   Chromium canvas but not reliably in the Safari/WebKit rasterizer.
3. **Line breaks are pinned** to the ones on screen (`src/lib/freeze.ts`): the
   export measures where the live preview wrapped each paragraph and writes those
   breaks into the sheet for the duration of the capture. Screen text and
   SVG-image text can round glyph advances differently, so this keeps a
   boundary-line from wrapping on a different word in the download.
- **Save / Load** — JSON persistence to `localStorage`.
- **Copy Details** — plain-text summary of every field to the clipboard.
- **Reset** — restores all defaults.

Save files carry the whole setup — accent, border, divider, typography, logo, content size and all text — so a cover can be restored exactly.

## Project structure

```
src/
  App.tsx                  # shell: header, split layout, off-screen export sheet
  store.ts                 # Zustand store (all cover data + settings)
  types.ts / constants.ts  # types, defaults, presets (colors, fonts, borders, bgs)
  components/
    Sheet.tsx              # the A4 cover document (borders, blocks, logo)
    ControlsPanel.tsx      # left-side form controls
    PreviewPanel.tsx       # zoom toolbar, preview canvas, export buttons
    ui.tsx                 # Section / Field / Seg / Toast primitives
  lib/
    emblem.ts              # SVG academic-emblem generator (accent-tinted data URL)
    exporters.ts           # html-to-image (browser rasterizer) → PNG / jsPDF → A4 PDF (lazy-loaded)
    fonts.ts               # waits for the sheet's faces, inlines them into the capture
    freeze.ts              # pins the preview's line breaks into the export
    format.ts              # ordinals, dates, clipboard, color math
  fonts.css                # self-hosted Inter / Saira Semi Condensed / Anek Bangla
    toast.ts               # tiny toast store
```

## Notes

- The default logo is the **official JNU crest** (`public/jnu-logo.png`); upload any other institutional logo to replace it. If no logo is available, a generated accent-tinted academic emblem is used as fallback.
- Fonts are self-hosted local files — the app works with no internet connection, and so do the exports.
- Cover layout follows standard academic formatting: centered headers, structured *Submitted To / Submitted By* blocks, balanced whitespace, date pinned to the bottom.
