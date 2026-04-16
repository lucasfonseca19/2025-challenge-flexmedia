import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { checkinService, checkoutService } from '../services/api'

export default function SearchReservationPage() {
  const navigate = useNavigate()
  const { t, fluxo, setReserva } = useTotem()
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function buscar() {
    if (!codigo.trim()) return
    setCarregando(true)
    setErro('')
    try {
      const servico = fluxo === 'checkout'
        ? checkoutService.buscarReserva
        : checkinService.buscarReserva
      const reserva = await servico(codigo.trim())
      setReserva(reserva)
      navigate('/confirmar-dados')
    } catch {
      setErro(t.buscarReserva.erro)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-900 text-white gap-6 md:gap-10 px-6 md:px-16">
      <h2 className="text-3xl md:text-5xl font-bold">{t.buscarReserva.titulo}</h2>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        <input
          type="text"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          placeholder={t.buscarReserva.placeholder}
          className="w-full px-4 py-4 md:px-8 md:py-6 text-xl md:text-3xl bg-slate-800 border-2 border-slate-600 focus:border-blue-500 rounded-2xl outline-none text-white placeholder-slate-500"
          autoFocus
        />

        {erro && (
          <p className="text-red-400 text-xl text-center">{erro}</p>
        )}

        <button
          onClick={buscar}
          disabled={carregando || !codigo.trim()}
          className="w-full py-4 md:py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-lg md:text-2xl font-semibold rounded-2xl transition-colors active:scale-95"
        >
          {carregando ? t.geral.carregando : t.buscarReserva.btnBuscar}
        </button>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="text-slate-500 text-base md:text-xl hover:text-slate-300"
      >
        {t.geral.btnVoltar}
      </button>
    </div>
  )
}
