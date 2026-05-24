import { useEffect, useState } from 'react'
import type { Reserva } from '../types'
import { reservaService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const STATUS_LABEL: Record<Reserva['status'], string> = {
  CONFIRMADA: 'Confirmada',
  CHECKIN_REALIZADO: 'Check-in feito',
  CHECKOUT_REALIZADO: 'Check-out feito',
  CANCELADA: 'Cancelada',
}

const STATUS_COR: Record<Reserva['status'], string> = {
  CONFIRMADA: 'bg-blue-500/20 text-blue-400',
  CHECKIN_REALIZADO: 'bg-green-500/20 text-green-400',
  CHECKOUT_REALIZADO: 'bg-slate-600 text-slate-400',
  CANCELADA: 'bg-red-500/20 text-red-400',
}

interface ReservaForm {
  hospedeNome: string
  hospedeCpf: string
  hospedeEmail: string
  quartoNumero: string
  hotelId: number
  dataCheckin: string
  dataCheckout: string
  hospedeDataNascimento: string
}

const today = new Date().toISOString().slice(0, 10)

const EMPTY_FORM = (hotelId: number): ReservaForm => ({
  hospedeNome: '',
  hospedeCpf: '',
  hospedeEmail: '',
  quartoNumero: '',
  hotelId,
  dataCheckin: today,
  dataCheckout: today,
  hospedeDataNascimento: '',
})

function formatarCpf(valor: string) {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export default function ReservationsPage() {
  const { usuario } = useAuth()

  const [reservas, setReservas] = useState<Reserva[]>([])
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<Reserva['status'] | ''>('')
  const [carregando, setCarregando] = useState(true)
  const [pagina, setPagina] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState<ReservaForm>(() => EMPTY_FORM(usuario?.hotelId ?? 0))
  const [reservaEditando, setReservaEditando] = useState<Reserva | null>(null)
  const [deletandoId, setDeletandoId] = useState<number | null>(null)

  useEffect(() => {
    if (usuario?.hotelId) {
      setForm(EMPTY_FORM(usuario.hotelId))
    }
  }, [usuario?.hotelId])

  async function carregar(p = 0, q = '', status = '') {
    setCarregando(true)
    try {
      const data = await reservaService.listar({
        page: p,
        size: 20,
        busca: q || undefined,
        status: status || undefined,
      })
      const lista = data.content ?? data
      setReservas(lista)
      setTotalPaginas(data.totalPages ?? 1)
      setPagina(p)
    } catch {
      setReservas(MOCK_RESERVAS)
      setTotalPaginas(1)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function handleBusca() { carregar(0, busca, statusFiltro) }

  function handleStatusChange(s: Reserva['status'] | '') {
    setStatusFiltro(s)
    carregar(0, busca, s)
  }

  const formatarData = (iso: string) => {
    const [ano, mes, dia] = iso.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function abrirNovo() {
    const hotelPadrao = usuario?.hotelId ?? 0
    setReservaEditando(null)
    setForm(EMPTY_FORM(hotelPadrao))
    setErro(null)
    setModalAberto(true)
  }

  function abrirEdicao(r: Reserva) {
    setReservaEditando(r)
    setForm({
      hospedeNome: r.hospedeNome,
      hospedeCpf: r.hospedeCpf,
      hospedeEmail: r.hospedeEmail ?? '',
      quartoNumero: r.quartoNumero,
      hotelId: r.hotelId,
      dataCheckin: r.dataCheckin,
      dataCheckout: r.dataCheckout,
      hospedeDataNascimento: r.hospedeDataNascimento ?? '',
    })
    setErro(null)
    setModalAberto(true)
  }

  async function confirmarDelete(id: number) {
    try {
      await reservaService.deletar(id)
      setDeletandoId(null)
      await carregar(pagina, busca, statusFiltro)
    } catch {
      setDeletandoId(null)
    }
  }

  async function salvarReserva() {
    if (!form.hospedeNome || !form.hospedeCpf || !form.quartoNumero) {
      setErro('Preencha os campos obrigatórios.')
      return
    }

    const cpfDigits = form.hospedeCpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setErro('CPF inválido. Informe 11 dígitos.')
      return
    }

    if (form.hospedeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hospedeEmail)) {
      setErro('E-mail inválido.')
      return
    }

    if (!form.dataCheckin || !form.dataCheckout) {
      setErro('Informe check-in e check-out.')
      return
    }

    if (form.dataCheckout < form.dataCheckin) {
      setErro('Check-out deve ser maior ou igual ao check-in.')
      return
    }

    if (!form.hotelId) {
      setErro('Selecione um hotel.')
      return
    }

    setSalvando(true)
    setErro(null)
    try {
      const payload = {
        hospedeNome: form.hospedeNome,
        hospedeCpf: form.hospedeCpf,
        hospedeEmail: form.hospedeEmail || null,
        quartoNumero: form.quartoNumero,
        hotelId: form.hotelId,
        dataCheckin: form.dataCheckin,
        dataCheckout: form.dataCheckout,
        hospedeDataNascimento: form.hospedeDataNascimento || null,
      }
      if (reservaEditando) {
        await reservaService.atualizar(reservaEditando.id, payload)
      } else {
        await reservaService.criar(payload)
      }
      setModalAberto(false)
      await carregar(0, busca, statusFiltro)
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
      setErro(data?.detail ?? data?.message ?? 'Erro ao cadastrar reserva.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-2xl font-bold">Reservas</h2>
        <button
          onClick={abrirNovo}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Nova reserva
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBusca()}
          placeholder="Nome, CPF ou código da reserva..."
          className="flex-1 min-w-[200px] max-w-sm px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={statusFiltro}
          onChange={e => handleStatusChange(e.target.value as Reserva['status'] | '')}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="CONFIRMADA">Confirmada</option>
          <option value="CHECKIN_REALIZADO">Check-in feito</option>
          <option value="CHECKOUT_REALIZADO">Check-out feito</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <button
          onClick={handleBusca}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Buscar
        </button>
      </div>

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="px-6 py-3 font-medium">Código</th>
                  <th className="px-6 py-3 font-medium">Hóspede</th>
                  <th className="px-6 py-3 font-medium">CPF</th>
                  <th className="px-6 py-3 font-medium">Quarto</th>
                  <th className="px-6 py-3 font-medium">Check-in</th>
                  <th className="px-6 py-3 font-medium">Check-out</th>
                  <th className="px-6 py-3 font-medium">Dt. Nascimento</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{r.codigoReserva}</td>
                    <td className="px-6 py-4 font-medium">{r.hospedeNome}</td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-300">{formatarCpf(r.hospedeCpf)}</td>
                    <td className="px-6 py-4 text-slate-400">{r.quartoNumero}</td>
                    <td className="px-6 py-4 text-slate-400">{formatarData(r.dataCheckin)}</td>
                    <td className="px-6 py-4 text-slate-400">{formatarData(r.dataCheckout)}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {r.hospedeDataNascimento ? formatarData(r.hospedeDataNascimento) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COR[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {deletandoId === r.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400 whitespace-nowrap">Excluir?</span>
                          <button
                            onClick={() => confirmarDelete(r.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeletandoId(null)}
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirEdicao(r)}
                            className="p-1.5 bg-slate-700 hover:bg-blue-600 text-white rounded transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeletandoId(r.id)}
                            className="p-1.5 bg-slate-700 hover:bg-red-600 text-white rounded transition-colors"
                            title="Excluir"
                          >
                            🗑️
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

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center gap-3 mt-4 justify-center">
              <button
                onClick={() => carregar(pagina - 1, busca)}
                disabled={pagina === 0}
                className="px-3 py-1.5 bg-slate-700 disabled:opacity-40 text-white text-sm rounded-lg"
              >
                ← Anterior
              </button>
              <span className="text-sm text-slate-400">{pagina + 1} / {totalPaginas}</span>
              <button
                onClick={() => carregar(pagina + 1, busca)}
                disabled={pagina >= totalPaginas - 1}
                className="px-3 py-1.5 bg-slate-700 disabled:opacity-40 text-white text-sm rounded-lg"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold mb-6">{reservaEditando ? 'Editar reserva' : 'Nova reserva'}</h3>
            <div className="space-y-4">
              {reservaEditando && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Código da reserva</label>
                  <p className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg font-mono text-sm text-slate-300">
                    {reservaEditando.codigoReserva}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome do hóspede *</label>
                <input
                  value={form.hospedeNome}
                  onChange={e => setForm(p => ({ ...p, hospedeNome: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">CPF *</label>
                <input
                  value={form.hospedeCpf}
                  onChange={e => setForm(p => ({ ...p, hospedeCpf: formatarCpf(e.target.value) }))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Formato: 000.000.000-00</p>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.hospedeEmail}
                  onChange={e => setForm(p => ({ ...p, hospedeEmail: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Quarto *</label>
                <input
                  value={form.quartoNumero}
                  onChange={e => setForm(p => ({ ...p, quartoNumero: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Check-in *</label>
                  <input
                    type="date"
                    value={form.dataCheckin}
                    onChange={e => setForm(p => ({ ...p, dataCheckin: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Check-out *</label>
                  <input
                    type="date"
                    value={form.dataCheckout}
                    onChange={e => setForm(p => ({ ...p, dataCheckout: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Data de nascimento do hóspede</label>
                <input
                  type="date"
                  value={form.hospedeDataNascimento}
                  onChange={e => setForm(p => ({ ...p, hospedeDataNascimento: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Opcional. Habilita verificação por data de nascimento no totem.</p>
              </div>
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
                onClick={salvarReserva}
                disabled={salvando}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {salvando ? 'Salvando...' : reservaEditando ? 'Salvar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MOCK_RESERVAS: Reserva[] = [
  { id: 1, codigoReserva: 'RES-001', hospedeNome: 'João Silva', hospedeCpf: '111.222.333-44', hospedeEmail: 'joao@email.com', quartoNumero: '201', hotelId: 1, dataCheckin: '2026-04-14', dataCheckout: '2026-04-17', status: 'CHECKIN_REALIZADO' },
  { id: 2, codigoReserva: 'RES-002', hospedeNome: 'Maria Souza', hospedeCpf: '555.666.777-88', hospedeEmail: 'maria@email.com', quartoNumero: '305', hotelId: 1, dataCheckin: '2026-04-15', dataCheckout: '2026-04-18', status: 'CONFIRMADA' },
  { id: 3, codigoReserva: 'RES-003', hospedeNome: 'Carlos Lima', hospedeCpf: '999.000.111-22', hospedeEmail: 'carlos@email.com', quartoNumero: '102', hotelId: 2, dataCheckin: '2026-04-10', dataCheckout: '2026-04-14', status: 'CHECKOUT_REALIZADO' },
]
