import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTotem } from '../context/TotemContext'
import { totemConfigService } from '../services/api'
import { KioskButton, KioskInput, KioskShell } from '../components/KioskShell'

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
    <KioskShell
      eyebrow="Ativação"
      title="Configuração do Totem"
      subtitle="Digite o código fornecido pelo administrador para vincular este equipamento ao hotel."
      maxWidth="max-w-xl"
    >
      <div className="flex w-full flex-col gap-4">
        <KioskInput
          type="text"
          value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && associar()}
          placeholder="Ex: LOBBY1"
          maxLength={10}
          className="text-center font-mono uppercase tracking-widest"
          autoFocus
        />
        {erro && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center text-red-100">{erro}</p>}
        <KioskButton
          onClick={associar}
          disabled={carregando || !codigo.trim()}
          className="w-full"
        >
          {carregando ? 'Verificando...' : 'Associar Totem'}
        </KioskButton>
      </div>
    </KioskShell>
  )
}
