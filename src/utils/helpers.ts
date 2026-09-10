import type { CoverState } from '../types'

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function fallback(value: string, placeholder: string): string {
  const v = value.trim()
  return v.length === 0 ? placeholder : v
}

/**
 * Down-scales an uploaded logo so it stays crisp but keeps the persisted
 * JSON / localStorage payload small. Returns a PNG/JPEG data URL.
 */
export function fileToLogoDataUrl(file: File, maxSize = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('The selected file is not a valid image.'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(String(reader.result))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        // Keep PNG alpha for transparent logos; fall back to JPEG for photos.
        if (file.type === 'image/png' || file.type === 'image/svg+xml') {
          resolve(canvas.toDataURL('image/png'))
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.92))
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: 'application/json' }), filename)
}

export function buildDetailsText(state: CoverState): string {
  return [
    'JAGANNATH UNIVERSITY, DHAKA',
    state.department,
    '',
    `Course Title : ${state.courseTitle}`,
    `Course Code  : ${state.courseCode}`,
    `Title        : ${state.assignmentTitle}`,
    '',
    'Submitted To:',
    `  ${state.instructorName}`,
    `  ${state.instructorDesignation}`,
    '',
    'Submitted By:',
    `  Name       : ${state.studentName}`,
    `  ID/Roll    : ${state.studentId}`,
    `  Session    : ${state.session}`,
    `  Year       : ${state.year}`,
    `  Semester   : ${state.semester}`,
    '',
    `Date of Submission: ${formatDate(state.submissionDate)}`,
  ].join('\n')
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'assignment-cover'
  )
}
