import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Idioma, Reserva, TotemConfig } from '../types'
import { totemConfigService } from '../services/api'
import pt from '../locales/pt.json'
import en from '../locales/en.json'
import es from '../locales/es.json'

const traducoes = { pt, en, es }

interface TotemContextType {
  idioma: Idioma
  setIdioma: (idioma: Idioma) => void
  t: typeof pt
  reserva: Reserva | null
  setReserva: (reserva: Reserva | null) => void
  fluxo: 'checkin' | 'checkout' | null
  setFluxo: (fluxo: 'checkin' | 'checkout' | null) => void
  totemConfig: TotemConfig | null
  setTotemConfig: (config: TotemConfig | null) => void
  resetar: () => void
  sincronizarConfig: () => Promise<TotemConfig | null>
}

const TotemContext = createContext<TotemContextType | null>(null)

export function TotemProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>('pt')
  const [reserva, setReserva] = useState<Reserva | null>(null)
  const [fluxo, setFluxo] = useState<'checkin' | 'checkout' | null>(null)
  const [totemConfig, setTotemConfig] = useState<TotemConfig | null>(() => {
    const raw = localStorage.getItem('totem_config')
    return raw ? JSON.parse(raw) : null
  })

  const t = traducoes[idioma]

  function salvarConfig(config: TotemConfig | null) {
    if (config) localStorage.setItem('totem_config', JSON.stringify(config))
    else localStorage.removeItem('totem_config')
    setTotemConfig(config)
  }

  function resetar() {
    setReserva(null)
    setFluxo(null)
    setIdioma('pt')
  }

  const sincronizarConfig = useCallback(async (): Promise<TotemConfig | null> => {
    const codigo = totemConfig?.codigo
    if (!codigo) {
      salvarConfig(null)
      return null
    }
    try {
      const config = await totemConfigService.buscarPorCodigo(codigo)
      salvarConfig(config)
      return config
    } catch {
      salvarConfig(null)
      return null
    }
  }, [totemConfig?.codigo])

  return (
    <TotemContext.Provider
      value={{
        idioma,
        setIdioma,
        t,
        reserva,
        setReserva,
        fluxo,
        setFluxo,
        totemConfig,
        setTotemConfig: salvarConfig,
        resetar,
        sincronizarConfig,
      }}
    >
      {children}
    </TotemContext.Provider>
  )
}

export function useTotem(): TotemContextType {
  const ctx = useContext(TotemContext)
  if (!ctx) throw new Error('useTotem deve ser usado dentro de TotemProvider')
  return ctx
}
