import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hotelService, metricasService, usuarioService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { Hotel, Usuario } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface DashboardData {
  totalCheckinsHoje: number
  totalCheckoutsHoje: number
  totalChavesHoje: number
  hoteisAtivos: number
  historico: { data: string; totalCheckins: number; totalCheckouts: number; totalChaves: number }[]
  idiomaPt: number
  idiomaEn: number
  idiomaEs: number
}

function StatCard({ label, value, cor, helper }: { label: string; value: number | string; cor: string; helper?: string }) {
  return (
    <div className={`bg-slate-800 border ${cor} rounded-2xl p-6`}>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      <p className="text-4xl font-bold mt-1">{value}</p>
      {helper && <p className="text-xs text-slate-500 mt-2">{helper}</p>}
    </div>
  )
}

const IDIOMA_CORES = ['#3b82f6', '#22c55e', '#f59e0b']

export default function DashboardPage() {
  const { usuario } = useAuth()
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [hoteis, setHoteis] = useState<Hotel[]>([])
  const [totalHoteis, setTotalHoteis] = useState(0)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true

    async function carregar() {
      setCarregando(true)
      setErro(null)

      try {
        if (usuario?.role === 'ADMIN') {
          const [metricas, hoteisData, usuariosData] = await Promise.all([
            metricasService.dashboard(),
            hotelService.listar(0, 100),
            usuarioService.listar(),
          ])

          if (!ativo) return
          const listaHoteis = hoteisData.content ?? hoteisData
          setDados(metricas)
          setHoteis(listaHoteis)
          setTotalHoteis(hoteisData.totalElements ?? listaHoteis.length)
          setUsuarios(usuariosData)
          return
        }

        if (!usuario?.hotelId) {
          throw new Error('Usuário operador sem hotel vinculado.')
        }

        const metricas = await metricasService.dashboard(usuario.hotelId)
        if (!ativo) return
        setDados(metricas)
      } catch {
        if (!ativo) return
        setDados(null)
        setHoteis([])
        setTotalHoteis(0)
        setUsuarios([])
        setErro('Não foi possível carregar o dashboard. Verifique se o backend está ativo e se o usuário tem permissão para estes dados.')
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    carregar()

    return () => { ativo = false }
  }, [usuario])

  const isAdmin = usuario?.role === 'ADMIN'
  const usuariosAtivos = usuarios.filter(u => u.ativo).length
  const operadoresAtivos = usuarios.filter(u => u.ativo && u.role === 'OPERADOR').length
  const idiomaData = dados
    ? [
        { idioma: 'Português', valor: dados.idiomaPt },
        { idioma: 'English', valor: dados.idiomaEn },
        { idioma: 'Español', valor: dados.idiomaEs },
      ].filter(d => d.valor > 0)
    : []

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-sm text-slate-500 font-medium">{isAdmin ? 'FlexMedia' : 'Gestão do hotel'}</p>
        <h2 className="text-2xl font-bold">{isAdmin ? 'Dashboard da plataforma' : 'Dashboard operacional'}</h2>
      </div>

      {carregando && (
        <p className="text-slate-500">Carregando métricas...</p>
      )}

      {!carregando && erro && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm mb-6">
          {erro}
        </div>
      )}

      {!carregando && !erro && isAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-2">
            <StatCard label="Hotéis ativos" value={dados?.hoteisAtivos ?? 0} cor="border-emerald-500/30" helper="Clientes aptos a operar" />
            <StatCard label="Hotéis cadastrados" value={totalHoteis} cor="border-blue-500/30" helper={`${hoteis.filter(h => !h.ativo).length} inativos`} />
            <StatCard label="Operadores ativos" value={operadoresAtivos} cor="border-cyan-500/30" helper={`${usuariosAtivos} usuários ativos no total`} />
            <StatCard label="Check-ins hoje" value={dados?.totalCheckinsHoje ?? 0} cor="border-violet-500/30" helper="Agregado da plataforma" />
            <StatCard label="Chaves emitidas" value={dados?.totalChavesHoje ?? 0} cor="border-orange-500/30" helper="Agregado da plataforma" />
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-2 text-slate-200">Operação FlexMedia</h3>
              <p className="text-sm text-slate-400 mb-5">
                Console para cadastrar clientes, controlar acessos globais e acompanhar a adoção da solução white label.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to="/hoteis" className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 hover:border-blue-500/60 transition-colors">
                  <p className="text-sm font-semibold text-slate-100">Cadastrar hotel</p>
                  <p className="text-xs text-slate-500 mt-1">Criar ou revisar clientes da plataforma.</p>
                </Link>
                <Link to="/usuarios" className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 hover:border-blue-500/60 transition-colors">
                  <p className="text-sm font-semibold text-slate-100">Gerenciar usuários</p>
                  <p className="text-xs text-slate-500 mt-1">Vincular operadores aos hotéis atendidos.</p>
                </Link>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-slate-200">Uso global hoje</h3>
              <div className="space-y-4">
                {[
                  { label: 'Check-ins', value: dados?.totalCheckinsHoje ?? 0, color: 'bg-blue-500' },
                  { label: 'Check-outs', value: dados?.totalCheckoutsHoje ?? 0, color: 'bg-green-500' },
                  { label: 'Chaves', value: dados?.totalChavesHoje ?? 0, color: 'bg-cyan-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-semibold text-slate-100">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${Math.min(item.value * 8, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!carregando && !erro && !isAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <StatCard label="Check-ins hoje" value={dados?.totalCheckinsHoje ?? 0} cor="border-blue-500/30" />
            <StatCard label="Check-outs hoje" value={dados?.totalCheckoutsHoje ?? 0} cor="border-green-500/30" />
            <StatCard label="Chaves emitidas" value={dados?.totalChavesHoje ?? 0} cor="border-cyan-500/30" />
          </div>

          <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-slate-300">Movimentação - últimos 7 dias</h3>
              {dados?.historico?.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dados.historico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Bar dataKey="totalCheckins" name="Check-ins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalCheckouts" name="Check-outs" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalChaves" name="Chaves" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
                  Sem histórico registrado para este hotel nos últimos 7 dias.
                </div>
              )}
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-slate-300">Idiomas utilizados</h3>
              {idiomaData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                  <Pie
                    data={idiomaData}
                    dataKey="valor"
                    nameKey="idioma"
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    label={({ percent }) => `${(((percent as number) ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {idiomaData.map((_, i) => (
                      <Cell key={i} fill={IDIOMA_CORES[i % IDIOMA_CORES.length]} />
                    ))}
                  </Pie>
                    <Legend formatter={(value) => <span className="text-xs text-slate-300">{value}</span>} />
                    <Tooltip
                      formatter={(value: unknown) => [`${value}`, 'Usos']}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">
                  Sem seleção de idioma registrada hoje.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
