import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import type { StatusReserva } from '../types'
import { KioskButton, KioskPanel, KioskShell } from '../components/KioskShell'

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
    <KioskShell
      eyebrow={fluxo === 'checkout' ? 'Conferência de saída' : 'Conferência de entrada'}
      title={t.confirmarDados.titulo}
      subtitle="Revise os dados antes de continuar."
      maxWidth="max-w-3xl"
    >
      <KioskPanel className="flex w-full flex-col gap-4 p-5 text-lg md:gap-5 md:p-8 md:text-2xl">
        <Row label={t.confirmarDados.nome} value={reserva.hospedeNome} />
        <Row label={t.confirmarDados.quarto} value={reserva.quartoNumero} />
        <Row label={t.confirmarDados.dataCheckin} value={reserva.dataCheckin} />
        <Row label={t.confirmarDados.dataCheckout} value={reserva.dataCheckout} />
      </KioskPanel>

      {mensagemBloqueio ? (
        <div className="mt-5 flex w-full flex-col gap-4 md:gap-6">
          <div className="flex w-full items-start gap-3 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-4 md:p-6">
            <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-amber-300" />
            <span className="text-base font-medium leading-relaxed text-amber-100 md:text-xl">{mensagemBloqueio}</span>
          </div>
          <KioskButton
            onClick={() => navigate(-1)}
            variant="secondary"
            className="w-full"
          >
            {t.confirmarDados.btnVoltar}
          </KioskButton>
        </div>
      ) : (
        <div className="mt-6 grid w-full gap-4 md:grid-cols-[0.75fr_1.25fr]">
          <KioskButton
            onClick={() => navigate(-1)}
            variant="secondary"
          >
            {t.confirmarDados.btnVoltar}
          </KioskButton>
          <KioskButton
            onClick={confirmar}
          >
            {t.confirmarDados.btnConfirmar}
          </KioskButton>
        </div>
      )}
    </KioskShell>
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
    <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <span className="opacity-60">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  )
}
