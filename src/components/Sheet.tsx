import type { CSSProperties } from 'react';
import type { SheetProps } from '../types';
import { BACKGROUNDS, FONT_STACKS } from '../constants';
import { formatDateLong, hexDarken, ordinal } from '../lib/format';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const GRAY = '#6b7280';
const DARK = '#111827';
const MID = '#374151';
const FAINT = '#9ca3af';

function val(v: string, fallback = '—'): string {
  return v.trim() ? v : fallback;
}

function Label({ children, top }: { children: string; top: number }) {
  return (
    <div
      style={{
        marginTop: top,
        fontSize: '8.5pt',
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: GRAY,
      }}
    >
      {children}
    </div>
  );
}

function Divider({ width = 42, top = 6 }: { width?: number; top?: number }) {
  return (
    <div
      style={{
        width: `${width}mm`,
        height: '1px',
        background: '#d1d5db',
        marginTop: `${top}mm`,
      }}
    />
  );
}

/** Accent rule: line — diamond — line, under the university name. */
function NameRule({ accent }: { accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', marginTop: '2.5mm' }}>
      <div style={{ width: '30mm', height: '1.6pt', background: accent }} />
      <div
        style={{
          width: '1.8mm',
          height: '1.8mm',
          background: accent,
          transform: 'rotate(45deg)',
        }}
      />
      <div style={{ width: '30mm', height: '1.6pt', background: accent }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page border frame                                                  */
/* ------------------------------------------------------------------ */

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
            bs === 'single' ? `1.4pt solid ${accent}` : `5pt double ${accent}`,
        }}
      />
      {bs === 'decorative' && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '3mm',
              border: `0.8pt solid ${dark}99`,
            }}
          />
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
    logoDataUrl,
    logoShape,
    logoSize,
    fontKey,
    backgroundKey,
    emblemUrl,
  } = props;

  const accent = accentColor;
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
        <NameRule accent={accent} />

        {/* Department & course */}
        <div style={{ marginTop: '10mm', fontSize: '12.5pt', fontWeight: 700, color: DARK }}>
          {val(department, 'Department Name')}
        </div>
        {courseTitle.trim() && (
          <div style={{ marginTop: '2.5mm', fontSize: '10.5pt', color: MID }}>
            <span style={{ color: GRAY }}>Course name: </span>
            <span style={{ fontWeight: 600 }}>{courseTitle}</span>
          </div>
        )}
        {courseCode.trim() && (
          <div style={{ marginTop: '1.2mm', fontSize: '10.5pt', color: MID }}>
            <span style={{ color: GRAY }}>Course code: </span>
            <span style={{ fontWeight: 600 }}>{courseCode}</span>
          </div>
        )}

        <Divider top={7} />

        {/* Assignment title */}
        <div style={{ marginTop: '6mm', fontSize: '10.5pt', fontStyle: 'italic', color: GRAY }}>
          An Assignment on
        </div>
        <div
          style={{
            marginTop: '2mm',
            maxWidth: '150mm',
            fontSize: '16pt',
            fontWeight: 800,
            lineHeight: 1.3,
            color: accent,
          }}
        >
          {val(assignmentTitle, 'Assignment Title')}
        </div>

        <Divider top={7} />

        {/* Submitted To */}
        <Label top={5}>Submitted To</Label>
        <div style={{ marginTop: '1.5mm', fontSize: '12pt', fontWeight: 700, color: DARK }}>
          {val(instructorName)}
        </div>
        <div style={{ marginTop: '0.8mm', fontSize: '10.5pt', color: MID }}>
          {val(instructorDesignation)}
        </div>

        <Divider top={8} />

        {/* Submitted By */}
        <Label top={5}>Submitted By</Label>
        <div style={{ marginTop: '1.5mm', fontSize: '12pt', fontWeight: 700, color: DARK }}>
          {val(studentName)}
        </div>
        {studentId.trim() && (
          <div style={{ marginTop: '0.8mm', fontSize: '10.5pt', color: MID }}>
            Student ID: {studentId}
          </div>
        )}
        {yearSemLine && (
          <div style={{ marginTop: '1.5mm', fontSize: '10.5pt', color: MID }}>{yearSemLine}</div>
        )}
        {session.trim() && (
          <div style={{ marginTop: '1.2mm', fontSize: '10.5pt', color: MID }}>
            <span style={{ color: GRAY }}>Session: </span>
            <span style={{ fontWeight: 600 }}>{session}</span>
          </div>
        )}

        {/* Submission date (pinned near bottom) */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Divider width={90} top={0} />
          <div style={{ marginTop: '3mm', fontSize: '11pt', color: DARK }}>
            <span style={{ color: GRAY }}>Date of Submission: </span>
            <span style={{ fontWeight: 700 }}>{formatDateLong(submissionDate)}</span>
          </div>
        </div>
        {/* Small footer mark */}
        <div style={{ marginTop: '4mm', fontSize: '7.5pt', letterSpacing: '1.5px', color: FAINT }}>
          {universityName.trim().toUpperCase()}
        </div>
      </div>
    </div>
  );
}
