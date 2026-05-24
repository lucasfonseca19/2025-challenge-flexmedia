import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { KioskButton, KioskShell } from '../components/KioskShell'

const TEMPO_RESET = 10

export default function ThankYouPage() {
  const navigate = useNavigate()
  const { t, resetar, fluxo } = useTotem()
  const [contador, setContador] = useState(TEMPO_RESET)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setContador(prev => {
        if (prev <= 1) {
          clearInterval(intervalo)
          resetar()
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalo)
  }, [])

  const isCheckin = fluxo === 'checkin'

  return (
    <KioskShell
      eyebrow={isCheckin ? 'Check-in concluído' : 'Check-out concluído'}
      title={t.obrigado.titulo}
      subtitle={t.obrigado.instrucao}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col items-start gap-8">
        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-green-300/30 bg-green-300/12 text-6xl text-green-100 md:h-36 md:w-36 md:text-7xl">
          ✓
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/14 bg-white/8">
            <span className="font-mono text-2xl font-bold md:text-3xl">{contador}</span>
          </div>
          <p className="text-lg opacity-65">{t.obrigado.voltando}</p>
        </div>

        <KioskButton
          onClick={() => { resetar(); navigate('/') }}
          variant="secondary"
        >
          {t.geral.btnVoltar}
        </KioskButton>
      </div>
    </KioskShell>
  )
}
