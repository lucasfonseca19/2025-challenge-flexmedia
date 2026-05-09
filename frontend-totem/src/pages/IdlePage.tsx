import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { totemDesignService } from '../services/api'
import type { Idioma, TotemDesign } from '../types'
import { useFontLoader, getFontStack } from '../hooks/useFontLoader'

const PROMO_SLIDES = [
  { id: 1, pt: 'Restaurante aberto das 7h as 23h', en: 'Restaurant open from 7am to 11pm', es: 'Restaurante abierto de 7h a 23h' },
  { id: 2, pt: 'Piscina aquecida disponivel para hospedes', en: 'Heated pool available for guests', es: 'Piscina climatizada disponible para huespedes' },
  { id: 3, pt: 'Wi-Fi gratuito em todos os ambientes', en: 'Free Wi-Fi throughout the hotel', es: 'Wi-Fi gratuito en todas las areas' },
]

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
  const [design, setDesign] = useState<TotemDesign | null>(totemConfig?.design ?? null)
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState<'attract' | 'actions'>('attract')
  const conteudo = [...(totemConfig?.conteudo ?? [])].sort((a, b) => a.ordemExibicao - b.ordemExibicao)

  useFontLoader(design?.theme.fontFamily ?? 'Satoshi')

  useEffect(() => { resetar() }, [resetar])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hotelId = Number(params.get('hotelId') ?? totemConfig?.hotelId ?? localStorage.getItem('totem_hotel_id') ?? '')
    if (!hotelId) return
    localStorage.setItem('totem_hotel_id', String(hotelId))
    totemDesignService.buscarPublicado(hotelId)
      .then(data => setDesign(data))
      .catch(() => setDesign(null))
  }, [totemConfig?.hotelId])

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
    return step === 'attract'
      ? <AttractDesign design={design} idioma={idioma} t={t} onLanguage={handleLanguage} onActivate={() => setStep('actions')} />
      : <ActionsDesign design={design} t={t} onNavigate={handleNavigate} onBack={() => setStep('attract')} />
  }

  if (ready) {
    return step === 'attract'
      ? <AttractFallback totemConfig={totemConfig} conteudo={conteudo} idioma={idioma} t={t} onLanguage={handleLanguage} onActivate={() => setStep('actions')} />
      : <ActionsFallback totemConfig={totemConfig} t={t} onNavigate={handleNavigate} onBack={() => setStep('attract')} />
  }

  return <div className="min-h-[100dvh] w-screen bg-[#101513]" />
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
  const overlayOpacity = heroBlock?.overlay ?? 42

  return (
    <div
      className="relative flex min-h-[100dvh] w-screen select-none flex-col overflow-hidden"
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

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between p-8 lg:p-14">
        <div className="animate-fade-in">
          {heroBlock && (
            <header>
              <p className="text-lg font-semibold uppercase tracking-[0.18em] opacity-70">
                {design.theme.brandName}
              </p>
              <h1 className="mt-3 text-6xl font-bold leading-[1.05] lg:text-7xl">
                {heroBlock.title}
              </h1>
              {heroBlock.subtitle && (
                <p className="mt-4 text-xl font-light opacity-80 lg:text-2xl">{heroBlock.subtitle}</p>
              )}
            </header>
          )}
          {!heroBlock && (
            <header>
              <p className="text-lg font-semibold uppercase tracking-[0.18em] opacity-70">
                {design.theme.brandName}
              </p>
              <h1 className="mt-3 text-5xl font-bold lg:text-6xl">{t.telaInicial.boasVindas}</h1>
            </header>
          )}
        </div>

        <div className="totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <div className="mx-auto mb-6 h-1 w-24 animate-breathe rounded-full" style={{ background: design.theme.primaryColor }} />

          <button
            onClick={onActivate}
            className="touch-press animate-breathe mx-auto block rounded-[1.75rem] px-10 py-5 text-2xl font-semibold"
            style={{ background: design.theme.primaryColor, color: '#ffffff' }}
          >
            {t.telaInicial.toqueComecar}
          </button>

          {hasLanguage ? (
            <div className="mt-8 flex justify-center gap-3">
              {IDIOMAS.map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguage(lang)}
                  className={`touch-press rounded-full border px-6 py-3 text-xl font-semibold uppercase text-white backdrop-blur-md transition-all ${
                    idioma === lang ? 'border-white/40 bg-white/25 shadow-[0_0_24px_rgba(255,255,255,0.12)]' : 'border-white/15 bg-white/10'
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
              <p className="text-lg font-semibold opacity-60">{block.title}</p>
              {block.subtitle && <p className="mt-1 text-sm opacity-50">{block.subtitle}</p>}
            </div>
          ))}
        </footer>
      </div>
    </div>
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
      className="relative flex min-h-[100dvh] w-screen select-none flex-col overflow-hidden"
      style={{ background: design.theme.backgroundColor, color: design.theme.textColor, fontFamily: fontStack }}
    >
      {asset?.type === 'video' && (
        <video src={asset.url} className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${Math.min(overlayOpacity + 14, 85) / 100})` }} />

      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between p-8 lg:p-14">
        <button
          onClick={onBack}
          className="self-start touch-press rounded-full border border-white/15 bg-white/10 px-6 py-3 text-lg font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/18"
        >
          &larr; {t.geral.btnVoltar}
        </button>

        <div className="totem-block-enter flex-1 flex flex-col items-center justify-center gap-8">
          <p className="text-center text-4xl font-bold lg:text-5xl">{t.telaInicial.boasVindas}</p>

          <div className="grid w-full max-w-3xl grid-cols-2 gap-6">
            <button
              onClick={() => onNavigate('checkin')}
              className="touch-press rounded-[1.4rem] px-7 py-8 text-left"
              style={{ background: design.theme.primaryColor, color: '#ffffff' }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-75">{t.telaInicial.entradaLabel}</p>
              <p className="mt-3 text-4xl font-bold">{t.telaInicial.btnCheckin}</p>
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="touch-press rounded-[1.4rem] border border-white/15 px-7 py-8 text-left"
              style={{ background: 'rgba(255,255,255,0.08)', color: design.theme.textColor }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-65">{t.telaInicial.saidaLabel}</p>
              <p className="mt-3 text-4xl font-bold">{t.telaInicial.btnCheckout}</p>
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

        <div className="w-full max-w-5xl mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {conteudo.length > 0 ? (
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
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {PROMO_SLIDES.map(s => (
                <div key={s.id} className="rounded-[1.15rem] border border-white/10 bg-white/8 p-5 text-center backdrop-blur-md">
                  <span className="text-base font-medium text-slate-200">{s[idioma]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
          className="self-start touch-press rounded-full border border-white/15 bg-white/10 px-6 py-3 text-lg font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/18"
        >
          &larr; {t.geral.btnVoltar}
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <h1 className="text-center text-4xl font-bold lg:text-5xl">
            {totemConfig?.config?.nomeExibido ?? 'CheckIn Hub'}
          </h1>

          <div className="grid w-full max-w-3xl grid-cols-2 gap-6">
            <button
              onClick={() => onNavigate('checkin')}
              className="touch-press rounded-[1.4rem] bg-[#0f766e] px-7 py-8 text-left"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-75">{t.telaInicial.entradaLabel}</p>
              <p className="mt-3 text-4xl font-bold">{t.telaInicial.btnCheckin}</p>
            </button>
            <button
              onClick={() => onNavigate('checkout')}
              className="touch-press rounded-[1.4rem] border border-white/15 bg-white/8 px-7 py-8 text-left"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-65">{t.telaInicial.saidaLabel}</p>
              <p className="mt-3 text-4xl font-bold">{t.telaInicial.btnCheckout}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
