import { hexDarken } from './format';

/**
 * Default institutional emblem — a clean circular academic seal
 * (torch of knowledge, open book, lotus) tinted with the active accent color.
 * Rendered as an SVG data URL so the live preview and PNG/PDF export are identical.
 */
export function emblemDataUrl(accent: string): string {
  const a = accent;
  const dark = hexDarken(accent, 0.3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="248" fill="none" stroke="${a}" stroke-width="10"/>
  <circle cx="256" cy="256" r="232" fill="none" stroke="${a}" stroke-width="2.5"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="${a}" stroke-width="2"/>
  <path d="M256 112 C263 132 284 150 284 177 C284 198 271 211 256 211 C241 211 228 198 228 177 C228 150 249 132 256 112 Z" fill="#f59e0b" stroke="#d97706" stroke-width="3"/>
  <path d="M256 152 C261.5 163 270 169 270 182 C270 193 264 199 256 199 C248 199 242 193 242 182 C242 169 250.5 163 256 152 Z" fill="#fde68a"/>
  <path d="M256 224 C240 213 211 211 191 218 L191 266 C211 259 240 261 256 271 Z" fill="#ffffff" stroke="${a}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M256 224 C272 213 301 211 321 218 L321 266 C301 259 272 261 256 271 Z" fill="#ffffff" stroke="${a}" stroke-width="3.5" stroke-linejoin="round"/>
  <line x1="256" y1="224" x2="256" y2="271" stroke="${a}" stroke-width="3"/>
  <path d="M203 232 C217 228 234 230 244 236 M203 244 C217 240 234 242 244 248 M203 256 C217 252 234 254 244 260" fill="none" stroke="${dark}" stroke-width="2.2" opacity="0.5"/>
  <path d="M309 232 C295 228 278 230 268 236 M309 244 C295 240 278 242 268 248 M309 256 C295 252 278 254 268 260" fill="none" stroke="${dark}" stroke-width="2.2" opacity="0.5"/>
  <g fill="#dc2626" stroke="#991b1b" stroke-width="2" stroke-linejoin="round">
    <path d="M256 289 C266 300 266 318 256 331 C246 318 246 300 256 289 Z"/>
    <path d="M256 289 C266 300 266 318 256 331 C246 318 246 300 256 289 Z" transform="rotate(-46 256 331)"/>
    <path d="M256 289 C266 300 266 318 256 331 C246 318 246 300 256 289 Z" transform="rotate(46 256 331)"/>
  </g>
  <path d="M224 338 Q256 350 288 338" fill="none" stroke="#991b1b" stroke-width="3" stroke-linecap="round"/>
  <rect x="249" y="362" width="14" height="14" transform="rotate(45 256 369)" fill="${a}"/>
  <rect x="70" y="249" width="14" height="14" transform="rotate(45 77 256)" fill="${a}"/>
  <rect x="428" y="249" width="14" height="14" transform="rotate(45 435 256)" fill="${a}"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
