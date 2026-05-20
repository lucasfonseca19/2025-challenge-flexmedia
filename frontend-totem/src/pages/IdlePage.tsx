import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import type { Idioma, TotemBlock, TotemCarouselSpeed, TotemContentItem, TotemDesign } from '../types'
import { useFontLoader, getFontStack } from '../hooks/useFontLoader'
import { getTransactionalTokens, resolveTotemTheme, type ResolvedTotemTheme } from '../utils/totemTheme'

type IdleAsset = {
  type: 'video' | 'image'
  url: string
} | null

function getAttractAsset(design: TotemDesign | null): IdleAsset {
  if (design) {
    const videoBlock = design.blocks.find(b => b.type === 'video' && b.visible && b.videoUrl)
    if (videoBlock?.videoUrl) return { type: 'video', url: videoBlock.videoUrl }
    const heroBlock = design.blocks.find(b => b.type === 'hero' && b.visible && b.imageUrl)
    if (heroBlock?.imageUrl) return { type: 'image', url: heroBlock.imageUrl }
  }
  return null
}

const IDIOMAS: Idioma[] = ['pt', 'en', 'es']

export default function IdlePage() {
  const navigate = useNavigate()
  const { resetar, totemConfig, idioma, setIdioma, setFluxo, t } = useTotem()
  const design = totemConfig?.design ?? null
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<'attract' | 'actions'>('attract')
  const conteudo = [...(totemConfig?.conteudo ?? [])].sort((a, b) => a.ordemExibicao - b.ordemExibicao)

  useFontLoader(design?.theme.fontFamily ?? 'Satoshi')

  useEffect(() => { resetar() }, [resetar])

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 150)
    return () => clearTimeout(timer)
  }, [])

  const handleNavigate = (fluxo: 'checkin' | 'checkout') => {
    setFluxo(fluxo)
    navigate('/buscar-reserva')
  }
  const handleLanguage = (lang: Idioma) => setIdioma(lang)

  if (design && ready) {
    return (
      <RuntimeScreenFrame design={design}>
        {step === 'attract'
          ? <AttractDesign design={design} idioma={idioma} t={t} onLanguage={handleLanguage} onActivate={() => setStep('actions')} />
          : <ActionsDesign design={design} t={t} onNavigate={handleNavigate} onBack={() => setStep('attract')} />}
      </RuntimeScreenFrame>
    )
  }

  if (ready) {
    return step === 'attract'
      ? <AttractFallback totemConfig={totemConfig} conteudo={conteudo} idioma={idioma} t={t} onLanguage={handleLanguage} onActivate={() => setStep('actions')} />
      : <ActionsFallback t={t} onNavigate={handleNavigate} onBack={() => setStep('attract')} />
  }

  return <div className="min-h-[100dvh] w-screen bg-[#101513]" />
}

function RuntimeScreenFrame({ design, children }: {
  design: TotemDesign
  children: ReactNode
}) {
  const portrait = design.layout.screen !== 'landscape'
  const tokens = getTransactionalTokens(design.theme.mode)
  const stageStyle = portrait
    ? {
        aspectRatio: '9 / 16',
        height: 'min(100dvh, 177.7778vw)',
      }
    : { aspectRatio: '16 / 9', width: 'min(100vw, 177.7778dvh)' }

  return (
    <div
      className="flex min-h-[100dvh] w-screen items-center justify-center overflow-hidden"
      style={{ background: tokens.backgroundColor }}
    >
      <div className="max-h-[100dvh] max-w-[100vw] overflow-hidden" style={stageStyle}>
        {children}
      </div>
    </div>
  )
}

