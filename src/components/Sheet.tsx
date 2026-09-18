import type { CSSProperties } from 'react';
import type { DividerStyle, SheetProps } from '../types';
import { BACKGROUNDS, FONT_STACKS } from '../constants';
import { formatDateLong, hexDarken, ordinal } from '../lib/format';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const GRAY = '#6b7280';
const DARK = '#111827';
const MID = '#374151';

function val(v: string, fallback = '—'): string {
  return v.trim() ? v : fallback;
}

/** Round to 3 decimals so generated CSS stays tidy (and identical between renders). */
function r3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function Label({ children, top, scale = 1 }: { children: string; top: number; scale?: number }) {
  return (
    <div
      style={{
        marginTop: r3(top * scale),
        fontSize: `${r3(8.5 * scale)}pt`,
        fontWeight: 700,
        letterSpacing: `${r3(2 * scale)}px`,
        textTransform: 'uppercase',
        color: GRAY,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The rule between two blocks. Every style keeps the same footprint (it starts at
 * `top` and is centred in the sheet), only its look changes — so switching styles
 * never re-flows the cover.
 */
function Divider({
  kind = 'hairline',
  accent,
  width = 42,
  top = 6,
  scale = 1,
}: {
  kind?: DividerStyle;
  accent: string;
  width?: number;
  top?: number;
  scale?: number;
}) {
  const w = `${r3(width * scale)}mm`;
  const marginTop = `${r3(top * scale)}mm`;
  const rule: CSSProperties = { height: '1px', background: '#d1d5db' };
  const column: CSSProperties = { width: w, marginTop, display: 'flex', flexDirection: 'column', alignItems: 'center' };

  switch (kind) {
    case 'none':
      return <div style={{ marginTop }} />;
    case 'dashed':
      return <div style={{ width: w, marginTop, borderTop: '1px dashed #9ca3af' }} />;
    case 'double':
      return (
        <div style={{ ...column, gap: '1.1mm' }}>
          <div style={{ ...rule, width: '100%' }} />
          <div style={{ ...rule, width: '100%' }} />
        </div>
      );
    case 'diamond':
      return (
        <div style={{ ...column, flexDirection: 'row', gap: '2mm' }}>
          <div style={{ ...rule, flex: 1 }} />
          <div style={{ width: '1.8mm', height: '1.8mm', background: accent, transform: 'rotate(45deg)' }} />
          <div style={{ ...rule, flex: 1 }} />
        </div>
      );
    case 'dots':
      return (
        <div style={{ ...column, flexDirection: 'row', justifyContent: 'center', gap: '2mm' }}>
          {[0.55, 1, 0.55].map((size, i) => (
            <div
              key={i}
              style={{
                width: `${r3(1.6 * size)}mm`,
                height: `${r3(1.6 * size)}mm`,
                borderRadius: '50%',
                background: i === 1 ? accent : '#d1d5db',
              }}
            />
          ))}
        </div>
      );
    case 'accent':
      return (
        <div
          style={{
            width: `${r3(width * 0.6 * scale)}mm`,
            height: `${r3(1.5 * scale)}pt`,
            borderRadius: '1px',
            background: accent,
            marginTop,
          }}
        />
      );
    case 'fade':
      return (
        <div
          style={{
            width: w,
            height: `${r3(1.5 * scale)}pt`,
            marginTop,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      );
    default:
      return <div style={{ width: w, ...rule, marginTop }} />;
  }
}

/**
 * One "Submitted To" / "Submitted By" panel. In the two-column layout each panel
 * takes half the row and centres its own lines; stacked, both are full width and
 * the second one is offset by the caller's gap.
 */
function panelStyle(columns: boolean, gap: string = '0mm'): CSSProperties {
  return {
    // Content-sized in the two-column layout: the pair is then centred as a group,
    // which leaves the same gap between the text and the border on either side.
    ...(columns ? { flex: '0 1 auto', minWidth: 0 } : { maxWidth: '100%' }),
    display: 'flex',
    flexDirection: 'column',
    // In the two-column layout each panel reads as a left-aligned column.
    alignItems: columns ? 'flex-start' : 'center',
    textAlign: columns ? 'left' : 'center',
    marginTop: gap,
  };
}

/**
 * The cover's only rule: it sits under the university name and takes whichever
 * style the panel selected. It is part of the fixed header, so it never scales
 * with the content size and keeps the same 66 mm footprint — the `diamond` style
 * is the original line—diamond—line drawing.
 */
function NameRule({ kind, accent }: { kind: DividerStyle; accent: string }) {
  if (kind === 'none') return null;
  return (
    <div
      data-divider=""
      style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '2.5mm' }}
    >
      <Divider kind={kind} accent={accent} width={66} top={0} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page border frame                                                  */
/* ------------------------------------------------------------------ */

/** The four page-border styles that hang decorations off the frame's corners. */
const CORNER_SPOTS: CSSProperties[] = [
  { left: 0, top: 0, borderTop: '3pt solid', borderLeft: '3pt solid', borderTopLeftRadius: '0.8mm' },
  { right: 0, top: 0, borderTop: '3pt solid', borderRight: '3pt solid', borderTopRightRadius: '0.8mm' },
  { left: 0, bottom: 0, borderBottom: '3pt solid', borderLeft: '3pt solid', borderBottomLeftRadius: '0.8mm' },
  { right: 0, bottom: 0, borderBottom: '3pt solid', borderRight: '3pt solid', borderBottomRightRadius: '0.8mm' },
];

/** A small rotated square, used as an ornament on two of the frame styles. */
function Ornament({ accent, style }: { accent: string; style: CSSProperties }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '2.4mm',
        height: '2.4mm',
        background: accent,
        transform: 'rotate(45deg)',
        ...style,
      }}
    />
  );
}

/**
 * Page border. `inset: 8mm` is the printable area; every style draws inside it so
 * switching styles never moves the cover's content.
 */
function BorderFrame({ style: bs, accent }: { style: SheetProps['borderStyle']; accent: string }) {
  if (bs === 'none') return null;
  const dark = hexDarken(accent, 0.18);
  return (
    <div style={{ position: 'absolute', inset: '8mm', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border:
            bs === 'single'
              ? `1.4pt solid ${accent}`
              : bs === 'stitched'
                ? `1.6pt dashed ${accent}`
                : bs === 'bold'
                ? `3pt solid ${accent}`
                : bs === 'double' || bs === 'decorative'
                  ? `5pt double ${accent}`
                  : bs === 'inset' || bs === 'flourish'
                    ? `0.9pt solid ${accent}`
                    : undefined,
        }}
      />

      {/* Classic Inset — hairline outside, heavier line set in from the edge. */}
      {bs === 'inset' && (
        <div style={{ position: 'absolute', inset: '3mm', border: `2.4pt solid ${accent}` }} />
      )}

      {/* Decorative — double frame, inner hairline and diamonds on the corners. */}
      {bs === 'decorative' && (
        <>
          <div style={{ position: 'absolute', inset: '3mm', border: `0.8pt solid ${dark}99` }} />
          {(
            [
              { left: '-3.2mm', top: '-3.2mm' },
              { right: '-3.2mm', top: '-3.2mm' },
              { left: '-3.2mm', bottom: '-3.2mm' },
              { right: '-3.2mm', bottom: '-3.2mm' },
            ] as CSSProperties[]
          ).map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '6.4mm',
                height: '6.4mm',
                border: `1.6pt solid ${accent}`,
                transform: 'rotate(45deg)',
                background: '#ffffff',
                ...pos,
              }}
            />
          ))}
        </>
      )}

      {/* Corner Marks — no continuous frame, just four brackets. */}
      {bs === 'corners' &&
        CORNER_SPOTS.map((spot, i) => (
          <div
            key={i}
            style={{ position: 'absolute', width: '26mm', height: '26mm', borderColor: accent, ...spot }}
          />
        ))}

      {/* Flourish — hairline frame with a diamond at the middle of each side. */}
      {bs === 'flourish' && (
        <>
          <Ornament accent={accent} style={{ left: '50%', top: '-1.2mm', marginLeft: '-1.2mm' }} />
          <Ornament accent={accent} style={{ left: '50%', bottom: '-1.2mm', marginLeft: '-1.2mm' }} />
          <Ornament accent={accent} style={{ top: '50%', left: '-1.2mm', marginTop: '-1.2mm' }} />
          <Ornament accent={accent} style={{ top: '50%', right: '-1.2mm', marginTop: '-1.2mm' }} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  The A4 cover sheet                                                 */
/* ------------------------------------------------------------------ */

export function Sheet(props: SheetProps) {
  const {
    universityName,
    department,
    courseTitle,
    courseCode,
    assignmentTitle,
    studentName,
    studentId,
    session,
    year,
    semester,
    instructorName,
    instructorDesignation,
    submissionDate,
    accentColor,
    borderStyle,
    dividerStyle,
    submitLayout,
    logoDataUrl,
    logoShape,
    logoSize,
    fontKey,
    backgroundKey,
    contentScale,
    emblemUrl,
  } = props;

  const accent = accentColor;
  // One knob for the whole content block: every length inside it (type sizes,
  // gaps, rules) is multiplied by this factor, so raising it grows the block
  // proportionally instead of stretching individual lines.
  const scale = Number.isFinite(contentScale) && contentScale > 0 ? contentScale : 1;
  const pt = (value: number) => `${r3(value * scale)}pt`;
  const mm = (value: number) => `${r3(value * scale)}mm`;
  const twoColumns = submitLayout === 'columns';
  const bg = BACKGROUNDS[backgroundKey];
  const font = FONT_STACKS[fontKey] ?? FONT_STACKS.sans;
  const logo = logoDataUrl ?? emblemUrl;
  const circular = logoShape === 'circular';

  const yearSemParts: string[] = [];
  if (year.trim()) yearSemParts.push(`${ordinal(year)} Year`);
  if (semester.trim()) yearSemParts.push(`${ordinal(semester)} Semester`);
  const yearSemLine = yearSemParts.join(', ');

  return (
    <div
      style={{
        width: '210mm',
        height: '297mm',
        position: 'relative',
        overflow: 'hidden',
        background: bg.css,
        fontFamily: font,
        color: DARK,
        boxSizing: 'border-box',
      }}
    >
      <BorderFrame style={borderStyle} accent={accent} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '13mm 15mm',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo */}
        <img
          src={logo}
          crossOrigin="anonymous"
          alt="Institutional logo"
          style={{
            display: 'block',
            width: `${logoSize}mm`,
            height: circular ? `${logoSize}mm` : 'auto',
            objectFit: circular ? 'cover' : 'contain',
            borderRadius: circular ? '50%' : '3px',
            marginTop: '8mm',
          }}
        />

        {/* University name (below the logo) */}
        <div
          style={{
            color: accent,
            fontSize: '18pt',
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            lineHeight: 1.3,
            marginTop: '11mm',
          }}
        >
          {val(universityName, 'University Name')}
        </div>
        <NameRule kind={dividerStyle} accent={accent} />

        {/* ---------------------------------------------------------------- */}
        {/*  Scaled content block — department → session.                      */}
        {/*  `contentScale` grows/shrinks everything in here together.          */}
        {/* ---------------------------------------------------------------- */}
        <div
          data-content-block=""
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Department & course */}
          <div style={{ marginTop: mm(10), fontSize: pt(12.5), fontWeight: 700, color: DARK }}>
            {val(department, 'Department Name')}
          </div>
          {courseTitle.trim() && (
            <div style={{ marginTop: mm(2.5), fontSize: pt(10.5), color: MID }}>
              <span style={{ color: GRAY }}>Course name: </span>
              <span style={{ fontWeight: 600 }}>{courseTitle}</span>
            </div>
          )}
          {courseCode.trim() && (
            <div style={{ marginTop: mm(1.2), fontSize: pt(10.5), color: MID }}>
              <span style={{ color: GRAY }}>Course code: </span>
              <span style={{ fontWeight: 600 }}>{courseCode}</span>
            </div>
          )}

          {/* Assignment title (the gap keeps the space the old rule occupied) */}
          <div style={{ marginTop: mm(13), fontSize: pt(10.5), fontStyle: 'italic', color: GRAY }}>
            An Assignment on
          </div>
          <div
            style={{
              marginTop: mm(2),
              maxWidth: '150mm',
              fontSize: pt(16),
              fontWeight: 800,
              lineHeight: 1.3,
              color: accent,
              // Honour the line breaks the user typed in the multi-line title box
              // (`white-space: pre-line`) and keep long unbroken words inside the
              // 150 mm column — both identical in the preview and the capture,
              // which share this markup.
              whiteSpace: 'pre-line',
              overflowWrap: 'break-word',
            }}
          >
            {val(assignmentTitle, 'Assignment Title')}
          </div>

          {/* ------------------------------------------------------------ */}
          {/*  Submitted To / Submitted By — stacked or side by side.        */}
          {/*  In `columns` each panel gets half the width; in `stacked` the  */}
          {/*  two are separated by a two-line gap.                          */}
          {/* ------------------------------------------------------------ */}
          <div
            data-parties={submitLayout}
            style={{
              display: 'flex',
              flexDirection: twoColumns ? 'row' : 'column',
              alignItems: twoColumns ? 'flex-start' : 'center',
              justifyContent: twoColumns ? 'center' : undefined,
              gap: twoColumns ? mm(14) : undefined,
              width: '100%',
              // The rules that used to separate the sections are gone, so their
              // margins live here (7 mm above "Submitted To", 8 mm above
              // "Submitted By") and the labels keep their own 5px offset. The
              // two-column pair sits lower on the page, so it gets extra room.
              marginTop: twoColumns ? mm(18) : mm(7),
            }}
          >
            {/* Submitted To (left column in the two-column layout) */}
            <div style={panelStyle(twoColumns)}>
              <Label top={5} scale={scale}>Submitted To</Label>
              <div style={{ marginTop: mm(1.5), fontSize: pt(12), fontWeight: 700, color: DARK }}>
                {val(instructorName)}
              </div>
              <div
                style={{
                  marginTop: mm(0.8),
                  fontSize: pt(10.5),
                  color: MID,
                  whiteSpace: 'pre-line',
                  overflowWrap: 'break-word',
                  lineHeight: 1.4,
                }}
              >
                {val(instructorDesignation).replace(/\\n/g, '\n')}
              </div>
            </div>

            {/* Submitted By (right column, or below with a two-line gap) */}
            <div style={panelStyle(twoColumns, twoColumns ? '0mm' : mm(8))}>
              <Label top={5} scale={scale}>Submitted By</Label>
              <div style={{ marginTop: mm(1.5), fontSize: pt(12), fontWeight: 700, color: DARK }}>
                {val(studentName)}
              </div>
              {studentId.trim() && (
                <div style={{ marginTop: mm(0.8), fontSize: pt(10.5), color: MID }}>
                  Student ID: {studentId}
                </div>
              )}
              {yearSemLine && (
                <div style={{ marginTop: mm(1.5), fontSize: pt(10.5), color: MID }}>{yearSemLine}</div>
              )}
              {session.trim() && (
                <div style={{ marginTop: mm(1.2), fontSize: pt(10.5), color: MID }}>
                  <span style={{ color: GRAY }}>Session: </span>
                  <span style={{ fontWeight: 600 }}>{session}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Submission date (pinned near bottom) */}
        <div
          data-date-block=""
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ marginTop: '3mm', fontSize: '11pt', color: DARK }}>
            <span style={{ color: GRAY }}>Date of Submission: </span>
            <span style={{ fontWeight: 700 }}>{formatDateLong(submissionDate)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
