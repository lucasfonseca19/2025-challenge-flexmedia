import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { checkoutService } from '../services/api'

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
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-900 text-white gap-6 md:gap-8">
      <h2 className="text-3xl md:text-5xl font-bold">{t.checkout.titulo}</h2>

      {step === 'resumo' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg px-6">
          {/* Card resumo */}
          <div className="bg-slate-800 rounded-3xl p-5 md:p-8 w-full space-y-4 shadow-xl">
            <div className="flex justify-between text-xl">
              <span className="text-slate-400">{t.confirmarDados.nome}</span>
              <span className="font-semibold">{reserva.hospedeNome}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="text-slate-400">{t.confirmarDados.quarto}</span>
              <span className="font-semibold">{reserva.quartoNumero}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="text-slate-400">{t.confirmarDados.dataCheckin}</span>
              <span className="font-semibold">{formatarData(reserva.dataCheckin)}</span>
            </div>
            <div className="flex justify-between text-xl">
              <span className="text-slate-400">{t.confirmarDados.dataCheckout}</span>
              <span className="font-semibold">{formatarData(reserva.dataCheckout)}</span>
            </div>
            {/* total field not in MVP type — omit */}
          </div>

          <p className="text-base md:text-xl text-slate-300 text-center">{t.checkout.instrucao}</p>

          <div className="flex gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 md:px-10 md:py-4 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl rounded-2xl transition-colors active:scale-95"
            >
              {t.geral.btnVoltar}
            </button>
            <button
              onClick={confirmarCheckout}
              className="px-6 py-3 md:px-10 md:py-4 bg-blue-600 hover:bg-blue-500 text-white text-base md:text-xl font-semibold rounded-2xl transition-colors active:scale-95"
            >
              {t.checkout.btnConfirmar}
            </button>
          </div>
        </div>
      )}

      {step === 'processando' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-2xl text-slate-400">{t.geral.carregando}</p>
        </div>
      )}

      {step === 'sucesso' && (
        <div className="flex flex-col items-center gap-4">
          <span className="text-8xl">✓</span>
          <p className="text-xl md:text-3xl font-semibold text-green-400">{t.checkout.sucesso}</p>
        </div>
      )}

      {step === 'erro' && (
        <div className="flex flex-col items-center gap-6">
          <span className="text-8xl">❌</span>
          <p className="text-lg md:text-2xl text-red-400 text-center px-6 md:px-16">{erroMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 md:px-12 md:py-4 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl rounded-2xl"
          >
            {t.geral.btnVoltar}
          </button>
        </div>
      )}
    </div>
  )
}
