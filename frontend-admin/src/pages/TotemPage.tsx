import { useEffect, useState } from 'react'
import type { ConteudoTotem, HotelConfig, Totem } from '../types'
import { configService, conteudoService, totemService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const abas = ['Dispositivos', 'Conteúdo', 'Aparência'] as const
type Aba = typeof abas[number]

const TIPO_LABEL = { SLIDE: 'Slide', BANNER: 'Banner', VIDEO: 'Vídeo' } as const

const DEFAULT_CONFIG_FORM = {
  nomeExibido: '',
  logoUrl: '',
  corPrimaria: '#1e40af',
  idiomasAtivos: 'pt,en',
}

const EMPTY_CONTEUDO_FORM = (hotelId: number): Partial<ConteudoTotem> => ({
  tipo: 'SLIDE',
  titulo: '',
  urlMidia: '',
  ordemExibicao: 1,
  ativo: true,
  hotelId,
})

const IDIOMA_LABEL: Record<string, string> = { pt: 'PT-BR', en: 'EN', es: 'ES' }

const MOCK_CONTEUDO: ConteudoTotem[] = [
  { id: 1, hotelId: 1, tipo: 'SLIDE', titulo: 'Bem-vindo ao Grand Palace', urlMidia: 'https://placehold.co/400x200/1e40af/white?text=Slide+1', ordemExibicao: 1, ativo: true },
  { id: 2, hotelId: 1, tipo: 'BANNER', titulo: 'Restaurante aberto até 23h', urlMidia: 'https://placehold.co/400x200/065f46/white?text=Banner+1', ordemExibicao: 2, ativo: true },
  { id: 3, hotelId: 1, tipo: 'VIDEO', titulo: 'Tour pelo hotel', urlMidia: '', ordemExibicao: 3, ativo: false },
]

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

function csvToIdiomas(csv: string): { pt: boolean; en: boolean; es: boolean } {
  const parts = csv.split(',').map(s => s.trim())
  return { pt: parts.includes('pt'), en: parts.includes('en'), es: parts.includes('es') }
}

function idiomasToCsv(idiomas: { pt: boolean; en: boolean; es: boolean }): string {
  return (['pt', 'en', 'es'] as const).filter(k => idiomas[k]).join(',')
}

function DispositivosTab({ hotelId }: { hotelId: number }) {
  const [totens, setTotens] = useState<Totem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [offline, setOffline] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroCriacao, setErroCriacao] = useState<string | null>(null)
  const [removendoId, setRemovendoId] = useState<number | null>(null)
  const [codigoCriado, setCodigoCriado] = useState<string | null>(null)

  async function carregar() {
    if (!hotelId) {
      setCarregando(false)
      return
    }

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

  function abrirModalCriacao() {
    setNovoNome('')
    setCodigoCriado(null)
    setErroCriacao(null)
    setModalAberto(true)
  }

  function fecharModalCriacao() {
    setModalAberto(false)
    setNovoNome('')
    setCodigoCriado(null)
    setErroCriacao(null)
  }

  async function criarTotem() {
    if (!novoNome.trim() || !hotelId) return

    setSalvando(true)
    setErroCriacao(null)
    try {
      const novoTotem = await totemService.criar(hotelId, { nome: novoNome.trim() })
      setCodigoCriado(novoTotem.codigo)
      setNovoNome('')
      await carregar()
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
      setErroCriacao(data?.detail ?? data?.message ?? 'Não foi possível criar o totem.')
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
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Dispositivos cadastrados</h3>
          <p className="text-sm text-slate-400 mt-1">Gerencie os totens do hotel e acompanhe o status de conexão.</p>
        </div>
        <button
          onClick={abrirModalCriacao}
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
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">Código</th>
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
                {totens.map(totem => (
                  <tr key={totem.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{totem.nome}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-lg bg-slate-700 px-3 py-1 rounded-lg tracking-widest inline-block">
                        {totem.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        totem.online
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {totem.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {tempoRelativo(totem.ultimoHeartbeat)}
                    </td>
                    <td className="px-6 py-4">
                      {removendoId === totem.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400 whitespace-nowrap">Remover?</span>
                          <button
                            onClick={() => confirmarRemover(totem.id)}
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
                          onClick={() => setRemovendoId(totem.id)}
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

            {codigoCriado ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">Totem criado com sucesso.</p>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Anote este código</p>
                  <span className="font-mono text-2xl bg-slate-700 px-4 py-2 rounded-lg tracking-[0.35em] inline-block">
                    {codigoCriado}
                  </span>
                </div>
                <button
                  onClick={fecharModalCriacao}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <>
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
                {erroCriacao && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {erroCriacao}
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={fecharModalCriacao}
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
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ConteudoTab({ hotelId }: { hotelId: number }) {
  const [itens, setItens] = useState<ConteudoTotem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<Partial<ConteudoTotem>>(EMPTY_CONTEUDO_FORM(hotelId))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    if (!hotelId) {
      setCarregando(false)
      return
    }

    setCarregando(true)
    try {
      const data = await conteudoService.listar(hotelId)
      setItens(data)
    } catch {
      setItens(MOCK_CONTEUDO.map(item => ({ ...item, hotelId })))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [hotelId])

  function abrirNovo() {
    setForm(EMPTY_CONTEUDO_FORM(hotelId))
    setErro(null)
    setModalAberto(true)
  }

  function abrirEditar(item: ConteudoTotem) {
    setForm({ ...item })
    setErro(null)
    setModalAberto(true)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    try {
      if (form.id) {
        await conteudoService.atualizar(form.id, form)
      } else {
        await conteudoService.criar({ ...form, hotelId })
      }
      setModalAberto(false)
      await carregar()
    } catch {
      setErro('Erro ao salvar conteúdo.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: number) {
    if (!confirm('Remover este conteúdo?')) return
    try {
      await conteudoService.remover(id)
      await carregar()
    } catch {
      // ignora em dev
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Conteúdo exibido no totem</h3>
          <p className="text-sm text-slate-400 mt-1">Organize slides, banners e vídeos do hotel em um só lugar.</p>
        </div>
        <button
          onClick={abrirNovo}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Novo conteúdo
        </button>
      </div>

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itens.map(item => (
            <div
              key={item.id}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors"
            >
              <div className="h-36 bg-slate-700 flex items-center justify-center relative">
                {item.tipo === 'VIDEO' ? (
                  <span className="text-4xl">🎬</span>
                ) : (
                  <img
                    src={item.urlMidia}
                    alt={item.titulo}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <span className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-slate-900/80 text-slate-300 rounded-full">
                  {TIPO_LABEL[item.tipo]}
                </span>
                {!item.ativo && (
                  <span className="absolute top-2 left-2 text-xs px-2 py-0.5 bg-slate-600 text-slate-400 rounded-full">
                    Inativo
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-sm truncate">{item.titulo}</p>
                <p className="text-xs text-slate-500 mt-0.5">Ordem: {item.ordemExibicao}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => abrirEditar(item)}
                    className="flex-1 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remover(item.id)}
                    className="flex-1 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold mb-6">{form.id ? 'Editar conteúdo' : 'Novo conteúdo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(prev => ({ ...prev, tipo: e.target.value as ConteudoTotem['tipo'] }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="SLIDE">Slide</option>
                  <option value="BANNER">Banner</option>
                  <option value="VIDEO">Vídeo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Título</label>
                <input
                  value={form.titulo ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">URL da mídia</label>
                <input
                  value={form.urlMidia ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, urlMidia: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ordem de exibição</label>
                <input
                  type="number"
                  min={1}
                  value={form.ordemExibicao ?? 1}
                  onChange={e => setForm(prev => ({ ...prev, ordemExibicao: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo ?? true}
                  onChange={e => setForm(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="accent-blue-500 w-4 h-4"
                />
                <span className="text-sm text-slate-300">Ativo</span>
              </label>
            </div>
            {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AparenciaTab({ hotelId }: { hotelId: number }) {
  const [form, setForm] = useState(DEFAULT_CONFIG_FORM)
  const [idiomas, setIdiomas] = useState({ pt: true, en: true, es: false })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!hotelId) {
      setCarregando(false)
      return
    }

    configService.buscar(hotelId)
      .then((data: HotelConfig) => {
        setForm({
          nomeExibido: data.nomeExibido ?? '',
          logoUrl: data.logoUrl ?? '',
          corPrimaria: data.corPrimaria ?? '#1e40af',
          idiomasAtivos: data.idiomasAtivos ?? 'pt,en',
        })
        setIdiomas(csvToIdiomas(data.idiomasAtivos ?? 'pt,en'))
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [hotelId])

  async function salvar() {
    if (!hotelId) return

    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      const payload: HotelConfig = {
        hotelId,
        ...form,
        idiomasAtivos: idiomasToCsv(idiomas),
      }
      await configService.salvar(hotelId, payload)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch {
      setErro('Erro ao salvar configurações.')
    } finally {
      setSalvando(false)
    }
  }

  const previewIdiomas = idiomasToCsv(idiomas).split(',').filter(Boolean)

  return (
    <>
      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-5 text-slate-300">Personalização</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome exibido no totem</label>
                <input
                  value={form.nomeExibido}
                  onChange={e => setForm(prev => ({ ...prev, nomeExibido: e.target.value }))}
                  placeholder="Ex: Grand Hotel"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">URL do logo</label>
                <input
                  value={form.logoUrl}
                  onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Cor primária</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.corPrimaria}
                    onChange={e => setForm(prev => ({ ...prev, corPrimaria: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 cursor-pointer"
                  />
                  <span className="font-mono text-sm text-slate-300">{form.corPrimaria}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Idiomas disponíveis</label>
                <div className="flex gap-5">
                  {([
                    { key: 'pt', label: 'PT-BR' },
                    { key: 'en', label: 'English' },
                    { key: 'es', label: 'Español' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={idiomas[key]}
                        onChange={e => setIdiomas(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}
            {sucesso && <p className="mt-4 text-sm text-green-400">Configurações salvas com sucesso!</p>}

            <button
              onClick={salvar}
              disabled={salvando}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>

          <div className="xl:w-80 bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-5 text-slate-300">Preview ao vivo</h3>
            <div className="bg-slate-950 rounded-xl p-6 flex flex-col items-center gap-4 min-h-[300px] border border-slate-700">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-16 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl">
                  🏨
                </div>
              )}
              <h4 className="text-lg font-bold text-white text-center">
                {form.nomeExibido || 'Nome do Hotel'}
              </h4>
              <p className="text-slate-400 text-sm">Bem-vindo ao totem de check-in</p>
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                {previewIdiomas.map(k => (
                  <span
                    key={k}
                    className="px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: form.corPrimaria }}
                  >
                    {IDIOMA_LABEL[k] ?? k}
                  </span>
                ))}
              </div>
              <button
                className="mt-2 px-6 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: form.corPrimaria }}
              >
                Iniciar Check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function TotemPage() {
  const { usuario } = useAuth()
  const [abaAtiva, setAbaAtiva] = useState<Aba>('Dispositivos')
  const hotelId = usuario?.hotelId ?? 0

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Totem</h2>

      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 mb-6 w-fit">
        {abas.map(aba => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              abaAtiva === aba
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {aba}
          </button>
        ))}
      </div>

      {abaAtiva === 'Dispositivos' && <DispositivosTab hotelId={hotelId} />}
      {abaAtiva === 'Conteúdo' && <ConteudoTab hotelId={hotelId} />}
      {abaAtiva === 'Aparência' && <AparenciaTab hotelId={hotelId} />}
    </div>
  )
}
