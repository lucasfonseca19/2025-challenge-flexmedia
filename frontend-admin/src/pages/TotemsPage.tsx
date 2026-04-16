import { useEffect, useState } from 'react'
import type { Totem } from '../types'
import { totemService } from '../services/api'
import { useAuth } from '../context/AuthContext'

function tempoRelativo(iso: string | null): string {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const minutos = Math.floor(diff / 60000)
  if (minutos < 1) return 'Agora'
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `há ${horas} h`
  const dias = Math.floor(horas / 24)
  return `há ${dias} dia${dias !== 1 ? 's' : ''}`
}

export default function TotemsPage() {
  const { usuario } = useAuth()
  const hotelId = usuario?.hotelId ?? 0

  const [totens, setTotens] = useState<Totem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [offline, setOffline] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [removendoId, setRemovendoId] = useState<number | null>(null)
  const [apiKeyVisivel, setApiKeyVisivel] = useState<Record<number, boolean>>({})

  async function carregar() {
    if (!hotelId) return
    try {
      const data = await totemService.listar(hotelId)
      setTotens(data)
      setOffline(false)
    } catch {
      setOffline(true)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    const interval = setInterval(carregar, 30000)
    return () => clearInterval(interval)
  }, [hotelId])

  function toggleApiKey(id: number) {
    setApiKeyVisivel(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function criarTotem() {
    if (!novoNome.trim() || !hotelId) return
    setSalvando(true)
    try {
      await totemService.criar(hotelId, { nome: novoNome.trim() })
      setModalAberto(false)
      setNovoNome('')
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarRemover(id: number) {
    try {
      await totemService.remover(id)
      setRemovendoId(null)
      await carregar()
    } catch {
      setRemovendoId(null)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-2xl font-bold">Totens</h2>
        <button
          onClick={() => { setModalAberto(true); setNovoNome('') }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Novo totem
        </button>
      </div>

      {offline && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm mb-6">
          Backend offline — não foi possível carregar os totens.
        </div>
      )}

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : !offline && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">API Key</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Último heartbeat</th>
                  <th className="px-6 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {totens.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Nenhum totem cadastrado.
                    </td>
                  </tr>
                )}
                {totens.map(t => (
                  <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{t.nome}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-300">
                          {apiKeyVisivel[t.id] ? t.apiKey : '••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleApiKey(t.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors text-xs"
                          title={apiKeyVisivel[t.id] ? 'Ocultar' : 'Mostrar'}
                        >
                          {apiKeyVisivel[t.id] ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.online
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {t.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {tempoRelativo(t.ultimoHeartbeat)}
                    </td>
                    <td className="px-6 py-4">
                      {removendoId === t.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400 whitespace-nowrap">Remover?</span>
                          <button
                            onClick={() => confirmarRemover(t.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setRemovendoId(null)}
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemovendoId(t.id)}
                          className="p-1.5 bg-slate-700 hover:bg-red-600 text-white rounded transition-colors"
                          title="Remover"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Novo totem</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome do totem *</label>
              <input
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && criarTotem()}
                placeholder="Ex: Totem Lobby"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={criarTotem}
                disabled={salvando || !novoNome.trim()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {salvando ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
