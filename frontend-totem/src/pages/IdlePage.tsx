import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { totemDesignService } from '../services/api'
import type { TotemDesign } from '../types'
import { useFontLoader, getFontStack } from '../hooks/useFontLoader'

const PROMO_SLIDES = [
  { id: 1, pt: 'Restaurante aberto das 7h às 23h', en: 'Restaurant open from 7am to 11pm', es: 'Restaurante abierto de 7h a 23h' },
  { id: 2, pt: 'Piscina aquecida disponível para hóspedes', en: 'Heated pool available for guests', es: 'Piscina climatizada disponible para huéspedes' },
  { id: 3, pt: 'Wi-Fi gratuito em todos os ambientes', en: 'Free Wi-Fi throughout the hotel', es: 'Wi-Fi gratuito en todas las áreas' },
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

export default function IdlePage() {
  const navigate = useNavigate()
  const { resetar, totemConfig, setIdioma } = useTotem()
  const [design, setDesign] = useState<TotemDesign | null>(totemConfig?.design ?? null)
  const [ready, setReady] = useState(false)
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

  const handleNavigate = (path: string) => navigate(path)
  const handleLanguage = (lang: 'pt' | 'en' | 'es') => {
    setIdioma(lang)
    navigate('/buscar-reserva')
  }

  if (design && ready) {
    return <AttractDesign design={design} onNavigate={handleNavigate} onLanguage={handleLanguage} />
  }

  if (ready) {
    return <AttractFallback totemConfig={totemConfig} conteudo={conteudo} onNavigate={handleNavigate} />
  }

  return <div className="min-h-[100dvh] w-screen bg-[#101513]" />
}

function AttractDesign({ design, onNavigate, onLanguage }: {
  design: TotemDesign
  onNavigate: (path: string) => void
  onLanguage: (lang: 'pt' | 'en' | 'es') => void
}) {
  const asset = getAttractAsset(design)
  const fontStack = getFontStack(design.theme.fontFamily)

  return (
    <div
      className="relative flex min-h-[100dvh] w-screen select-none flex-col overflow-hidden"
      style={{ background: design.theme.backgroundColor, color: design.theme.textColor, fontFamily: fontStack }}
    >
      {asset?.type === 'video' && (
        <video
          src={asset.url}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay muted loop playsInline
        />
      )}
      {asset?.type === 'image' && (
        <img src={asset.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}

      <div
        className="absolute inset-0"
        style={{ background: `rgba(0, 0, 0, ${(asset ? 48 : 12) / 100})` }}
      />

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
          {design.blocks.filter(b => b.type === 'hero' && b.visible).map(block => (
            <header key={block.id}>
              <p className="text-lg font-semibold uppercase tracking-[0.18em] opacity-70">
                {design.theme.brandName}
              </p>
              <h1 className="mt-3 text-6xl font-bold leading-[1.05] lg:text-7xl">
                {block.title}
              </h1>
              {block.subtitle && (
                <p className="mt-4 text-xl font-light opacity-80 lg:text-2xl">{block.subtitle}</p>
              )}
            </header>
          ))}
          {!design.blocks.some(b => b.type === 'hero' && b.visible) && (
            <header>
              <p className="text-lg font-semibold uppercase tracking-[0.18em] opacity-70">
                {design.theme.brandName}
              </p>
              <h1 className="mt-3 text-5xl font-bold lg:text-6xl">Bem-vindo</h1>
            </header>
          )}
        </div>

        <div className="flex flex-col items-center gap-6 totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <div className="h-1 w-24 animate-breathe rounded-full" style={{ background: design.theme.primaryColor }} />

          {design.blocks.some(b => b.type === 'cta' && b.visible) ? (
            <div className="grid w-full max-w-xl grid-cols-2 gap-4">
              <button
                onClick={() => onNavigate('/selecionar-idioma?fluxo=checkin')}
                className="touch-press rounded-[1.75rem] px-7 py-6 text-center"
                style={{ background: design.theme.primaryColor, color: '#ffffff' }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-80">Check-in</p>
                <p className="mt-2 text-4xl font-bold">Check-in</p>
              </button>
              <button
                onClick={() => onNavigate('/selecionar-idioma?fluxo=checkout')}
                className="touch-press rounded-[1.75rem] px-7 py-6 text-center"
                style={{ background: design.theme.surfaceColor, color: design.theme.textColor }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] opacity-80">Check-out</p>
                <p className="mt-2 text-4xl font-bold">Check-out</p>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('/selecionar-idioma')}
              className="touch-press animate-breathe rounded-[1.75rem] px-10 py-5 text-2xl font-semibold"
              style={{ background: design.theme.primaryColor, color: '#ffffff' }}
            >
              Toque para começar
            </button>
          )}

          {design.blocks.some(b => b.type === 'language' && b.visible) ? (
            <div className="flex justify-center gap-3">
              {(['pt', 'en', 'es'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguage(lang)}
                  className="touch-press rounded-2xl px-6 py-3 text-xl font-semibold uppercase"
                  style={{ background: design.theme.surfaceColor, color: design.theme.textColor }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-lg font-light opacity-60 lg:text-xl">
              Toque para iniciar · Touch to start · Toque para comenzar
            </p>
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

function AttractFallback({ totemConfig, conteudo, onNavigate }: {
  totemConfig: any
  conteudo: any[]
  onNavigate: (path: string) => void
}) {
  return (
    <div
      className="relative flex min-h-[100dvh] w-screen cursor-pointer select-none flex-col overflow-hidden bg-[#101513] text-white"
      onClick={() => onNavigate('/selecionar-idioma')}
    >
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
            Bem-vindo · Welcome · Bienvenido
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 totem-block-enter" style={{ animationDelay: '0.2s' }}>
          <div className="h-1 w-24 animate-breathe rounded-full bg-[#d7fbe8]" />
          <p className="text-xl font-light text-slate-300 lg:text-3xl">
            Toque para iniciar · Touch to start · Toque para comenzar
          </p>
          <div className="mt-6 flex gap-3 text-base lg:text-xl">
            {['PT', 'EN', 'ES'].map(lang => (
              <span key={lang} className="rounded-2xl bg-white/10 px-5 py-3 font-semibold">{lang}</span>
            ))}
          </div>
        </div>

        <div className="w-full max-w-4xl mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {conteudo.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {conteudo.map(item => (
                <div key={item.id} className="flex min-h-40 flex-col overflow-hidden rounded-2xl bg-slate-800/80">
                  {item.tipo === 'VIDEO' ? (
                    <video src={item.urlMidia} className="h-28 w-full object-cover bg-slate-950" muted loop playsInline autoPlay />
                  ) : (
                    <img src={item.urlMidia} alt={item.titulo} className="h-28 w-full object-cover bg-slate-950" />
                  )}
                  <div className="flex flex-1 items-center justify-center p-4">
                    <span className="text-base font-medium text-slate-100">{item.titulo}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              {PROMO_SLIDES.map(s => (
                <div key={s.id} className="flex-1 rounded-2xl bg-slate-800/80 p-5 text-center">
                  <span className="text-base font-medium text-slate-200">{s.pt}</span>
                  <span className="mt-1 block text-sm text-slate-400">{s.en}</span>
                  <span className="block text-sm text-slate-500">{s.es}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
