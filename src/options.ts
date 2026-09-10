import type {
  BackgroundKind,
  BorderStyle,
  FontFamily,
  LogoShape,
  LogoSize,
  StyleOption,
} from './types'

export const ACCENT_SWATCHES: { name: string; value: string }[] = [
  { name: 'JNU Blue', value: '#1f3a93' },
  { name: 'Navy', value: '#16255c' },
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Maroon', value: '#7b1e2b' },
  { name: 'Burgundy', value: '#6d1a36' },
  { name: 'Forest', value: '#1f5132' },
  { name: 'Teal', value: '#0f6b6b' },
  { name: 'Charcoal', value: '#2b2f38' },
]

export const BORDER_OPTIONS: StyleOption<BorderStyle>[] = [
  { value: 'none', label: 'None' },
  { value: 'single', label: 'Single Thin' },
  { value: 'double', label: 'Double Classic' },
  { value: 'decorative', label: 'Decorative' },
]

export const FONT_OPTIONS: StyleOption<FontFamily>[] = [
  { value: 'modern', label: 'Modern Sans' },
  { value: 'serif', label: 'Elegant Serif' },
  { value: 'academic', label: 'Academic (Times)' },
]

export const FONT_STACKS: Record<FontFamily, string> = {
  modern: "'Inter', 'Segoe UI', system-ui, Arial, sans-serif",
  serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
  academic: "'Times New Roman', Times, Georgia, serif",
}

export const BACKGROUND_OPTIONS: StyleOption<BackgroundKind>[] = [
  { value: 'white', label: 'Pure White' },
  { value: 'offwhite', label: 'Off-white' },
  { value: 'cream', label: 'Cream' },
  { value: 'linen', label: 'Linen Texture' },
]

export const BACKGROUND_COLORS: Record<BackgroundKind, string> = {
  white: '#ffffff',
  offwhite: '#f8f6f1',
  cream: '#fbf6e9',
  linen: '#f6f2e8',
}

export const LOGO_SHAPE_OPTIONS: StyleOption<LogoShape>[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'circular', label: 'Circular' },
]

export const LOGO_SIZE_OPTIONS: StyleOption<LogoSize>[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

// Pixel geometry for the logo on the 794 x 1123 px A4 canvas
export const LOGO_GEOMETRY: Record<
  LogoSize,
  { normalHeight: number; circleDiameter: number }
> = {
  small: { normalHeight: 84, circleDiameter: 104 },
  medium: { normalHeight: 110, circleDiameter: 134 },
  large: { normalHeight: 136, circleDiameter: 164 },
}
