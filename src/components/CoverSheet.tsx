import type { CSSProperties } from 'react'
import type { CoverState } from '../types'
import {
  BACKGROUND_COLORS,
  FONT_STACKS,
  LOGO_GEOMETRY,
} from '../options'
import { fallback, formatDate } from '../utils/helpers'
import { hexToRgba } from '../utils/color'

// A4 at 96dpi is 794 x 1123 px (210 x 297 mm)
export const SHEET_PX = { width: 794, height: 1123 }
const mm = (v: number) => v * 3.7795275591

const INK = '#23262d'
const MUTED = '#6a6e78'

interface FrameLayerProps {
  insetMm: number
  border: string
}

function FrameLayer({ insetMm: inset, border }: FrameLayerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: mm(inset),
        left: mm(inset),
        right: mm(inset),
        bottom: mm(inset),
        border,
      }}
    />
  )
}

function CornerDiamond({
  top,
  left,
  right,
  bottom,
  accent,
  fill,
  size = 13,
}: {
  top?: number
  left?: number
  right?: number
  bottom?: number
  accent: string
  fill: string
  size?: number
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        background: fill,
        border: `1.5px solid ${accent}`,
        transform: 'translate(-50%, -50%) rotate(45deg)',
      }}
    />
  )
}

function LeaderRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '7px 0' }}>
      <span
        style={{
          flex: '0 0 108px',
          textAlign: 'right',
          fontWeight: 700,
          color: INK,
          fontSize: 13.5,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span style={{ fontWeight: 700, color: accent, paddingBottom: 2 }}>:</span>
      <span
        style={{
          flex: 1,
          borderBottom: `1.5px dotted ${hexToRgba(accent, 0.55)}`,
          transform: 'translateY(-3px)',
          minWidth: 20,
        }}
      />
      <span
        style={{
          textAlign: 'left',
          fontWeight: 600,
          color: INK,
          fontSize: 13.5,
          maxWidth: 320,
          minWidth: 120,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function SectionHeading({ children, accent }: { children: string; accent: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: 2.2,
        color: accent,
        textTransform: 'uppercase',
        paddingBottom: 5,
        marginBottom: 12,
        borderBottom: `2px solid ${accent}`,
        display: 'inline-block',
        paddingLeft: 14,
        paddingRight: 14,
      }}
    >
      {children}
    </div>
  )
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 210, borderTop: `1.5px dotted ${MUTED}`, marginBottom: 6 }} />
      <span style={{ fontSize: 11.5, color: MUTED, letterSpacing: 0.4 }}>{label}</span>
    </div>
  )
}

