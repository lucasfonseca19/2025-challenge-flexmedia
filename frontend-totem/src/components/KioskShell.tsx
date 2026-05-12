import type { CSSProperties, ReactNode } from 'react'
import { useTotem } from '../context/TotemContext'
import { getFontStack, useFontLoader } from '../hooks/useFontLoader'
import type { TotemConfig, TotemTheme } from '../types'

type KioskTheme = {
  brandName: string
  logoUrl?: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  surfaceColor: string
  fontFamily: string
  primaryRgb: string
  surfaceRgb: string
  textRgb: string
}

const FALLBACK_THEME: KioskTheme = {
  brandName: 'CheckIn Hub',
  primaryColor: '#0f766e',
  backgroundColor: '#101513',
  textColor: '#f7fbf8',
  surfaceColor: '#18211d',
  fontFamily: 'Satoshi',
  primaryRgb: '15, 118, 110',
  surfaceRgb: '24, 33, 29',
  textRgb: '247, 251, 248',
}

export function useKioskTheme(): KioskTheme {
  const { totemConfig } = useTotem()
  const theme = totemConfig?.design?.theme
  const nextTheme = buildKioskTheme(totemConfig, theme)
  useFontLoader(nextTheme.fontFamily)
  return nextTheme
}

function buildKioskTheme(totemConfig: TotemConfig | null, theme?: TotemTheme): KioskTheme {
  const primaryColor = theme?.primaryColor ?? totemConfig?.config?.corPrimaria ?? FALLBACK_THEME.primaryColor
  const backgroundColor = theme?.backgroundColor ?? FALLBACK_THEME.backgroundColor
  const textColor = theme?.textColor ?? FALLBACK_THEME.textColor
  const surfaceColor = theme?.surfaceColor ?? FALLBACK_THEME.surfaceColor

  return {
    brandName: theme?.brandName ?? totemConfig?.config?.nomeExibido ?? FALLBACK_THEME.brandName,
    logoUrl: totemConfig?.config?.logoUrl || undefined,
    primaryColor,
    backgroundColor,
    textColor,
    surfaceColor,
    fontFamily: theme?.fontFamily ?? FALLBACK_THEME.fontFamily,
    primaryRgb: hexToRgb(primaryColor) ?? FALLBACK_THEME.primaryRgb,
    surfaceRgb: hexToRgb(surfaceColor) ?? FALLBACK_THEME.surfaceRgb,
    textRgb: hexToRgb(textColor) ?? FALLBACK_THEME.textRgb,
  }
}

function hexToRgb(hex: string): string | null {
  const normalized = hex.trim().replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null
  const n = Number.parseInt(value, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

function shellVars(theme: KioskTheme): CSSProperties {
  return {
    '--kiosk-primary': theme.primaryColor,
    '--kiosk-primary-rgb': theme.primaryRgb,
    '--kiosk-bg': theme.backgroundColor,
    '--kiosk-text': theme.textColor,
    '--kiosk-text-rgb': theme.textRgb,
    '--kiosk-surface': theme.surfaceColor,
    '--kiosk-surface-rgb': theme.surfaceRgb,
    fontFamily: getFontStack(theme.fontFamily),
  } as CSSProperties
}

export function KioskShell({
  children,
  title,
  eyebrow,
  subtitle,
  actions,
  maxWidth = 'max-w-3xl',
}: {
  children: ReactNode
  title: string
  eyebrow?: string
  subtitle?: string
  actions?: ReactNode
  maxWidth?: string
}) {
  const theme = useKioskTheme()

  return (
    <div className="kiosk-shell" style={shellVars(theme)}>
      <div className="kiosk-grid" />
      <header className="kiosk-topbar">
        <div className="kiosk-brand">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt="" className="kiosk-brand__logo" />
          ) : (
            <span className="kiosk-brand__mark" />
          )}
          <span>{theme.brandName}</span>
        </div>
      </header>

      <main className={`kiosk-main ${maxWidth}`}>
        {eyebrow && <p className="kiosk-eyebrow">{eyebrow}</p>}
        <h1 className="kiosk-title">{title}</h1>
        {subtitle && <p className="kiosk-subtitle">{subtitle}</p>}
        <div className="kiosk-content">{children}</div>
        {actions && <div className="kiosk-actions">{actions}</div>}
      </main>
    </div>
  )
}

export function KioskPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`kiosk-panel ${className}`}>{children}</div>
}

export function KioskButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  return (
    <button {...props} className={`kiosk-button kiosk-button--${variant} ${className}`}>
      {children}
    </button>
  )
}

export function KioskInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`kiosk-input ${props.className ?? ''}`} />
}
