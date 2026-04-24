import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import type { StatusReserva } from '../types'

export default function ConfirmDataPage() {
  const navigate = useNavigate()
  const { t, reserva, fluxo } = useTotem()

  if (!reserva) {
    navigate('/')
    return null
  }

  const mensagemBloqueio = obterMensagemBloqueio(reserva.status, fluxo, t)

  function confirmar() {
    navigate(fluxo === 'checkout' ? '/checkout' : '/facial')
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-900 text-white gap-6 md:gap-10 px-6 md:px-16">
      <h2 className="text-3xl md:text-5xl font-bold">{t.confirmarDados.titulo}</h2>

      <div className="w-full max-w-2xl bg-slate-800 rounded-3xl p-6 md:p-10 flex flex-col gap-4 md:gap-6 text-lg md:text-2xl">
        <Row label={t.confirmarDados.nome} value={reserva.hospedeNome} />
        <Row label={t.confirmarDados.quarto} value={reserva.quartoNumero} />
        <Row label={t.confirmarDados.dataCheckin} value={reserva.dataCheckin} />
        <Row label={t.confirmarDados.dataCheckout} value={reserva.dataCheckout} />
      </div>

      {mensagemBloqueio ? (
        <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-2xl">
          <div className="w-full bg-amber-900/40 border border-amber-500 rounded-2xl p-4 md:p-6 flex items-start gap-3">
            <span className="text-amber-400 text-2xl flex-shrink-0">⚠️</span>
            <span className="text-amber-300 text-base md:text-xl font-medium leading-relaxed">{mensagemBloqueio}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 md:py-5 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl font-semibold rounded-2xl transition-colors active:scale-95"
          >
            {t.confirmarDados.btnVoltar}
          </button>
        </div>
      ) : (
        <div className="flex gap-6 w-full max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 md:py-5 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl font-semibold rounded-2xl transition-colors active:scale-95"
          >
            {t.confirmarDados.btnVoltar}
          </button>
          <button
            onClick={confirmar}
            className="flex-2 flex-grow py-3 md:py-5 bg-blue-600 hover:bg-blue-500 text-white text-base md:text-xl font-semibold rounded-2xl transition-colors active:scale-95"
          >
            {t.confirmarDados.btnConfirmar}
          </button>
        </div>
      )}
    </div>
  )
}

function obterMensagemBloqueio(
  status: StatusReserva,
  fluxo: 'checkin' | 'checkout' | null,
  t: ReturnType<typeof useTotem>['t']
): string | null {
  if (fluxo === 'checkin') {
    switch (status) {
      case 'CHECKIN_REALIZADO': return t.statusBloqueio.checkinJaRealizado
      case 'CHECKOUT_REALIZADO': return t.statusBloqueio.estadiaEncerrada
      case 'CANCELADA': return t.statusBloqueio.reservaCancelada
      default: return null // CONFIRMADA → permitido
    }
  }
  if (fluxo === 'checkout') {
    switch (status) {
      case 'CONFIRMADA': return t.statusBloqueio.checkinPendente
      case 'CHECKOUT_REALIZADO': return t.statusBloqueio.checkoutJaRealizado
      case 'CANCELADA': return t.statusBloqueio.reservaCancelada
      default: return null // CHECKIN_REALIZADO → permitido
    }
  }
  return null
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-700 pb-4">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
