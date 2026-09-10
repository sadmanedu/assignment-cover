/** Ordinal suffix helper: "2" → "2nd", "11" → "11th". Non-numeric passes through. */
export function ordinal(n: string): string {
  const trimmed = n.trim();
  const num = Number(trimmed);
  if (!trimmed || !Number.isInteger(num) || num < 1 || num > 20) return trimmed || '—';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return `${num}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

/** "2026-09-10" → "10 September 2026". Falls back to the raw value. */
export function formatDateLong(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function buildDetailsText(d: {
  universityName: string;
  department: string;
  courseTitle: string;
  courseCode: string;
  assignmentTitle: string;
  studentName: string;
  studentId: string;
  session: string;
  year: string;
  semester: string;
  instructorName: string;
  instructorDesignation: string;
  submissionDate: string;
}): string {
  const course = [d.courseTitle, d.courseCode ? `(${d.courseCode})` : ''].filter(Boolean).join(' ');
  return [
    `University: ${d.universityName || '—'}`,
    `Department: ${d.department || '—'}`,
    `Course: ${course || '—'}`,
    `Assignment: ${d.assignmentTitle || '—'}`,
    `Submitted To: ${d.instructorName || '—'}${d.instructorDesignation ? `, ${d.instructorDesignation}` : ''}`,
    `Submitted By: ${d.studentName || '—'}${d.studentId ? ` (ID: ${d.studentId})` : ''}`,
    `Session: ${d.session || '—'}  |  Year: ${ordinal(d.year)}  |  Semester: ${ordinal(d.semester)}`,
    `Submission Date: ${formatDateLong(d.submissionDate)}`,
  ].join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Darken a #rrggbb hex color by `amount` (0..1). Returns the input if unparseable. */
export function hexDarken(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
