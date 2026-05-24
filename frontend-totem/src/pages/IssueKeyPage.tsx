import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { chavesService } from '../services/api'
import { KioskButton, KioskPanel, KioskShell } from '../components/KioskShell'

export default function IssueKeyPage() {
  const navigate = useNavigate()
  const { t, reserva } = useTotem()
  const [chave, setChave] = useState<{ token: string; tipo: string } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [emitindo, setEmitindo] = useState(true)

  useEffect(() => {
    async function emitirChave() {
      if (!reserva?.id) {
        navigate('/')
        return
      }
      try {
        const resultado = await chavesService.emitir(reserva.id)
        setChave({ token: resultado.token, tipo: resultado.tipo })
      } catch {
        setErro(t.geral.erro)
      } finally {
        setEmitindo(false)
      }
    }
    emitirChave()
  }, [])

  function concluir() {
    navigate('/obrigado')
  }

  return (
    <KioskShell
      eyebrow="Chave digital"
      title={t.emitirChave.titulo}
      subtitle={emitindo ? t.geral.carregando : t.emitirChave.instrucao}
      maxWidth="max-w-3xl"
    >
      {emitindo && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-[var(--kiosk-primary)]" />
          <p className="text-lg opacity-70 md:text-2xl">{t.geral.carregando}</p>
        </div>
      )}

      {!emitindo && chave && (
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="rounded-[1.35rem] bg-white p-5 shadow-[0_28px_80px_-50px_rgba(0,0,0,0.9)]">
            <div className="grid h-40 w-40 grid-cols-8 grid-rows-8 gap-0.5 rounded bg-slate-950 p-2 md:h-52 md:w-52">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${((i * 7) + chave.token.charCodeAt(i % chave.token.length)) % 3 === 0 ? 'bg-white' : 'bg-slate-950'}`}
                />
              ))}
            </div>
          </div>
          <KioskPanel className="p-5 md:p-8">
            <p className="text-sm font-bold uppercase opacity-55">Token</p>
            <p className="mt-3 break-all font-mono text-2xl font-bold tracking-widest md:text-4xl">{chave.token}</p>
            <div className="mt-6 grid gap-2 text-lg opacity-70">
              <p>{t.emitirChave.quarto}: {reserva?.quartoNumero}</p>
              <p>Tipo: {chave.tipo}</p>
            </div>
          </KioskPanel>
          <KioskButton
            onClick={concluir}
            className="md:col-span-2"
          >
            {t.emitirChave.btnConcluir}
          </KioskButton>
        </div>
      )}

      {!emitindo && erro && (
        <div className="flex flex-col items-center gap-6">
          <span className="flex h-28 w-28 items-center justify-center rounded-full border border-red-300/30 bg-red-300/12 text-6xl text-red-100">!</span>
          <p className="text-center text-lg text-red-100 md:text-2xl">{erro}</p>
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
