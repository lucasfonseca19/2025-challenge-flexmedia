import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { checkoutService } from '../services/api'
import { KioskButton, KioskPanel, KioskShell } from '../components/KioskShell'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { t, reserva } = useTotem()
  const [step, setStep] = useState<'resumo' | 'processando' | 'sucesso' | 'erro'>('resumo')
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  if (!reserva) {
    navigate('/')
    return null
  }

  async function confirmarCheckout() {
    if (!reserva?.id) return
    setStep('processando')
    try {
      await checkoutService.confirmar(reserva.id)
      setStep('sucesso')
      setTimeout(() => navigate('/obrigado'), 2000)
    } catch {
      setErroMsg(t.geral.erro)
      setStep('erro')
    }
  }

  const formatarData = (iso: string) => {
    const [ano, mes, dia] = iso.split('-')
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).toLocaleDateString(
      'pt-BR',
      { day: '2-digit', month: 'long', year: 'numeric' }
    )
  }

  return (
    <KioskShell
      eyebrow="Check-out"
      title={t.checkout.titulo}
      subtitle={step === 'resumo' ? t.checkout.instrucao : undefined}
      maxWidth="max-w-3xl"
    >
      {step === 'resumo' && (
        <div className="flex w-full flex-col gap-6">
          <KioskPanel className="w-full space-y-4 p-5 md:p-8">
            <div className="flex justify-between text-xl">
              <span className="opacity-60">{t.confirmarDados.nome}</span>
              <span className="font-semibold">{reserva.hospedeNome}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="opacity-60">{t.confirmarDados.quarto}</span>
              <span className="font-semibold">{reserva.quartoNumero}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="opacity-60">{t.confirmarDados.dataCheckin}</span>
              <span className="font-semibold">{formatarData(reserva.dataCheckin)}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="opacity-60">{t.confirmarDados.dataCheckout}</span>
              <span className="font-semibold">{formatarData(reserva.dataCheckout)}</span>
            </div>
          </KioskPanel>

          <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
            <KioskButton
              onClick={() => navigate(-1)}
              variant="secondary"
            >
              {t.geral.btnVoltar}
            </KioskButton>
            <KioskButton
              onClick={confirmarCheckout}
            >
              {t.checkout.btnConfirmar}
            </KioskButton>
          </div>
        </div>
      )}

      {step === 'processando' && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[var(--kiosk-primary)]" />
          <p className="text-2xl opacity-70">{t.geral.carregando}</p>
        </div>
      )}

      {step === 'sucesso' && (
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-28 w-28 items-center justify-center rounded-full border border-green-300/30 bg-green-300/12 text-7xl text-green-200">✓</span>
          <p className="text-xl font-semibold text-green-100 md:text-3xl">{t.checkout.sucesso}</p>
        </div>
      )}

      {step === 'erro' && (
        <div className="flex flex-col items-center gap-6">
          <span className="flex h-28 w-28 items-center justify-center rounded-full border border-red-300/30 bg-red-300/12 text-6xl text-red-100">!</span>
          <p className="text-center text-lg text-red-100 md:text-2xl">{erroMsg}</p>
          <KioskButton
            onClick={() => navigate('/')}
            variant="secondary"
          >
            {t.geral.btnVoltar}
          </KioskButton>
        </div>
      )}
    </KioskShell>
  )
}
