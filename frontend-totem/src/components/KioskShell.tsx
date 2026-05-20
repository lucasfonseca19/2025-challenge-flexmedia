import type { CSSProperties, ReactNode } from 'react'
import { useTotem } from '../context/TotemContext'
import { getFontStack, useFontLoader } from '../hooks/useFontLoader'
import type { TotemConfig, TotemTheme } from '../types'
import { resolveTotemTheme } from '../utils/totemTheme'

type KioskTheme = {
  brandName: string
  logoUrl?: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  surfaceColor: string
  borderColor: string
  fontFamily: string
  onPrimaryColor: string
  rawPrimaryColor: string
  primaryAdjusted: boolean
  primaryRgb: string
  rawPrimaryRgb: string
  surfaceRgb: string
  textRgb: string
}

const FALLBACK_THEME: KioskTheme = {
  brandName: 'CheckIn Hub',
  primaryColor: '#0f766e',
  backgroundColor: '#171A1F',
  textColor: '#F4EFE6',
  surfaceColor: '#232A32',
  borderColor: '#3A424C',
  fontFamily: 'Satoshi',
  onPrimaryColor: '#ffffff',
  rawPrimaryColor: '#0f766e',
  primaryAdjusted: false,
  primaryRgb: '15, 118, 110',
  rawPrimaryRgb: '15, 118, 110',
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
  if (theme) {
    const resolved = resolveTotemTheme(theme)
    return {
      ...resolved,
      logoUrl: totemConfig?.config?.logoUrl || undefined,
    }
  }

  const resolved = resolveTotemTheme({
    brandName: totemConfig?.config?.nomeExibido ?? FALLBACK_THEME.brandName,
    primaryColor: totemConfig?.config?.corPrimaria ?? FALLBACK_THEME.primaryColor,
    mode: 'dark',
    backgroundColor: FALLBACK_THEME.backgroundColor,
    textColor: FALLBACK_THEME.textColor,
    surfaceColor: FALLBACK_THEME.surfaceColor,
    fontFamily: FALLBACK_THEME.fontFamily,
  })
  return {
    ...resolved,
    logoUrl: totemConfig?.config?.logoUrl || undefined,
  }
}

function shellVars(theme: KioskTheme): CSSProperties {
  return {
    '--kiosk-primary': theme.primaryColor,
    '--kiosk-primary-rgb': theme.primaryRgb,
    '--kiosk-primary-raw': theme.rawPrimaryColor,
    '--kiosk-primary-raw-rgb': theme.rawPrimaryRgb,
    '--kiosk-on-primary': theme.onPrimaryColor,
    '--kiosk-bg': theme.backgroundColor,
    '--kiosk-text': theme.textColor,
    '--kiosk-text-rgb': theme.textRgb,
    '--kiosk-surface': theme.surfaceColor,
    '--kiosk-surface-rgb': theme.surfaceRgb,
    '--kiosk-border': theme.borderColor,
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
    <div className="kiosk-frame">
      <div className="kiosk-shell" style={shellVars(theme)}>
        <div className="kiosk-shell__scrim" />

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
    </div>
  )
}

export function KioskPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`kiosk-panel ${className}`}>{children}</div>
}

export function KioskBackButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`totem-back-button ${className}`}>
      {children}
    </button>
  )
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