function AttractDesign({ design, idioma, t, onLanguage, onActivate }: {
  design: TotemDesign
  idioma: Idioma
  t: Record<string, any>
  onLanguage: (lang: Idioma) => void
  onActivate: () => void
}) {
  const asset = getAttractAsset(design)
  const resolvedTheme = resolveTotemTheme(design.theme)
  const fontStack = getFontStack(resolvedTheme.fontFamily)
  const heroBlock = design.blocks.find(b => b.type === 'hero' && b.visible)
  const hasLanguage = design.blocks.some(b => b.type === 'language' && b.visible)
  const carouselBlock = design.blocks.find(b => b.type === 'carousel' && b.visible)
  const contentItems = useMemo(() => getVisibleContentItems(carouselBlock, idioma), [carouselBlock, idioma])
  const overlayOpacity = heroBlock?.overlay ?? 42

  return (
    <div
      className="relative isolate flex h-full w-full select-none flex-col overflow-hidden"
      style={idleThemeVars(resolvedTheme, fontStack)}
    >
      {asset?.type === 'video' && (
        <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {asset && <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${overlayOpacity / 100})` }} />}

      {asset && (
        <div
          className="absolute inset-0 -z-10 opacity-[0.12]"
          style={{
            background:
              `radial-gradient(ellipse at 20% 80%, ${resolvedTheme.rawPrimaryColor} 0, transparent 50%), ` +
              `radial-gradient(ellipse at 80% 20%, ${resolvedTheme.surfaceColor} 0, transparent 45%)`,
          }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col justify-between p-7">
        <header className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-82">
            <span className="h-2 w-2 rounded-full" style={{ background: resolvedTheme.rawPrimaryColor }} />
            {resolvedTheme.brandName}
          </div>
        </header>

        <main className="-mx-7 flex flex-1 items-center overflow-hidden py-8">
          {contentItems.length > 0 && (
            <FeaturedContentCarousel
              items={contentItems}
              speed={carouselBlock?.speed}
              idioma={idioma}
            />
          )}
        </main>

        <div className="totem-idle-controls totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={onActivate}
            className="totem-idle-start touch-press animate-breathe"
            style={{ background: resolvedTheme.primaryColor, color: resolvedTheme.onPrimaryColor }}
          >
            {t.telaInicial.toqueComecar}
          </button>

          {hasLanguage ? (
            <div className="totem-idle-languages">
              {IDIOMAS.map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguage(lang)}
                  className={`totem-idle-language touch-press ${
                    idioma === lang ? 'border-white/40 bg-white/25 shadow-[0_0_24px_rgba(255,255,255,0.12)]' : 'border-white/12 bg-white/10'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-lg font-light opacity-60 lg:text-xl">{t.telaInicial.instrucao}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function FeaturedContentCarousel({ items, speed, idioma }: {
  items: TotemContentItem[]
  speed?: TotemCarouselSpeed
  idioma: Idioma
}) {
  const [viewportRef, viewportWidth] = useMeasuredWidth()

  if (items.length === 1) {
    return (
      <section className="flex w-full justify-center px-2">
        <FeaturedContentCard item={items[0]} idioma={idioma} />
      </section>
    )
  }

  const loopItems = [...items, ...items]

  return (
    <section className="w-full overflow-hidden" ref={viewportRef}>
      <div
        className="inline-flex w-max will-change-transform"
        style={{ animation: `totemContentMarquee ${getCarouselDuration(speed)}ms linear infinite` }}
      >
        {loopItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex shrink-0 justify-center px-2" style={{ width: viewportWidth || '100%' }}>
            <FeaturedContentCard item={item} idioma={idioma} />
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturedContentCard({ item, idioma }: {
  item: TotemContentItem
  idioma: Idioma
}) {
  const hasMedia = Boolean(item.mediaUrl)
  const backgroundColor = item.backgroundColor || '#1d342b'
  const text = getLocalizedContentText(item, idioma)

  return (
    <article
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
      {hasMedia && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.74))]" />}
      {!hasMedia && <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.18))]" />}
      <div className={`relative z-10 flex h-full min-h-[10.5rem] ${getTextPositionClass(item.textPosition)}`}>
        <p className="max-w-full break-words text-[1.48rem] font-semibold leading-[1.1] text-white [overflow-wrap:anywhere]">
          {text}
        </p>
      </div>
    </article>
  )
}

function ActionsDesign({ design, t, onNavigate, onBack }: {
  design: TotemDesign
  t: Record<string, any>
  onNavigate: (fluxo: 'checkin' | 'checkout') => void
  onBack: () => void
}) {
  const asset = getAttractAsset(design)
  const resolvedTheme = resolveTotemTheme(design.theme)
  const fontStack = getFontStack(resolvedTheme.fontFamily)
  const heroBlock = design.blocks.find(b => b.type === 'hero' && b.visible)
  const overlayOpacity = heroBlock?.overlay ?? 42

  return (
    <div
      className="relative isolate flex h-full w-full select-none flex-col overflow-hidden"
      style={idleThemeVars(resolvedTheme, fontStack)}
    >
      {asset?.type === 'video' && (
        <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      {asset && <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${Math.min(overlayOpacity + 14, 85) / 100})` }} />}

      <div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-14">
        <button
          onClick={onBack}
          className="totem-back-button self-start"
        >
          &larr; {t.geral.btnVoltar}
        </button>

        <div className="totem-choice-stage totem-block-enter">
          <div className="totem-choice-wrap">
            <div className="totem-choice-grid">
            <button
              onClick={() => onNavigate('checkin')}
              className="totem-choice-card touch-press"
              style={{ background: resolvedTheme.primaryColor, color: resolvedTheme.onPrimaryColor }}
            >
              <span className="totem-choice-card__label">{t.telaInicial.entradaLabel}</span>
              <span className="totem-choice-card__title">{formatChoiceTitle(t.telaInicial.checkinTitulo)}</span>
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="totem-choice-card touch-press"
              style={{
                background: hexToRgba(resolvedTheme.surfaceColor, 0.78),
                borderColor: hexToRgba(resolvedTheme.borderColor, 0.72),
                color: resolvedTheme.textColor,
              }}
            >
              <span className="totem-choice-card__label">{t.telaInicial.saidaLabel}</span>
              <span className="totem-choice-card__title">{formatChoiceTitle(t.telaInicial.checkoutTitulo)}</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttractFallback({ totemConfig, conteudo, idioma, t, onLanguage, onActivate }: {
  totemConfig: any
  conteudo: any[]
  idioma: Idioma
  t: Record<string, any>
  onLanguage: (lang: Idioma) => void
  onActivate: () => void
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-screen select-none flex-col overflow-hidden bg-[#101513] text-white">
      <div className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{ background: 'radial-gradient(ellipse at 20% 80%, #0f766e 0, transparent 50%), radial-gradient(ellipse at 80% 20%, #1a2e25 0, transparent 45%)' }}
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-between p-8 lg:p-14">
        <div className="flex flex-col items-center gap-4 mt-8 animate-fade-in lg:mt-16">
          {totemConfig?.config?.logoUrl && (
            <img src={totemConfig.config.logoUrl} alt="Logo" className="mb-4 h-16 object-contain" />
          )}
          <h1 className="text-5xl font-bold tracking-tight lg:text-7xl">
            {totemConfig?.config?.nomeExibido ?? 'CheckIn Hub'}
          </h1>
          <p className="text-lg font-light text-[#9eb2aa] lg:text-2xl">
            {t.telaInicial.boasVindas}
          </p>
        </div>

        <div className="totem-idle-controls flex flex-col items-center gap-6 totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <div className="h-1 w-24 animate-breathe rounded-full bg-[#d7fbe8]" />

          <button
            onClick={onActivate}
            className="totem-idle-start touch-press animate-breathe bg-[#0f766e] text-white"
          >
            {t.telaInicial.toqueComecar}
          </button>

          <div className="totem-idle-languages mt-2">
            {IDIOMAS.map(lang => (
              <button
                key={lang}
                onClick={() => onLanguage(lang)}
                className={`totem-idle-language touch-press ${
                  idioma === lang ? 'bg-white/30 shadow-[0_0_24px_rgba(255,255,255,0.12)]' : 'bg-white/10'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {conteudo.length > 0 && (
          <div className="w-full max-w-5xl mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {conteudo.map(item => (
                <div key={item.id} className="flex min-h-36 min-w-72 flex-col overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/8 backdrop-blur-md">
                  {item.tipo === 'VIDEO' ? (
                    <video src={item.urlMidia} className="h-24 w-full object-cover bg-slate-950" muted loop playsInline autoPlay />
                  ) : (
                    <img src={item.urlMidia} alt={item.titulo} className="h-24 w-full object-cover bg-slate-950" />
                  )}
                  <div className="flex flex-1 items-center justify-center p-4">
                    <span className="text-base font-medium text-slate-100">{item.titulo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionsFallback({ t, onNavigate, onBack }: {
  t: Record<string, any>
  onNavigate: (fluxo: 'checkin' | 'checkout') => void
  onBack: () => void
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-screen select-none flex-col overflow-hidden bg-[#101513] text-white">
      <div className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{ background: 'radial-gradient(ellipse at 20% 80%, #0f766e 0, transparent 50%), radial-gradient(ellipse at 80% 20%, #1a2e25 0, transparent 45%)' }}
      />
      <div className="absolute inset-0" style={{ background: 'rgba(0, 0, 0, 0.55)' }} />

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between p-8 lg:p-14">
        <button
          onClick={onBack}
          className="totem-back-button self-start"
        >
          &larr; {t.geral.btnVoltar}
        </button>

        <div className="totem-choice-stage">
          <div className="totem-choice-wrap">
            <div className="totem-choice-grid">
            <button
              onClick={() => onNavigate('checkin')}
              className="totem-choice-card touch-press bg-[#0f766e]"
            >
              <span className="totem-choice-card__label">{t.telaInicial.entradaLabel}</span>
              <span className="totem-choice-card__title">{formatChoiceTitle(t.telaInicial.checkinTitulo)}</span>
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="totem-choice-card touch-press border border-white/15 bg-white/8"
            >
              <span className="totem-choice-card__label">{t.telaInicial.saidaLabel}</span>
              <span className="totem-choice-card__title">{formatChoiceTitle(t.telaInicial.checkoutTitulo)}</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return `rgba(255, 255, 255, ${alpha})`
  const n = Number.parseInt(value, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function idleThemeVars(theme: ResolvedTotemTheme, fontStack: string): CSSProperties {
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
    background: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: fontStack,
  } as CSSProperties
}

function getVisibleContentItems(block: TotemBlock | undefined, idioma: Idioma): TotemContentItem[] {
  return Array.isArray(block?.contentItems)
    ? block.contentItems.filter(item => getLocalizedContentText(item, idioma).trim().length > 0)
    : []
}

function getLocalizedContentText(item: TotemContentItem, idioma: Idioma): string {
  return item.texts?.[idioma]?.trim() || item.text?.trim() || item.texts?.pt?.trim() || ''
}

function formatChoiceTitle(title: string): string {
  return title.replace(/-/g, ' ')
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
  const ref = useRef<HTMLElement | null>(null)
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

function getTextPositionClass(position?: TotemContentItem['textPosition']): string {
  if (position === 'top') return 'items-start'
  if (position === 'bottom') return 'items-end'
  return 'items-center'
}
