import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import type { Idioma, TotemBlock, TotemCarouselSpeed, TotemContentItem, TotemDesign } from '../types'
import { useFontLoader, getFontStack } from '../hooks/useFontLoader'

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
      : <ActionsFallback totemConfig={totemConfig} t={t} onNavigate={handleNavigate} onBack={() => setStep('attract')} />
  }

  return <div className="min-h-[100dvh] w-screen bg-[#101513]" />
}

function RuntimeScreenFrame({ design, children }: {
  design: TotemDesign
  children: ReactNode
}) {
  const portrait = design.layout.screen !== 'landscape'
  const stageStyle = portrait
    ? { aspectRatio: '9 / 16', height: 'min(100dvh, 177.7778vw)' }
    : { aspectRatio: '16 / 9', width: 'min(100vw, 177.7778dvh)' }

  return (
    <div
      className="flex min-h-[100dvh] w-screen items-center justify-center overflow-hidden"
      style={{ background: design.theme.backgroundColor }}
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
  const fontStack = getFontStack(design.theme.fontFamily)
  const heroBlock = design.blocks.find(b => b.type === 'hero' && b.visible)
  const hasLanguage = design.blocks.some(b => b.type === 'language' && b.visible)
  const carouselBlock = design.blocks.find(b => b.type === 'carousel' && b.visible)
  const contentItems = useMemo(() => getVisibleContentItems(carouselBlock, idioma), [carouselBlock, idioma])
  const overlayOpacity = heroBlock?.overlay ?? 42

  return (
    <div
      className="relative isolate flex h-full w-full select-none flex-col overflow-hidden"
      style={{ background: design.theme.backgroundColor, color: design.theme.textColor, fontFamily: fontStack }}
    >
      {asset?.type === 'video' && (
        <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${overlayOpacity / 100})` }} />

      <div
        className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          background:
            `radial-gradient(ellipse at 20% 80%, ${design.theme.primaryColor} 0, transparent 50%), ` +
            `radial-gradient(ellipse at 80% 20%, ${design.theme.surfaceColor} 0, transparent 45%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-7">
        <header className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-82">
            <span className="h-2 w-2 rounded-full" style={{ background: design.theme.primaryColor }} />
            {design.theme.brandName}
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

        <div className="totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={onActivate}
            className="touch-press animate-breathe mx-auto mb-4 block rounded-[1.25rem] px-6 py-4 text-sm font-bold"
            style={{ background: design.theme.primaryColor, color: '#ffffff' }}
          >
            {t.telaInicial.toqueComecar}
          </button>

          {hasLanguage ? (
            <div className="flex justify-center gap-2">
              {IDIOMAS.map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguage(lang)}
                  className={`touch-press rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase text-white/85 backdrop-blur-md transition-all ${
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

        <footer className="animate-fade-in text-center" style={{ animationDelay: '0.4s' }}>
          {design.blocks.filter(b => b.type === 'footer' && b.visible).map(block => (
            <div key={block.id}>
              <p className="mt-4 text-xs font-medium text-white/58">{block.title}</p>
              {block.subtitle && <p className="mt-2 text-[11px] text-white/45">{block.subtitle}</p>}
            </div>
          ))}
        </footer>
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
  const fontStack = getFontStack(design.theme.fontFamily)
  const heroBlock = design.blocks.find(b => b.type === 'hero' && b.visible)
  const overlayOpacity = heroBlock?.overlay ?? 42

  return (
    <div
      className="relative isolate flex h-full w-full select-none flex-col overflow-hidden"
      style={{ background: design.theme.backgroundColor, color: design.theme.textColor, fontFamily: fontStack }}
    >
      {asset?.type === 'video' && (
        <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${Math.min(overlayOpacity + 14, 85) / 100})` }} />

      <div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-14">
        <button
          onClick={onBack}
          className="self-start touch-press rounded-full border border-white/15 bg-white/10 px-5 py-3 text-base font-semibold text-white/86 backdrop-blur-md transition-colors hover:bg-white/18"
        >
          &larr; {t.geral.btnVoltar}
        </button>

        <div className="totem-block-enter flex flex-1 flex-col items-center justify-center gap-10">
          <div className="max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">{design.theme.brandName}</p>
            <h1 className="mt-4 text-5xl font-bold leading-[0.95] text-white lg:text-7xl">{t.telaInicial.tituloEscolha}</h1>
          </div>

          <div className="grid w-full max-w-4xl grid-cols-2 gap-5 lg:gap-7">
            <button
              onClick={() => onNavigate('checkin')}
              className="touch-press relative min-h-64 overflow-hidden rounded-[1.75rem] px-8 py-9 text-left shadow-[0_28px_80px_rgba(0,0,0,0.24)]"
              style={{ background: design.theme.primaryColor, color: '#ffffff' }}
            >
              <span className="absolute right-8 top-8 h-14 w-14 rounded-full border border-white/22" />
              <span className="absolute right-12 top-12 h-6 w-6 rounded-full bg-white/85" />
              <span className="text-sm font-bold uppercase tracking-[0.16em] opacity-72">{t.telaInicial.entradaLabel}</span>
              <span className="mt-20 block text-5xl font-bold leading-none lg:text-6xl">{t.telaInicial.checkinTitulo}</span>
              <span className="mt-5 block text-xl font-medium leading-snug text-white/72">{t.telaInicial.checkinDescricao}</span>
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="touch-press relative min-h-64 overflow-hidden rounded-[1.75rem] border px-8 py-9 text-left shadow-[0_22px_60px_rgba(0,0,0,0.16)]"
              style={{
                background: hexToRgba(design.theme.surfaceColor, 0.78),
                borderColor: hexToRgba(design.theme.textColor, 0.12),
                color: '#ffffff',
              }}
            >
              <span className="absolute right-8 top-8 h-14 w-14 rounded-full border border-white/18" />
              <span className="absolute right-12 top-12 h-6 w-6 rounded-full bg-white/56" />
              <span className="text-sm font-bold uppercase tracking-[0.16em] opacity-62">{t.telaInicial.saidaLabel}</span>
              <span className="mt-20 block text-5xl font-bold leading-none lg:text-6xl">{t.telaInicial.checkoutTitulo}</span>
              <span className="mt-5 block text-xl font-medium leading-snug text-white/58">{t.telaInicial.checkoutDescricao}</span>
            </button>
          </div>
        </div>

        <footer className="text-center animate-fade-in">
          {design.blocks.filter(b => b.type === 'footer' && b.visible).map(block => (
            <div key={block.id}>
              <p className="text-lg font-semibold opacity-60">{block.title}</p>
              {block.subtitle && <p className="mt-1 text-sm opacity-50">{block.subtitle}</p>}
            </div>
          ))}
        </footer>
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

        <div className="flex flex-col items-center gap-6 totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <div className="h-1 w-24 animate-breathe rounded-full bg-[#d7fbe8]" />

          <button
            onClick={onActivate}
            className="touch-press animate-breathe rounded-[1.75rem] bg-[#0f766e] px-10 py-5 text-2xl font-semibold text-white"
          >
            {t.telaInicial.toqueComecar}
          </button>

          <div className="mt-6 flex gap-3 text-base lg:text-xl">
            {IDIOMAS.map(lang => (
              <button
                key={lang}
                onClick={() => onLanguage(lang)}
                className={`touch-press rounded-2xl px-5 py-3 font-semibold backdrop-blur-md transition-all ${
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

function ActionsFallback({ totemConfig, t, onNavigate, onBack }: {
  totemConfig: any
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
          className="self-start touch-press rounded-full border border-white/15 bg-white/10 px-5 py-3 text-base font-semibold text-white/86 backdrop-blur-md transition-colors hover:bg-white/18"
        >
          &larr; {t.geral.btnVoltar}
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-10">
          <div className="max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">
              {totemConfig?.config?.nomeExibido ?? 'CheckIn Hub'}
            </p>
            <h1 className="mt-4 text-5xl font-bold leading-[0.95] text-white lg:text-7xl">{t.telaInicial.tituloEscolha}</h1>
          </div>

          <div className="grid w-full max-w-4xl grid-cols-2 gap-5 lg:gap-7">
            <button
              onClick={() => onNavigate('checkin')}
              className="touch-press relative min-h-64 overflow-hidden rounded-[1.75rem] bg-[#0f766e] px-8 py-9 text-left shadow-[0_28px_80px_rgba(0,0,0,0.24)]"
            >
              <span className="absolute right-8 top-8 h-14 w-14 rounded-full border border-white/22" />
              <span className="absolute right-12 top-12 h-6 w-6 rounded-full bg-white/85" />
              <span className="text-sm font-bold uppercase tracking-[0.16em] opacity-72">{t.telaInicial.entradaLabel}</span>
              <span className="mt-20 block text-5xl font-bold leading-none lg:text-6xl">{t.telaInicial.checkinTitulo}</span>
              <span className="mt-5 block text-xl font-medium leading-snug text-white/72">{t.telaInicial.checkinDescricao}</span>
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="touch-press relative min-h-64 overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/8 px-8 py-9 text-left shadow-[0_22px_60px_rgba(0,0,0,0.16)]"
            >
              <span className="absolute right-8 top-8 h-14 w-14 rounded-full border border-white/18" />
              <span className="absolute right-12 top-12 h-6 w-6 rounded-full bg-white/56" />
              <span className="text-sm font-bold uppercase tracking-[0.16em] opacity-62">{t.telaInicial.saidaLabel}</span>
              <span className="mt-20 block text-5xl font-bold leading-none lg:text-6xl">{t.telaInicial.checkoutTitulo}</span>
              <span className="mt-5 block text-xl font-medium leading-snug text-white/58">{t.telaInicial.checkoutDescricao}</span>
            </button>
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

function getVisibleContentItems(block: TotemBlock | undefined, idioma: Idioma): TotemContentItem[] {
  return Array.isArray(block?.contentItems)
    ? block.contentItems.filter(item => getLocalizedContentText(item, idioma).trim().length > 0)
    : []
}

function getLocalizedContentText(item: TotemContentItem, idioma: Idioma): string {
  return item.texts?.[idioma]?.trim() || item.text?.trim() || item.texts?.pt?.trim() || ''
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
