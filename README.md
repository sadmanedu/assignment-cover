# Assignment Cover Studio

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
- **Faculty details** — Instructor name (“Submitted To”) and designation.
- **Metadata** — Submission date (rendered long-form: *10 September 2026*).

All state lives in a [Zustand](https://zustand.docs.pmnd.rs/) store and updates the preview instantly.

### 2. Customization & styling engine
- **Theme & accent colors** — 7 presets + custom color picker; dynamically re-tints borders, headers, the title, the rules, and the default emblem.
- **Border styles** — *None*, *Single Thin*, *Double Classic*, *Decorative* (double frame + inner hairline + corner ornaments), with live mini-previews.
- **Logo customization** — official JNU crest by default; upload any image (PNG/JPG/SVG, ≤ 2.5 MB), shape toggle (*Normal* / *Circular*), size slider (24–60 mm). A generated accent-tinted academic emblem serves as the fallback.
- **Typography & background** — Modern Sans (Inter, default), Formal (Palatino), Saira Semi Condensed; backgrounds: Pure White, Off-White, Cream, Light Gray, Linen Texture. **Anek Bangla** is the built-in Bengali font: every stack falls back to it per-glyph, so Bengali text (university name, titles…) renders in Anek Bangla while English stays in the selected Latin font. Only light Anek Bangla weights (300–500) are loaded, so Bengali headings render at Medium — visibly lighter than the bold Latin headings.

### 3. Live A4 preview workspace
- A true 210 × 297 mm sheet rendered 1:1 and scaled for the viewport.
- Zoom controls **− / + / Fit** with percentage readout; auto-fits on window resize until you zoom manually.

### Responsive layout
- **Desktop (lg+)**: split screen — form controls left, live preview right.
- **Phones / tablets**: single-pane with a bottom **Details ⇄ Preview** tab bar, collapsible form sections (accordion headers), a wrapping export toolbar, and enlarged touch targets. The preview auto-fits the smaller viewport and re-fits when the tab is reopened.

### 4. Export, storage & utilities
- **PDF** — jsPDF + html2canvas: captures an off-screen 1:1 copy of the sheet (2.5× supersampled ≈ 254 dpi) into a true A4 page at **100% scale**, zero extra margins.
- **PNG** — same capture, downloaded as a ~254 dpi PNG.
- **Print** — optimized `@media print` stylesheet (A4, `@page margin: 0`, only the sheet is visible) → print at 100% scale with default margins.
- **Save / Load** — JSON persistence to `localStorage`.
- **Copy Details** — plain-text summary of every field to the clipboard.
- **Reset** — restores all defaults.

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
    exporters.ts           # html2canvas → PNG / jsPDF → A4 PDF (lazy-loaded)
    format.ts              # ordinals, dates, clipboard, color math
    toast.ts               # tiny toast store
```

## Notes

- The default logo is the **official JNU crest** (`public/jnu-logo.png`); upload any other institutional logo to replace it. If no logo is available, a generated accent-tinted academic emblem is used as fallback.
- Preview fonts load from Google Fonts (Inter) with system fallbacks; exports rasterize whatever the browser rendered.
- Cover layout follows standard academic formatting: centered headers, structured *Submitted To / Submitted By* blocks, balanced whitespace, date pinned to the bottom.
