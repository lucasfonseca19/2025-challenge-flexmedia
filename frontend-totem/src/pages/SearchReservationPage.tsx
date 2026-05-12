import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { checkinService, checkoutService } from '../services/api'
import { KioskButton, KioskInput, KioskShell } from '../components/KioskShell'

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
    <KioskShell
      eyebrow={fluxo === 'checkout' ? 'Check-out' : 'Check-in'}
      title={t.buscarReserva.titulo}
      subtitle={fluxo === 'checkout' ? 'Localize sua estadia para confirmar a saída.' : 'Informe o código da reserva ou CPF para iniciar o atendimento.'}
      maxWidth="max-w-3xl"
    >
      <div className="flex w-full flex-col gap-5">
        <KioskInput
          type="text"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          placeholder={t.buscarReserva.placeholder}
          autoFocus
        />

        {erro && (
          <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center text-lg font-semibold text-red-200">{erro}</p>
        )}

        <KioskButton
          onClick={buscar}
          disabled={carregando || !codigo.trim()}
          className="w-full"
        >
          {carregando ? t.geral.carregando : t.buscarReserva.btnBuscar}
        </KioskButton>
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-8 text-base font-semibold opacity-55 transition-opacity hover:opacity-85 md:text-xl"
      >
        {t.geral.btnVoltar}
      </button>
    </KioskShell>
  )
}
