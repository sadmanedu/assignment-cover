export type BorderStyle =
  | 'none'
  | 'single'
  | 'bold'
  | 'double'
  | 'inset'
  | 'decorative'
  | 'corners'
  | 'flourish'
  | 'stitched';
export type DividerStyle =
  | 'hairline'
  | 'dashed'
  | 'double'
  | 'diamond'
  | 'dots'
  | 'accent'
  | 'fade'
  | 'none';
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
  /** Hairline and the other rule styles used between the cover's blocks. */
  dividerStyle: DividerStyle;
  logoDataUrl: string | null; // null → default generated emblem
  logoShape: LogoShape;
  logoSize: number; // mm
  fontKey: FontKey;
  backgroundKey: BackgroundKey;
  /**
   * Proportional scale (1 = 100%) for the body of the cover — department, course,
   * title, and the Submitted To / Submitted By blocks. The logo, university name
   * and submission date keep their size; everything inside the block scales
   * together so the layout stays proportional.
   */
  contentScale: number;
}

export type SheetProps = CoverData & CoverSettings & { emblemUrl: string };
