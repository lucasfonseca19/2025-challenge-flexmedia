import { useEffect, useState } from 'react'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import type { Totem, TotemDesign } from '../types'
import { totemDesignService, totemService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { nome: '', designId: '' }

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

export default function TotemPage() {
  const { usuario } = useAuth()
  const hotelId = usuario?.hotelId ?? 0
  const [totens, setTotens] = useState<Totem[]>([])
  const [designs, setDesigns] = useState<TotemDesign[]>([])
  const [carregando, setCarregando] = useState(true)
  const [offline, setOffline] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Totem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [salvando, setSalvando] = useState(false)
  const [erroFormulario, setErroFormulario] = useState<string | null>(null)
  const [removendoId, setRemovendoId] = useState<number | null>(null)
  const [codigoCriado, setCodigoCriado] = useState<string | null>(null)

  async function carregar() {
    if (!hotelId) {
      setCarregando(false)
      return
    }

    try {
      const [totensData, designsData] = await Promise.all([
        totemService.listar(hotelId),
        totemDesignService.listar(hotelId),
      ])
      setTotens(totensData)
      setDesigns(designsData)
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

  function abrirCriacao() {
    setEditando(null)
    setCodigoCriado(null)
    setErroFormulario(null)
    setForm(EMPTY_FORM)
    setModalAberto(true)
  }

  function abrirEdicao(totem: Totem) {
    setEditando(totem)
    setCodigoCriado(null)
    setErroFormulario(null)
    setForm({
      nome: totem.nome,
      designId: totem.designId ? String(totem.designId) : '',
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
    setCodigoCriado(null)
    setErroFormulario(null)
    setForm(EMPTY_FORM)
  }

  async function salvarTotem() {
    if (!form.nome.trim() || !hotelId) return

    setSalvando(true)
    setErroFormulario(null)
    const payload = {
      nome: form.nome.trim(),
      designId: form.designId ? Number(form.designId) : null,
    }

    try {
      if (editando) {
        await totemService.atualizar(editando.id, payload)
        fecharModal()
      } else {
        const novoTotem = await totemService.criar(hotelId, payload)
        setCodigoCriado(novoTotem.codigo)
        setForm(EMPTY_FORM)
      }
      await carregar()
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
      setErroFormulario(data?.detail ?? data?.message ?? 'Não foi possível salvar o totem.')
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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Totens</h2>
          <p className="mt-1 text-sm text-slate-400">Gerencie dispositivos, códigos de ativação, status de conexão e o preset visual atribuído a cada totem.</p>
        </div>
        <button
          onClick={abrirCriacao}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          + Novo totem
        </button>
      </div>

      {offline && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          Backend offline — não foi possível carregar os totens.
        </div>
      )}

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : !offline && (
        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-400">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">Código</th>
                  <th className="px-6 py-3 font-medium">Design atribuído</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Último heartbeat</th>
                  <th className="px-6 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {totens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Nenhum totem cadastrado.
                    </td>
                  </tr>
                )}
                {totens.map(totem => (
                  <tr key={totem.id} className="border-b border-slate-700/50 transition-colors hover:bg-slate-700/30">
                    <td className="px-6 py-4 font-medium">{totem.nome}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-lg bg-slate-700 px-3 py-1 font-mono text-lg tracking-widest">
                        {totem.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {totem.designName ?? <span className="text-slate-500">Fallback padrão</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        totem.online ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {totem.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{tempoRelativo(totem.ultimoHeartbeat)}</td>
                    <td className="px-6 py-4">
                      {removendoId === totem.id ? (
                        <div className="flex items-center gap-2">
                          <span className="whitespace-nowrap text-xs text-red-400">Remover?</span>
                          <button onClick={() => confirmarRemover(totem.id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-500">Sim</button>
                          <button onClick={() => setRemovendoId(null)} className="rounded bg-slate-600 px-2 py-1 text-xs text-white transition-colors hover:bg-slate-500">Não</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEdicao(totem)}
                            className="rounded bg-slate-700 p-1.5 text-white transition-colors hover:bg-slate-600"
                            title="Editar"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button
                            onClick={() => setRemovendoId(totem.id)}
                            className="rounded bg-slate-700 p-1.5 text-white transition-colors hover:bg-red-600"
                            title="Remover"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl md:p-8">
            <h3 className="mb-6 text-lg font-bold">{editando ? 'Editar totem' : 'Novo totem'}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Nome do dispositivo</label>
                <input
                  value={form.nome}
                  onChange={event => setForm(prev => ({ ...prev, nome: event.target.value }))}
                  placeholder="Ex: Totem do saguão"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-400">Design atribuído</label>
                <select
                  value={form.designId}
                  onChange={event => setForm(prev => ({ ...prev, designId: event.target.value }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Fallback padrão</option>
                  {designs.map(design => (
                    <option key={design.id} value={design.id}>{design.nome ?? `Design ${design.id}`}</option>
                  ))}
                </select>
                {designs.length === 0 && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">Crie presets no Totem Studio para atribuí-los a dispositivos.</p>
                )}
              </div>
            </div>

            {codigoCriado && (
              <div className="mt-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <p className="text-sm font-medium text-green-300">Totem criado. Use este código no setup:</p>
                <p className="mt-2 font-mono text-2xl tracking-widest text-white">{codigoCriado}</p>
              </div>
            )}

            {erroFormulario && <p className="mt-4 text-sm text-red-400">{erroFormulario}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={fecharModal}
                className="flex-1 rounded-lg bg-slate-700 py-2 text-sm text-white transition-colors hover:bg-slate-600"
              >
                {codigoCriado ? 'Fechar' : 'Cancelar'}
              </button>
              <button
                onClick={salvarTotem}
                disabled={salvando || !form.nome.trim()}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar totem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
