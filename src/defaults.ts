import type { CoverState } from './types'

const todayISO = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export const DEFAULT_STATE: CoverState = {
  // Academic details
  universityName: 'JAGANNATH UNIVERSITY, DHAKA',
  department: 'Department of Computer Science and Engineering',
  courseTitle: 'Data Communications and Networking',
  courseCode: 'CSE 3101',
  assignmentTitle: 'Assignment on Data Communications and Networking',

  // Student details
  studentName: 'Md. Sadman Islam',
  studentId: '202110000012',
  session: '2021-22',
  year: '3rd Year',
  semester: '5th Semester',

  // Faculty details
  instructorName: 'Dr. Muhammad Abdullah',
  instructorDesignation: 'Professor, Department of Computer Science and Engineering',

  // Metadata
  submissionDate: todayISO(),

  // Customization
  accentColor: '#1f3a93',
  borderStyle: 'double',
  fontFamily: 'modern',
  background: 'white',
  logoDataUrl: null,
  logoShape: 'normal',
  logoSize: 'medium',
}

export const STORAGE_KEY = 'jnu-cover-designer:v1'
