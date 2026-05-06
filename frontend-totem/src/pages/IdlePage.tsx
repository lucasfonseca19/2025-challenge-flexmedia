import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { totemDesignService } from '../services/api'
import type { TotemDesign } from '../types'
import TotemDesignRenderer from '../components/TotemDesignRenderer'

const PROMO_SLIDES = [
  {
    id: 1,
    pt: 'Restaurante aberto das 7h às 23h',
    en: 'Restaurant open from 7am to 11pm',
    es: 'Restaurante abierto de 7h a 23h',
  },
  {
    id: 2,
    pt: 'Piscina aquecida disponível para hóspedes',
    en: 'Heated pool available for guests',
    es: 'Piscina climatizada disponible para huéspedes',
  },
  {
    id: 3,
    pt: 'Wi-Fi gratuito em todos os ambientes',
    en: 'Free Wi-Fi throughout the hotel',
    es: 'Wi-Fi gratuito en todas las áreas',
  },
]

export default function IdlePage() {
  const navigate = useNavigate()
  const { resetar, totemConfig } = useTotem()
  const [design, setDesign] = useState<TotemDesign | null>(totemConfig?.design ?? null)
  const conteudo = [...(totemConfig?.conteudo ?? [])].sort((a, b) => a.ordemExibicao - b.ordemExibicao)

  useEffect(() => {
    resetar()
  }, [resetar])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hotelId = Number(params.get('hotelId') ?? totemConfig?.hotelId ?? localStorage.getItem('totem_hotel_id') ?? '')
    if (!hotelId) return

    localStorage.setItem('totem_hotel_id', String(hotelId))
    totemDesignService.buscarPublicado(hotelId)
      .then(data => setDesign(data))
      .catch(() => setDesign(null))
  }, [totemConfig?.hotelId])

  if (design) {
    return (
      <div onClick={() => navigate('/selecionar-idioma')}>
        <TotemDesignRenderer design={design} />
      </div>
    )
  }

  return (
    <div
      className="flex min-h-[100dvh] w-screen cursor-pointer select-none flex-col items-center justify-between bg-[#101513] p-6 text-white lg:p-12"
      onClick={() => navigate('/selecionar-idioma')}
    >
      <div className="flex flex-col items-center gap-4 mt-8 lg:mt-16">
        {totemConfig?.config?.logoUrl && (
          <img src={totemConfig.config.logoUrl} alt="Logo" className="h-16 object-contain mb-4" />
        )}
        <h1 className="text-4xl lg:text-7xl font-bold tracking-tight text-white">
          {totemConfig?.config?.nomeExibido ?? 'CheckIn Hub'}
        </h1>
        <p className="text-lg lg:text-2xl text-[#9eb2aa]">Bem-vindo · Welcome · Bienvenido</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="h-1 w-32 animate-pulse rounded-full bg-[#d7fbe8]" />
        <p className="text-xl font-light text-slate-300 lg:text-3xl">Toque para iniciar · Touch to start · Toque para comenzar</p>
        <div className="mt-6 flex gap-3 text-base lg:text-xl">
          <span className="rounded-2xl bg-white/10 px-5 py-3 font-semibold">PT</span>
          <span className="rounded-2xl bg-white/10 px-5 py-3 font-semibold">EN</span>
          <span className="rounded-2xl bg-white/10 px-5 py-3 font-semibold">ES</span>
        </div>
      </div>

      <div className="w-full max-w-4xl mb-8">
        {conteudo.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {conteudo.map(item => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-xl overflow-hidden text-center flex flex-col min-h-40"
              >
                {item.tipo === 'VIDEO' ? (
                  <video
                    src={item.urlMidia}
                    className="h-28 w-full object-cover bg-slate-950"
                    muted
                    loop
                    playsInline
                    autoPlay
                  />
                ) : (
                  <img
                    src={item.urlMidia}
                    alt={item.titulo}
                    className="h-28 w-full object-cover bg-slate-950"
                  />
                )}
                <div className="flex flex-1 items-center justify-center p-4">
                  <span className="text-slate-100 text-base font-medium">{item.titulo}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4">
            {PROMO_SLIDES.map(s => (
              <div
                key={s.id}
                className="flex-1 bg-slate-800 rounded-xl p-5 text-center flex flex-col gap-1"
              >
                <span className="text-slate-200 text-base font-medium">{s.pt}</span>
                <span className="text-slate-400 text-sm">{s.en}</span>
                <span className="text-slate-500 text-sm">{s.es}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
