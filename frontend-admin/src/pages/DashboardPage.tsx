import { useEffect, useState } from 'react'
import { metricasService } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface DashboardData {
  totalCheckinsHoje: number
  totalCheckoutsHoje: number
  totalChavesHoje: number
  ocupacaoAtual: number
  hoteisAtivos: number
  historico: { data: string; totalCheckins: number; totalCheckouts: number; totalChaves: number }[]
  idiomaPt: number
  idiomaEn: number
  idiomaEs: number
}

function StatCard({ label, value, cor }: { label: string; value: number | string; cor: string }) {
  return (
    <div className={`bg-slate-800 border ${cor} rounded-2xl p-6`}>
      <p className="text-sm text-slate-400 font-medium">{label}</p>
      <p className="text-4xl font-bold mt-1">{value}</p>
    </div>
  )
}

const IDIOMA_CORES = ['#3b82f6', '#22c55e', '#f59e0b']
const IDIOMA_MOCK = [
  { idioma: 'Portugues', valor: 58 },
  { idioma: 'English', valor: 27 },
  { idioma: 'Espanol', valor: 15 },
]

const MOCK_HISTORICO = [
  { data: '08/04', totalCheckins: 10, totalCheckouts: 7,  totalChaves: 12 },
  { data: '09/04', totalCheckins: 14, totalCheckouts: 11, totalChaves: 16 },
  { data: '10/04', totalCheckins: 8,  totalCheckouts: 9,  totalChaves: 9  },
  { data: '11/04', totalCheckins: 17, totalCheckouts: 13, totalChaves: 20 },
  { data: '12/04', totalCheckins: 12, totalCheckouts: 8,  totalChaves: 14 },
  { data: '13/04', totalCheckins: 15, totalCheckouts: 12, totalChaves: 18 },
  { data: '14/04', totalCheckins: 12, totalCheckouts: 8,  totalChaves: 15 },
]

export default function DashboardPage() {
  const [dados, setDados] = useState<DashboardData | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    metricasService.dashboard()
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {carregando && (
        <p className="text-slate-500">Carregando metricas...</p>
      )}

      {!carregando && !dados && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm mb-6">
          Backend offline - exibindo dados simulados para desenvolvimento.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
        <StatCard label="Check-ins hoje"  value={dados?.totalCheckinsHoje  ?? 12} cor="border-blue-500/30" />
        <StatCard label="Check-outs hoje" value={dados?.totalCheckoutsHoje ?? 8}  cor="border-green-500/30" />
        <StatCard label="Chaves emitidas" value={dados?.totalChavesHoje    ?? 19} cor="border-cyan-500/30" />
        <StatCard label="Ocupacao atual"  value={`${dados?.ocupacaoAtual   ?? 74}%`} cor="border-purple-500/30" />
        <StatCard label="Hoteis ativos"   value={dados?.hoteisAtivos       ?? 3}  cor="border-orange-500/30" />
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-4 text-slate-300">Movimentacao - ultimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dados?.historico ?? MOCK_HISTORICO}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="data" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="totalCheckins"  name="Check-ins"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalCheckouts" name="Check-outs" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalChaves"    name="Chaves"     fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-4 text-slate-300">Idiomas utilizados</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              {(() => {
                const idiomaData = dados && (dados.idiomaPt + dados.idiomaEn + dados.idiomaEs) > 0
                  ? [
                      { idioma: 'Português', valor: dados.idiomaPt },
                      { idioma: 'English',   valor: dados.idiomaEn },
                      { idioma: 'Español',   valor: dados.idiomaEs },
                    ].filter(d => d.valor > 0)
                  : IDIOMA_MOCK
                return (
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
                )
              })()}
              <Legend formatter={(value) => <span className="text-xs text-slate-300">{value}</span>} />
              <Tooltip
                formatter={(value: unknown) => [`${value}%`, 'Uso']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}