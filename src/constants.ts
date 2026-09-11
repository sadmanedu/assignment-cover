import type { BackgroundKey, BorderStyle, CoverData, CoverSettings, FontKey } from './types';

/** A4 sheet metrics (96dpi screen px for a 210×297mm sheet). */
export const A4 = { wMm: 210, hMm: 297, wPx: 793.7, hPx: 1122.5 } as const;

export const STORAGE_KEY = 'assignment-cover.v1';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const DEFAULT_DATA: CoverData = {
  universityName: 'JAGANNATH UNIVERSITY, DHAKA',
  department: 'Department of Computer Science & Engineering',
  courseTitle: 'Data Structures and Algorithms',
  courseCode: 'CSE 2203',
  assignmentTitle: 'Design, Implementation and Analysis of Binary Search Trees',
  studentName: 'Md. Rahim Ahmed',
  studentId: '2021-123456-12',
  session: '2024',
  year: '2',
  semester: '4',
  instructorName: 'Prof. Dr. Abu Bakar Siddique',
  instructorDesignation: 'Professor, Department of CSE',
  submissionDate: todayISO(),
};

/** Official JNU crest shipped with the app (public/jnu-logo.png). */
export const DEFAULT_LOGO_URL = '/jnu-logo.png';

export const DEFAULT_SETTINGS: CoverSettings = {
  accentColor: '#1e3a8a',
  borderStyle: 'double',
  logoDataUrl: DEFAULT_LOGO_URL,
  logoShape: 'normal',
  logoSize: 36,
  fontKey: 'sans',
  backgroundKey: 'white',
};

export const ACCENT_PRESETS: { name: string; value: string }[] = [
  { name: 'DU Blue', value: '#1e3a8a' },
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Maroon', value: '#7f1d1d' },
  { name: 'Emerald', value: '#065f46' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Purple', value: '#6d28d9' },
  { name: 'Ink', value: '#111827' },
];

/**
 * Font stacks — 'Anek Bangla' sits right after the Latin font in every stack:
 * CSS falls back per-glyph, so English/Latin always uses the primary font and
 * Anek Bangla only renders when actual Bengali text appears.
 */
export const FONT_STACKS: Record<FontKey, string> = {
  sans: `'Inter','Anek Bangla','Segoe UI',system-ui,-apple-system,sans-serif`,
  formal: `'Palatino Linotype','Book Antiqua',Palatino,'Anek Bangla',Georgia,serif`,
  saira: `'Saira Semi Condensed','Anek Bangla','Arial Narrow',Arial,sans-serif`,
};

export const FONT_OPTIONS: { key: FontKey; label: string; hint: string }[] = [
  { key: 'sans', label: 'Modern Sans', hint: 'Inter' },
  { key: 'formal', label: 'Formal', hint: 'Palatino' },
  { key: 'saira', label: 'Saira Semi Condensed', hint: 'Condensed Sans' },
];

export const BORDER_OPTIONS: { key: BorderStyle; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'single', label: 'Single Thin' },
  { key: 'double', label: 'Double Classic' },
  { key: 'decorative', label: 'Decorative' },
];

export const BACKGROUNDS: Record<
  BackgroundKey,
  { label: string; css: string; solid: string; swatch: string }
> = {
  white: { label: 'Pure White', css: '#ffffff', solid: '#ffffff', swatch: '#ffffff' },
  offwhite: { label: 'Off-White', css: '#faf9f6', solid: '#faf9f6', swatch: '#faf9f6' },
  cream: { label: 'Cream', css: '#fdf6e7', solid: '#fdf6e7', swatch: '#fdf6e7' },
  gray: { label: 'Light Gray', css: '#f1f3f6', solid: '#f1f3f6', swatch: '#f1f3f6' },
  linen: {
    label: 'Linen Texture',
    css: 'repeating-linear-gradient(0deg,#f7f5f0 0px,#f7f5f0 2px,#f3f0e9 2px,#f3f0e9 4px)',
    solid: '#f5f2ec',
    swatch: '#f5f2ec',
  },
};

export const LOGO_SIZE_MIN = 24;
export const LOGO_SIZE_MAX = 60;
