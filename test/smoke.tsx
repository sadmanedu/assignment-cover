import { createRoot } from 'react-dom/client'
import App from '../src/App'

const container = document.getElementById('root')!
createRoot(container).render(<App />)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Let effects (localStorage hydration, ResizeObserver fit, fonts) settle.
;(async () => {
  await sleep(500)
  const results: Record<string, boolean> = {}
  const sheet = document.getElementById('a4-sheet')
  results['sheet exists'] = !!sheet
  const text = sheet?.textContent ?? ''
  results['university name'] = text.includes('JAGANNATH UNIVERSITY, DHAKA')
  results['department'] = text.includes('Computer Science and Engineering')
  results['course title'] = text.includes('Data Communications and Networking')
  results['course code'] = text.includes('CSE 3101')
  results['instructor'] = text.includes('Dr. Muhammad Abdullah')
  results['student'] = text.includes('Md. Sadman Islam')
  results['student id'] = text.includes('202110000012')
  results['session/year/sem'] =
    text.includes('2021-22') && text.includes('3rd Year') && text.includes('5th Semester')
  results['date label'] = text.includes('Date of Submission')
  results['signatures'] =
    text.includes('Signature of Student') && text.includes('Signature of Instructor')
  results['logo img present'] = !!sheet?.querySelector('img[alt="Institution logo"]')
  results['controls present'] =
    !!document.querySelector('aside') && !!document.getElementById('preview-stage')

  const logoSrc = sheet?.querySelector<HTMLImageElement>('img[alt="Institution logo"]')?.src
  results['logo src points to bundled png'] = !!logoSrc && logoSrc.endsWith('/jnu-logo.png')

  // --- interaction: switching border style re-renders the sheet ---
  const selects = [...document.querySelectorAll('select')]
  const borderSelect = selects.find((s) =>
    [...s.options].some((o) => o.value === 'decorative'),
  ) as HTMLSelectElement | undefined
  const sheetEl = document.getElementById('a4-sheet')!
  const choose = async (v: string) => {
    if (!borderSelect) return
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )!.set!
    setter.call(borderSelect, v)
    borderSelect.dispatchEvent(new window.Event('change', { bubbles: true }))
    await sleep(60)
  }

  await choose('none')
  const noneChildren = [...sheetEl.children].filter((c) => c.tagName === 'DIV').length
  results['border none removes frames'] = noneChildren === 1

  await choose('decorative')
  const diamonds = [...sheetEl.querySelectorAll('div')].filter((d) =>
    d.style.transform.includes('rotate(45deg)'),
  )
  results['decorative adds six diamonds'] = diamonds.length === 6

  await choose('double')
  const directChildren = [...sheetEl.children].filter((c) => c.tagName === 'DIV')
  results['double-classic frames'] = directChildren.length === 3

  // --- interaction: accent color picker tints the frames ---
  const colorInput = document.querySelector<HTMLInputElement>("input[type='color']")
  if (colorInput) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!
    setter.call(colorInput, '#7b1e2b')
    colorInput.dispatchEvent(new window.Event('change', { bubbles: true }))
    await sleep(60)
  }
  const frameUsesAccent =
    (directChildren[0] as HTMLElement).style.border.includes('rgb(123, 30, 43)')
  results['accent picker tints borders'] = frameUsesAccent

  let failed = false
  for (const [k, ok] of Object.entries(results)) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${k}`)
    if (!ok) failed = true
  }
  console.log(`\nDirect sheet div children (2 frames + content): ${directChildren.length}`)
  console.log(
    'Frame borders:',
    directChildren.slice(0, 2).map((d) => (d as HTMLElement).style.border),
  )
  console.log(`\nPreview HTML length: ${sheet?.outerHTML.length ?? 0}`)
  ;(globalThis as any).__SMOKE_FAILED__ = failed
})()
