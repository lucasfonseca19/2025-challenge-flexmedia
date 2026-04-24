import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { chavesService } from '../services/api'

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
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-900 text-white gap-8">
<h2 className="text-3xl md:text-5xl font-bold text-center">{t.emitirChave.titulo}</h2>

      {emitindo && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg md:text-2xl text-slate-400">{t.geral.carregando}</p>
        </div>
      )}

      {!emitindo && chave && (
        <div className="flex flex-col items-center gap-6">
          {/* Placeholder de QR Code */}
          <div className="bg-white p-6 rounded-3xl shadow-2xl">
            <div className="w-36 h-36 md:w-48 md:h-48 bg-slate-800 grid grid-cols-8 grid-rows-8 gap-0.5 p-2 rounded">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-slate-900'}`}
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl text-slate-400">Token</p>
            <p className="text-2xl md:text-4xl font-mono font-bold tracking-widest mt-1">{chave.token}</p>
            <p className="text-lg text-slate-500 mt-1">{t.emitirChave.quarto}: {reserva?.quartoNumero}</p>
            <p className="text-lg text-slate-500 mt-1">Tipo: {chave.tipo}</p>
          </div>
          <p className="text-base md:text-xl text-slate-300 text-center px-6 md:px-16">{t.emitirChave.instrucao}</p>
          <button
            onClick={concluir}
            className="mt-4 px-8 py-4 md:px-16 md:py-5 bg-green-600 hover:bg-green-500 text-white text-lg md:text-2xl font-semibold rounded-2xl transition-colors active:scale-95"
          >
            {t.emitirChave.btnConcluir}
          </button>
        </div>
      )}

      {!emitindo && erro && (
        <div className="flex flex-col items-center gap-6">
          <span className="text-8xl">❌</span>
          <p className="text-lg md:text-2xl text-red-400 text-center px-6 md:px-16">{erro}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 md:px-12 md:py-4 bg-slate-700 hover:bg-slate-600 text-white text-base md:text-xl rounded-2xl transition-colors"
          >
            {t.geral.btnVoltar}
          </button>
        </div>
      )}
    </div>
  )
}
