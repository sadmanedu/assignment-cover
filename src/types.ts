export type BorderStyle = 'none' | 'single' | 'double' | 'decorative';
export type LogoShape = 'normal' | 'circular';
export type FontKey = 'sans' | 'formal' | 'saira';
export type BackgroundKey = 'white' | 'offwhite' | 'cream' | 'gray' | 'linen';

export interface CoverData {
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
  submissionDate: string; // yyyy-mm-dd
}

export interface CoverSettings {
  accentColor: string;
  borderStyle: BorderStyle;
  logoDataUrl: string | null; // null → default generated emblem
  logoShape: LogoShape;
  logoSize: number; // mm
  fontKey: FontKey;
  backgroundKey: BackgroundKey;
}

export type SheetProps = CoverData & CoverSettings & { emblemUrl: string };
