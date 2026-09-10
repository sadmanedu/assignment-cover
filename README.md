# Assignment Cover Page Designer — Jagannath University, Dhaka

A single-page web app for designing professional **A4 assignment / report cover
pages** with the Jagannath University logo, a live what-you-see-is-what-you-get
preview, one-click PDF/PNG export, and full local persistence.

![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-646cff)

## Features

### Form inputs
- **Academic details** — University Name, Department, Course Title, Course Code,
  Assignment/Report Title.
- **Student details** — Name, ID/Roll, Session, Year, Semester.
- **Faculty details** — Instructor name (*Submitted To*) and Designation.
- **Metadata** — Submission date (printed in long form, e.g. `10 September 2026`).

### Customization engine
- **Accent color** — curated palette (JNU Blue, Navy, Maroon, Forest, …) plus a
  free-form color picker; drives borders, rules, headings and the circular logo ring.
- **Page borders** — None · Single Thin · Double Classic · Decorative
  (double rule with corner/center diamond markers).
- **Logo** — upload any institutional logo (PNG/JPG/SVG/WebP), Normal or
  **Circular** crop, Small/Medium/Large sizing, and one-click reset to the
  bundled Jagannath University crest.
- **Typography** — Modern Sans (Inter), Elegant Serif (Playfair Display),
  Academic (Times New Roman).
- **Backgrounds** — Pure White, Off-white, Cream, and a Linen weave texture.

### Live A4 workspace
- Exact **210 × 297 mm** sheet rendered at 794 × 1123 px (96 dpi).
- Zoom **+ / − / Fit / 100%** controls (and `+`, `-`, `0` keyboard shortcuts),
  with a dotted desktop and drop shadow.
- Split-screen layout: controls on the left, preview on the right
  (stacks vertically on small screens).

### Export, storage & utilities
- **PDF** — exact A4 via jsPDF + html2canvas at ~288 dpi, 100% scale.
- **PNG** — high-resolution image of the rendered sheet.
- **Print / browser PDF** — dedicated print stylesheet (`@page A4, margin 0`)
  for standard A4, 100% scale, default margins in the browser dialog.
- **Save JSON / Load JSON** — portable snapshots of every field and style.
- **Copy Details** — plain-text summary of the cover page to the clipboard.
- **Reset** — restore the bundled defaults.
- Everything is **auto-saved to `localStorage`** as you type.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Project layout

```
public/jnu-logo.png          Bundled Jagannath University crest (transparent PNG)
src/
  components/
    App.tsx                  State, persistence, export wiring
    ControlPanel.tsx         All form + customization controls
    CoverSheet.tsx           The A4 artwork (borders, logo, typed blocks)
    PreviewStage.tsx         Scaled live preview + zoom toolbar
    ui.tsx                   Field / card / segmented-control primitives
  options.ts                 Palettes, fonts, borders, background presets
  defaults.ts                Default JNU cover content
  utils/
    exportArtwork.ts         PNG, PDF (jsPDF) and print entry points
    helpers.ts               Date formatting, JSON/clipboard, image downscaling
    color.ts                 Hex → rgba helpers
```
