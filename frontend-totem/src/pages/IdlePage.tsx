import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'

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

  useEffect(() => {
    resetar()
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-between h-screen w-screen bg-slate-900 text-white p-6 lg:p-12 cursor-pointer select-none"
      onClick={() => navigate('/selecionar-idioma')}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-4 mt-8 lg:mt-16">
        {totemConfig?.config?.logoUrl && (
          <img src={totemConfig.config.logoUrl} alt="Logo" className="h-16 object-contain mb-4" />
        )}
        <h1 className="text-4xl lg:text-7xl font-bold tracking-tight text-white">
          {totemConfig?.config?.nomeExibido ?? 'CheckIn Hub'}
        </h1>
        <p className="text-lg lg:text-2xl text-slate-400">Bem-vindo · Welcome · Bienvenido</p>
      </div>

      {/* Instrução central */}
      <div className="flex flex-col items-center gap-6">
        <div className="w-32 h-1 bg-blue-500 rounded-full animate-pulse" />
        <p className="text-xl lg:text-3xl text-slate-300 font-light">Toque para iniciar · Touch to start · Toque para comenzar</p>
        <div className="flex gap-6 mt-6 text-3xl lg:text-5xl">
          <span>🇧🇷</span>
          <span>🇺🇸</span>
          <span>🇪🇸</span>
        </div>
      </div>

      {/* Promoções */}
      <div className="w-full max-w-4xl mb-8">
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
      </div>
    </div>
  )
}
