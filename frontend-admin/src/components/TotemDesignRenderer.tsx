import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { TotemBlock, TotemCarouselSpeed, TotemContentItem, TotemDesign } from '../types'
import { FONTS } from '../constants/fonts'
import { resolveTotemTheme, type ResolvedTotemTheme } from '../utils/totemTheme'

export type TotemPreviewScreen = 'idle' | 'actions' | 'search' | 'confirm' | 'facial' | 'key' | 'checkout'
type ContentLanguage = 'pt' | 'en' | 'es'

interface Props {
  design: TotemDesign
  scale?: 'preview' | 'runtime'
  carouselPaused?: boolean
  language?: ContentLanguage
}

export default function TotemDesignRenderer({ design, scale = 'preview', carouselPaused = false, language = 'pt' }: Props) {
  const font = FONTS.find(f => f.id === design.theme.fontFamily)
  const fontStack = font ? `'${font.id}', system-ui, sans-serif` : 'system-ui, sans-serif'
  const resolvedTheme = resolveTotemTheme(design.theme)
  const heroBlock = design.blocks.find(block => block.type === 'hero' && block.visible)
  const videoBlock = design.blocks.find(block => block.type === 'video' && block.visible && block.videoUrl)
  const carouselBlock = design.blocks.find(block => block.type === 'carousel' && block.visible)
  const contentItems = useMemo(() => getVisibleContentItems(carouselBlock, language), [carouselBlock, language])

  return (
    <div
      className={`relative isolate h-full w-full overflow-hidden text-left ${scale === 'preview' ? 'rounded-[1.75rem]' : ''}`}
      style={{
        background: resolvedTheme.backgroundColor,
        color: resolvedTheme.textColor,
        fontFamily: fontStack,
      }}
    >
      <link rel="stylesheet" href={font?.href} />
      {videoBlock?.videoUrl && (
        <video src={videoBlock.videoUrl} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
      )}
      {!videoBlock?.videoUrl && heroBlock?.imageUrl && (
        <img src={heroBlock.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${(heroBlock?.overlay ?? 42) / 100})` }} />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          background:
            `radial-gradient(ellipse at 18% 82%, ${resolvedTheme.rawPrimaryColor} 0, transparent 50%), ` +
            `linear-gradient(180deg, rgba(255,255,255,0.08), transparent 35%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-82">
            <span className="h-2 w-2 rounded-full" style={{ background: resolvedTheme.rawPrimaryColor }} />
            {resolvedTheme.brandName}
          </div>
        </header>

        <main className="-mx-7 flex flex-1 items-center overflow-hidden py-8">
          {contentItems.length > 0 && (
            <ContentCarousel items={contentItems} speed={carouselBlock?.speed} paused={carouselPaused} language={language} />
          )}
        </main>

        <footer>
          <div className="mb-4 flex justify-center">
            <div className="animate-pulse rounded-[1.25rem] px-6 py-4 text-sm font-bold" style={{ background: resolvedTheme.primaryColor, color: resolvedTheme.onPrimaryColor }}>
              Toque para começar
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {['PT', 'EN', 'ES'].map(lang => (
              <span key={lang} className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85">
                {lang}
              </span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}

function ContentCarousel({ items, speed, paused, language }: {
  items: TotemContentItem[]
  speed?: TotemCarouselSpeed
  paused: boolean
  language: ContentLanguage
}) {
  const [viewportRef, viewportWidth] = useMeasuredWidth()

  if (items.length === 1) {
    return (
      <div className="flex w-full justify-center px-2">
        <ContentCard item={items[0]} language={language} />
      </div>
    )
  }

  const loopItems = [...items, ...items]

  return (
    <div className="w-full overflow-hidden" ref={viewportRef}>
      <div
        className="inline-flex w-max will-change-transform"
        style={{
          animation: `totemContentMarquee ${getCarouselDuration(speed)}ms linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {loopItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex shrink-0 justify-center px-2" style={{ width: viewportWidth || '100%' }}>
            <ContentCard item={item} language={language} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentCard({ item, language }: { item: TotemContentItem; language: ContentLanguage }) {
  const hasMedia = Boolean(item.mediaUrl)
  const backgroundColor = item.backgroundColor || '#1d342b'
  const text = getLocalizedContentText(item, language)

  return (
    <article
      key={item.id}
      className="relative min-h-[13.5rem] w-[82%] overflow-hidden rounded-[1.35rem] border border-white/12 p-6 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.9)] backdrop-blur-md"
      style={{
        background: hasMedia
          ? 'rgba(255,255,255,0.09)'
          : `linear-gradient(145deg, ${hexToRgba(backgroundColor, 0.98)}, ${hexToRgba(backgroundColor, 0.74)})`,
      }}
    >
      {item.mediaUrl && (
        item.mediaType === 'video' ? (
          <video src={item.mediaUrl} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
        ) : (
          <img src={item.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )
      )}
      {hasMedia && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.72))]" />}
      {!hasMedia && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.18))]" />}
      <div className={`relative z-10 flex h-full min-h-[10.5rem] ${getTextPositionClass(item.textPosition)}`}>
        <p className="max-w-full break-words text-[1.48rem] font-semibold leading-[1.1] text-white [overflow-wrap:anywhere]">
          {text}
        </p>
      </div>
    </article>
  )
}

export function TotemFlowPreview({ design, screen }: { design: TotemDesign; screen: Exclude<TotemPreviewScreen, 'idle'> }) {
  const font = FONTS.find(f => f.id === design.theme.fontFamily)
  const fontStack = font ? `'${font.id}', system-ui, sans-serif` : 'system-ui, sans-serif'
  const resolvedTheme = resolveTotemTheme(design.theme)
  const spec = FLOW_SPECS[screen]
  const vars = previewVars(resolvedTheme, fontStack)

  if (screen === 'actions') {
    return <ActionsFlowPreview design={design} resolvedTheme={resolvedTheme} fontStack={fontStack} fontHref={font?.href} />
  }

  return (
    <div
      className="kiosk-shell studio-kiosk-shell text-left"
      style={vars}
    >
      <link rel="stylesheet" href={font?.href} />
      <div className="kiosk-shell__scrim" />
      <header className="kiosk-topbar">
        <div className="kiosk-brand">
          <span className="kiosk-brand__mark" />
          <span>{resolvedTheme.brandName}</span>
        </div>
      </header>

      <main className="kiosk-main max-w-3xl">
        {spec.eyebrow && <p className="kiosk-eyebrow">{spec.eyebrow}</p>}
        <h2 className="kiosk-title">{spec.title}</h2>
        {spec.subtitle && <p className="kiosk-subtitle">{spec.subtitle}</p>}
        <div className="kiosk-content">{renderPreviewBody(screen, resolvedTheme)}</div>
      </main>
    </div>
  )
}

function ActionsFlowPreview({ design, resolvedTheme, fontStack, fontHref }: { design: TotemDesign; resolvedTheme: ResolvedTotemTheme; fontStack: string; fontHref?: string }) {
  const asset = getAttractAsset(design)
  const heroBlock = design.blocks.find(block => block.type === 'hero' && block.visible)
  const overlayOpacity = Math.min((heroBlock?.overlay ?? 42) + 14, 85)

  return (
    <div
      className="relative isolate flex h-full w-full select-none flex-col overflow-hidden rounded-[1.75rem] text-left"
      style={{ background: resolvedTheme.backgroundColor, color: resolvedTheme.textColor, fontFamily: fontStack }}
    >
      <link rel="stylesheet" href={fontHref} />
      {asset?.type === 'video' && (
        <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {asset && <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${overlayOpacity / 100})` }} />}

      <div className="relative z-10 flex h-full flex-col justify-between p-8">
        <button type="button" className="totem-back-button self-start">
          &larr; Voltar
        </button>

        <div className="totem-choice-stage totem-block-enter">
          <div className="totem-choice-wrap">
            <div className="totem-choice-grid">
              <button type="button" className="totem-choice-card touch-press" style={{ background: resolvedTheme.primaryColor, color: resolvedTheme.onPrimaryColor }}>
                <span className="totem-choice-card__label">Entrada</span>
                <span className="totem-choice-card__title">Check in</span>
              </button>
              <button
                type="button"
                className="totem-choice-card touch-press"
                style={{
                  background: hexToRgba(resolvedTheme.surfaceColor, 0.78),
                  borderColor: hexToRgba(resolvedTheme.borderColor, 0.72),
                  color: resolvedTheme.textColor,
                }}
              >
                <span className="totem-choice-card__label">Saída</span>
                <span className="totem-choice-card__title">Check out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const FLOW_SPECS: Record<Exclude<TotemPreviewScreen, 'idle'>, { eyebrow: string; title: string; subtitle: string }> = {
  actions: { eyebrow: '', title: 'Entrada ou saída?', subtitle: '' },
  search: { eyebrow: 'Check-in', title: 'Identificação', subtitle: 'Informe o código ou CPF para iniciar o atendimento.' },
  confirm: { eyebrow: 'Conferência', title: 'Confirmar dados', subtitle: 'Revise os dados antes de continuar.' },
  facial: { eyebrow: '', title: 'Reconhecimento facial', subtitle: '' },
  key: { eyebrow: '', title: 'Chave emitida', subtitle: '' },
  checkout: { eyebrow: 'Check-out', title: 'Confirmar saída', subtitle: 'Finalize sua estadia com segurança.' },
}

function renderPreviewBody(screen: Exclude<TotemPreviewScreen, 'idle'>, resolvedTheme: ResolvedTotemTheme) {
  if (screen === 'confirm' || screen === 'checkout') {
    return (
      <div className="kiosk-panel p-5 text-sm">
        {['Hóspede', 'Quarto', 'Check-in', 'Check-out'].map((label, index) => (
          <div key={label} className="flex justify-between border-b border-white/10 py-2.5 last:border-0">
            <span className="opacity-60">{label}</span>
            <span className="font-semibold">{index === 1 ? '1208' : index === 0 ? 'Maria Silva' : '24/05/2026'}</span>
          </div>
        ))}
        <div className="kiosk-button kiosk-button--primary mt-4 flex items-center justify-center">
          {screen === 'checkout' ? 'Confirmar saída' : 'Confirmar'}
        </div>
      </div>
    )
  }

  if (screen === 'facial') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="aspect-square w-48 rounded-[2rem] border-2 border-blue-400/60 bg-black/30">
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-10 w-10 rounded-full border-2 border-white/10 bg-white/[0.04]" />
          </div>
        </div>
        <p className="text-xs opacity-50">Posicione o rosto para validar sua identidade</p>
        <div className="kiosk-button kiosk-button--primary flex w-48 items-center justify-center">
          Validar rosto
        </div>
      </div>
    )
  }

  if (screen === 'key') {
    return (
      <div className="grid grid-cols-[0.8fr_1fr] gap-4">
        <div className="aspect-square rounded-2xl bg-white p-3">
          <div className="h-full w-full rounded-xl bg-slate-950" />
        </div>
        <div className="kiosk-panel p-4 text-sm">
          <p className="font-bold opacity-60">Token</p>
          <p className="mt-3 font-mono text-lg font-bold">A91F-28CB</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="kiosk-input opacity-55">
        Digite seu código ou CPF
      </div>
      <div className="kiosk-button kiosk-button--primary flex items-center justify-center" style={{ background: resolvedTheme.primaryColor, color: resolvedTheme.onPrimaryColor }}>
        Buscar
      </div>
      <button type="button" className="totem-back-button mt-2 self-start">
        &larr; Voltar
      </button>
    </div>
  )
}

function getAttractAsset(design: TotemDesign): { type: 'video' | 'image'; url: string } | null {
  const videoBlock = design.blocks.find(block => block.type === 'video' && block.visible && block.videoUrl)
  if (videoBlock?.videoUrl) return { type: 'video', url: videoBlock.videoUrl }
  const heroBlock = design.blocks.find(block => block.type === 'hero' && block.visible && block.imageUrl)
  if (heroBlock?.imageUrl) return { type: 'image', url: heroBlock.imageUrl }
  return null
}

function previewVars(theme: ResolvedTotemTheme, fontStack: string): CSSProperties {
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
    color: theme.textColor,
    fontFamily: fontStack,
  } as CSSProperties
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return `rgba(15, 118, 110, ${alpha})`
  const n = Number.parseInt(value, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function getVisibleContentItems(block: TotemBlock | undefined, language: ContentLanguage): TotemContentItem[] {
  return Array.isArray(block?.contentItems)
    ? block.contentItems.filter(item => getLocalizedContentText(item, language).trim().length > 0)
    : []
}

function getLocalizedContentText(item: TotemContentItem, language: ContentLanguage): string {
  return item.texts?.[language]?.trim() || item.text?.trim() || item.texts?.pt?.trim() || ''
}

function getTextPositionClass(position?: TotemContentItem['textPosition']): string {
  if (position === 'top') return 'items-start'
  if (position === 'bottom') return 'items-end'
  return 'items-center'
}

function getCarouselDuration(speed?: TotemCarouselSpeed): number {
  if (typeof speed === 'number') {
    const normalized = Math.min(100, Math.max(0, speed)) / 100
    const eased = Math.pow(normalized, 1.35)
    return Math.round(46000 - eased * 37000)
  }
  if (speed === 'slow') return 46000
  if (speed === 'fast') return 9000
  return 26000
}

function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateWidth = () => setWidth(element.clientWidth)
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
