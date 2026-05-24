import type { TotemTheme } from '../types'

export type TotemThemeMode = 'light' | 'dark'

type Rgb = [number, number, number]

export type TransactionalThemeTokens = {
  mode: TotemThemeMode
  backgroundColor: string
  surfaceColor: string
  textColor: string
  borderColor: string
}

export type ResolvedTotemTheme = TransactionalThemeTokens & {
  brandName: string
  fontFamily: string
  primaryColor: string
  rawPrimaryColor: string
  onPrimaryColor: string
  primaryAdjusted: boolean
  primaryRgb: string
  rawPrimaryRgb: string
  surfaceRgb: string
  textRgb: string
}

export const TRANSACTIONAL_THEMES: Record<TotemThemeMode, TransactionalThemeTokens> = {
  light: {
    mode: 'light',
    backgroundColor: '#F4EFE6',
    surfaceColor: '#FFF8EE',
    textColor: '#211D17',
    borderColor: '#D8CDBB',
  },
  dark: {
    mode: 'dark',
    backgroundColor: '#171A1F',
    surfaceColor: '#232A32',
    textColor: '#F4EFE6',
    borderColor: '#3A424C',
  },
}

const DEFAULT_ACCENT = '#0F766E'
const LIGHT_ON_ACCENT = '#FFFFFF'
const DARK_ON_ACCENT = '#211D17'

export function getThemeMode(theme?: Partial<TotemTheme> | null): TotemThemeMode {
  return theme?.mode === 'light' || theme?.mode === 'dark' ? theme.mode : 'dark'
}

export function getTransactionalTokens(mode?: TotemThemeMode): TransactionalThemeTokens {
  return TRANSACTIONAL_THEMES[mode ?? 'dark']
}

export function normalizePrimaryColor(value?: string | null): string {
  return normalizeHex(value) ?? DEFAULT_ACCENT
}

export function resolveTotemTheme(theme: TotemTheme): ResolvedTotemTheme {
  const mode = getThemeMode(theme)
  const tokens = getTransactionalTokens(mode)
  const rawPrimaryColor = normalizePrimaryColor(theme.primaryColor)
  const accent = getAccessibleAccent(rawPrimaryColor, tokens.backgroundColor)

  return {
    ...tokens,
    brandName: theme.brandName || 'CheckIn Hub',
    fontFamily: theme.fontFamily || 'Satoshi',
    primaryColor: accent.color,
    rawPrimaryColor,
    onPrimaryColor: accent.onColor,
    primaryAdjusted: accent.adjusted,
    primaryRgb: rgbToString(hexToRgb(accent.color) ?? hexToRgb(DEFAULT_ACCENT)!),
    rawPrimaryRgb: rgbToString(hexToRgb(rawPrimaryColor) ?? hexToRgb(DEFAULT_ACCENT)!),
    surfaceRgb: rgbToString(hexToRgb(tokens.surfaceColor)!),
    textRgb: rgbToString(hexToRgb(tokens.textColor)!),
  }
}

export function resolveThemeForSave(theme: TotemTheme): TotemTheme {
  const mode = getThemeMode(theme)
  const tokens = getTransactionalTokens(mode)
  return {
    ...theme,
    mode,
    primaryColor: normalizePrimaryColor(theme.primaryColor),
    backgroundColor: tokens.backgroundColor,
    surfaceColor: tokens.surfaceColor,
    textColor: tokens.textColor,
  }
}

function getAccessibleAccent(rawColor: string, backgroundColor: string): { color: string; onColor: string; adjusted: boolean } {
  const rawRgb = hexToRgb(rawColor)
  const bgRgb = hexToRgb(backgroundColor)
  if (!rawRgb || !bgRgb) {
    return { color: DEFAULT_ACCENT, onColor: LIGHT_ON_ACCENT, adjusted: true }
  }

  const candidates: Array<{ color: string; distance: number }> = [{ color: rawColor, distance: 0 }]
  for (let step = 1; step <= 18; step += 1) {
    const amount = step / 20
    candidates.push({ color: mixHex(rawColor, '#000000', amount), distance: amount })
    candidates.push({ color: mixHex(rawColor, '#FFFFFF', amount), distance: amount })
  }

  let best: { color: string; onColor: string; distance: number; score: number } | null = null

  for (const candidate of candidates) {
    const colorRgb = hexToRgb(candidate.color)
    if (!colorRgb) continue
    const onColor = pickOnAccent(candidate.color)
    const textContrast = contrastRatio(colorRgb, hexToRgb(onColor)!)
    const uiContrast = contrastRatio(colorRgb, bgRgb)
    const passes = textContrast >= 4.5 && uiContrast >= 3
    const score = Math.min(textContrast / 4.5, uiContrast / 3)

    if (passes && (!best || candidate.distance < best.distance || (candidate.distance === best.distance && score > best.score))) {
      best = { color: candidate.color, onColor, distance: candidate.distance, score }
    }
  }

  if (best) {
    return { color: best.color, onColor: best.onColor, adjusted: best.color.toLowerCase() !== rawColor.toLowerCase() }
  }

  return { color: DEFAULT_ACCENT, onColor: LIGHT_ON_ACCENT, adjusted: rawColor.toLowerCase() !== DEFAULT_ACCENT.toLowerCase() }
}

function pickOnAccent(color: string): string {
  const rgb = hexToRgb(color)
  if (!rgb) return LIGHT_ON_ACCENT
  const whiteContrast = contrastRatio(rgb, hexToRgb(LIGHT_ON_ACCENT)!)
  const darkContrast = contrastRatio(rgb, hexToRgb(DARK_ON_ACCENT)!)
  return whiteContrast >= darkContrast ? LIGHT_ON_ACCENT : DARK_ON_ACCENT
}

function normalizeHex(value?: string | null): string | null {
  if (!value) return null
  const normalized = value.trim().replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null
  return `#${expanded.toUpperCase()}`
}

function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const value = normalized.slice(1)
  const n = Number.parseInt(value, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToString(rgb: Rgb): string {
  return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`
}

function mixHex(from: string, to: string, amount: number): string {
  const fromRgb = hexToRgb(from) ?? hexToRgb(DEFAULT_ACCENT)!
  const toRgb = hexToRgb(to) ?? [0, 0, 0]
  const next = fromRgb.map((channel, index) => Math.round(channel + (toRgb[index] - channel) * amount)) as Rgb
  return `#${next.map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(channel => {
    const normalized = channel / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
