import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { totemConfigService } from '../services/api'

export default function SetupPage() {
  const [codigo, setCodigo] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { setTotemConfig } = useTotem()
  const navigate = useNavigate()

  async function associar() {
    if (!codigo.trim()) return

    setCarregando(true)
    setErro(null)

    try {
      const config = await totemConfigService.buscarPorCodigo(codigo.trim())
      setTotemConfig(config)
      navigate('/')
    } catch {
      setErro('Código não encontrado. Verifique e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-screen bg-slate-900 text-white gap-8">
      <h1 className="text-4xl font-bold">Configuração do Totem</h1>
      <p className="text-slate-400 text-lg">Digite o código fornecido pelo administrador</p>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="text"
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && associar()}
          placeholder="Ex: LOBBY1"
          maxLength={10}
          className="w-full px-6 py-5 text-3xl text-center font-mono tracking-widest bg-slate-800 border-2 border-slate-600 focus:border-blue-500 rounded-2xl outline-none uppercase"
          autoFocus
        />
        {erro && <p className="text-red-400 text-center">{erro}</p>}
        <button
          onClick={associar}
          disabled={carregando || !codigo.trim()}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xl font-semibold rounded-2xl transition-colors"
        >
          {carregando ? 'Verificando...' : 'Associar Totem'}
        </button>
      </div>
    </div>
  )
}