export default function CoverSheet({
  state,
  sheetRef,
}: {
  state: CoverState
  sheetRef?: React.Ref<HTMLDivElement>
}) {
  const accent = state.accentColor
  const bg = BACKGROUND_COLORS[state.background]
  const fontStack = FONT_STACKS[state.fontFamily]
  const geo = LOGO_GEOMETRY[state.logoSize]
  const logoSrc = state.logoDataUrl ?? `${import.meta.env.BASE_URL}jnu-logo.png`

  const borderFrames: JSX.Element[] = []
  if (state.borderStyle === 'single') {
    borderFrames.push(
      <FrameLayer key="single" insetMm={12} border={`1.5px solid ${accent}`} />,
    )
  } else if (state.borderStyle === 'double') {
    borderFrames.push(
      <FrameLayer key="outer" insetMm={8.5} border={`2.5px solid ${accent}`} />,
    )
    borderFrames.push(
      <FrameLayer key="inner" insetMm={12.5} border={`0.8px solid ${accent}`} />,
    )
  } else if (state.borderStyle === 'decorative') {
    borderFrames.push(
      <FrameLayer key="outer" insetMm={8} border={`0.8px solid ${accent}`} />,
    )
    borderFrames.push(
      <FrameLayer
        key="inner"
        insetMm={11.5}
        border={`3px double ${hexToRgba(accent, 0.85)}`}
      />,
    )
    const p = mm(8)
    const edge: CSSProperties = { position: 'absolute', width: 13, height: 13 }
    const corners = [
      { top: p, left: p },
      { top: p, right: p },
      { bottom: p, left: p },
      { bottom: p, right: p },
    ]
    corners.forEach((pos, i) =>
      borderFrames.push(
        <div key={`d${i}`} style={{ ...edge, ...pos }}>
          <CornerDiamond
            top={6.5}
            left={6.5}
            accent={accent}
            fill={bg}
          />
        </div>,
      ),
    )
    // midpoint markers on the top and bottom rails
    ;[
      { top: p, left: SHEET_PX.width / 2 },
      { bottom: p, left: SHEET_PX.width / 2 },
    ].forEach((pos, i) =>
      borderFrames.push(
        <div key={`m${i}`} style={{ ...edge, ...pos }}>
          <CornerDiamond top={6.5} left={6.5} accent={accent} fill={bg} size={10} />
        </div>,
      ),
    )
  }

  return (
    <div
      ref={sheetRef}
      id="a4-sheet"
      style={{
        width: SHEET_PX.width,
        height: SHEET_PX.height,
        background: bg,
        color: INK,
        fontFamily: fontStack,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.28)',
        flex: '0 0 auto',
      }}
    >
      {/* linen weave texture */}
      {state.background === 'linen' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(120,100,60,0.05) 0px, rgba(120,100,60,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(120,100,60,0.045) 0px, rgba(120,100,60,0.045) 1px, transparent 1px, transparent 4px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {borderFrames}

      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: `${mm(17)}px ${mm(20)}px ${mm(15)}px`,
        }}
      >
        {/* ===== Header ===== */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: 1.6,
              lineHeight: 1.25,
              color: accent,
              textTransform: 'uppercase',
            }}
          >
            {fallback(state.universityName, 'UNIVERSITY NAME')}
          </div>
          <div
            style={{
              width: 130,
              margin: '9px auto 8px',
              borderTop: `2.5px double ${accent}`,
            }}
          />
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              letterSpacing: 0.6,
              color: INK,
              textTransform: 'uppercase',
              lineHeight: 1.4,
            }}
          >
            {fallback(state.department, 'Department Name')}
          </div>
        </div>

        {/* ===== Logo ===== */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 14px' }}>
          {state.logoShape === 'circular' ? (
            <div
              style={{
                width: geo.circleDiameter,
                height: geo.circleDiameter,
                borderRadius: '50%',
                padding: 5,
                border: `3px solid ${accent}`,
                background: '#ffffff',
                boxShadow: `0 0 0 5px ${hexToRgba(accent, 0.1)}`,
                overflow: 'hidden',
              }}
            >
              <img
                src={logoSrc}
                alt="Institution logo"
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <img
              src={logoSrc}
              alt="Institution logo"
              crossOrigin="anonymous"
              style={{ height: geo.normalHeight, width: 'auto', display: 'block' }}
            />
          )}
        </div>

        {/* ===== Title ===== */}
        <div style={{ textAlign: 'center', padding: '0 8px' }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: 3.2,
              color: hexToRgba(accent, 0.85),
              textTransform: 'uppercase',
              marginBottom: 7,
            }}
          >
            Assignment / Report
          </div>
          <div
            style={{
              fontSize: 20.5,
              fontWeight: 700,
              lineHeight: 1.35,
              color: INK,
              minHeight: 28,
            }}
          >
            {fallback(state.assignmentTitle, 'Assignment / Report Title')}
          </div>
        </div>

        {/* ===== Course info card ===== */}
        <div
          style={{
            margin: '20px auto 0',
            width: '88%',
            border: `1px solid ${hexToRgba(accent, 0.45)}`,
            borderRadius: 4,
            background: hexToRgba(accent, 0.05),
            padding: '10px 22px 6px',
          }}
        >
          <LeaderRow
            label="Course Title"
            value={fallback(state.courseTitle, '—')}
            accent={accent}
          />
          <LeaderRow label="Course Code" value={fallback(state.courseCode, '—')} accent={accent} />
        </div>

        {/* ===== Submitted To / By ===== */}
        <div
          style={{
            display: 'flex',
            marginTop: 30,
            position: 'relative',
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 6,
              bottom: 6,
              borderLeft: `1px dashed ${hexToRgba(accent, 0.35)}`,
            }}
          />
          <div style={{ flex: 1, textAlign: 'center', padding: '0 22px' }}>
            <SectionHeading accent={accent}>Submitted To</SectionHeading>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.4 }}>
              {fallback(state.instructorName, 'Instructor Name')}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: MUTED,
                marginTop: 4,
                lineHeight: 1.45,
                maxWidth: 250,
                margin: '4px auto 0',
              }}
            >
              {fallback(state.instructorDesignation, 'Designation')}
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '0 22px' }}>
            <SectionHeading accent={accent}>Submitted By</SectionHeading>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.4 }}>
              {fallback(state.studentName, 'Student Name')}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: INK,
                marginTop: 6,
                lineHeight: 1.85,
                display: 'inline-block',
                textAlign: 'left',
              }}
            >
              <DetailLine label="ID / Roll" value={state.studentId} />
              <DetailLine label="Session" value={state.session} />
              <DetailLine
                label="Year / Sem."
                value={[state.year, state.semester].filter(Boolean).join('  ·  ')}
              />
            </div>
          </div>
        </div>

        {/* ===== Date ===== */}
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: 13,
              padding: '7px 22px',
              borderTop: `1px solid ${hexToRgba(accent, 0.5)}`,
              borderBottom: `1px solid ${hexToRgba(accent, 0.5)}`,
            }}
          >
            <span style={{ color: MUTED }}>Date of Submission: </span>
            <span style={{ fontWeight: 700 }}>
              {state.submissionDate ? formatDate(state.submissionDate) : '—'}
            </span>
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* ===== Signatures ===== */}
        <div style={{ display: 'flex', gap: 40, padding: '0 26px' }}>
          <SignatureBlock label="Signature of Student" />
          <SignatureBlock label="Signature of Instructor" />
        </div>
      </div>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: MUTED, flex: '0 0 82px' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>:</span>
      <span style={{ fontWeight: 600 }}>{fallback(value, '—')}</span>
    </div>
  )
}
