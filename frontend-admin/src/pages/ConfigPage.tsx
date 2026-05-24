import { useEffect, useState } from 'react'
import type { HotelConfig } from '../types'
import { configService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const DEFAULT_FORM = {
  nomeExibido: '',
  logoUrl: '',
  corPrimaria: '#1e40af',
  idiomasAtivos: 'pt,en',
}

function csvToIdiomas(csv: string): { pt: boolean; en: boolean; es: boolean } {
  const parts = csv.split(',').map(s => s.trim())
  return { pt: parts.includes('pt'), en: parts.includes('en'), es: parts.includes('es') }
}

function idiomasToCsv(idiomas: { pt: boolean; en: boolean; es: boolean }): string {
  return (['pt', 'en', 'es'] as const).filter(k => idiomas[k]).join(',')
}

const IDIOMA_LABEL: Record<string, string> = { pt: 'PT-BR', en: 'EN', es: 'ES' }

export default function ConfigPage() {
  const { usuario } = useAuth()
  const hotelId = usuario?.hotelId ?? 0

  const [form, setForm] = useState(DEFAULT_FORM)
  const [idiomas, setIdiomas] = useState({ pt: true, en: true, es: false })
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!hotelId) { setCarregando(false); return }
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
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Configuração do Totem</h2>

      {carregando ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Formulário */}
          <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-5 text-slate-300">Personalização</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome exibido no totem</label>
                <input
                  value={form.nomeExibido}
                  onChange={e => setForm(p => ({ ...p, nomeExibido: e.target.value }))}
                  placeholder="Ex: Grand Hotel"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">URL do logo</label>
                <input
                  value={form.logoUrl}
                  onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
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
                    onChange={e => setForm(p => ({ ...p, corPrimaria: e.target.value }))}
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
                        onChange={e => setIdiomas(p => ({ ...p, [key]: e.target.checked }))}
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

          {/* Preview ao vivo */}
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
    </div>
  )
}
