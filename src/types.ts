export type BorderStyle = 'none' | 'single' | 'double' | 'decorative'
export type LogoShape = 'normal' | 'circular'
export type LogoSize = 'small' | 'medium' | 'large'
export type FontFamily = 'modern' | 'serif' | 'academic'
export type BackgroundKind = 'white' | 'offwhite' | 'cream' | 'linen'

export interface CoverState {
  // Academic details
  universityName: string
  department: string
  courseTitle: string
  courseCode: string
  assignmentTitle: string

  // Student details
  studentName: string
  studentId: string
  session: string
  year: string
  semester: string

  // Faculty details
  instructorName: string
  instructorDesignation: string

  // Metadata
  submissionDate: string // ISO yyyy-mm-dd

  // Customization
  accentColor: string
  borderStyle: BorderStyle
  fontFamily: FontFamily
  background: BackgroundKind
  logoDataUrl: string | null
  logoShape: LogoShape
  logoSize: LogoSize
}

export interface StyleOption<T extends string> {
  value: T
  label: string
}
