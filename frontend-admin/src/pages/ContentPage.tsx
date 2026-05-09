import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CaretLeft,
  CaretRight,
  Check,
  CloudArrowUp,
  ImageSquare,
  Monitor,
  Palette,
  SlidersHorizontal,
} from '@phosphor-icons/react'
import { hotelService, totemDesignService, totemMediaService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FONTS } from '../constants/fonts'
import type { TotemBlock, TotemDesign, TotemMediaAsset } from '../types'
import TotemDesignRenderer, { TotemFlowPreview, type TotemPreviewScreen } from '../components/TotemDesignRenderer'

const PREVIEW_SCREENS: Array<{ id: TotemPreviewScreen; label: string; kind: 'idle' | 'flow' }> = [
  { id: 'idle', label: 'Tela inicial', kind: 'idle' },
  { id: 'search', label: 'Busca', kind: 'flow' },
  { id: 'confirm', label: 'Confirmação', kind: 'flow' },
  { id: 'facial', label: 'Biometria', kind: 'flow' },
  { id: 'key', label: 'Chave', kind: 'flow' },
  { id: 'checkout', label: 'Check-out', kind: 'flow' },
]

const EMPTY_DESIGN: TotemDesign = {
  theme: {
    brandName: 'CheckIn Hub',
    primaryColor: '#0f766e',
    backgroundColor: '#101513',
    textColor: '#f7fbf8',
    surfaceColor: '#18211d',
    fontFamily: 'Satoshi',
  },
  layout: {
    template: 'premium-utilitario',
    density: 'comfortable',
    screen: 'portrait',
  },
  blocks: [
    { id: 'hero', type: 'hero', visible: true, title: 'Bem-vindo', subtitle: 'Toque para começar', alignment: 'left', variant: 'attract', overlay: 42 },
    { id: 'background-video', type: 'video', visible: true, title: 'Vídeo de fundo', variant: 'background' },
    { id: 'actions', type: 'cta', visible: true, title: 'Atendimento', subtitle: 'Check-in e check-out', variant: 'dual' },
    { id: 'language', type: 'language', visible: true, title: 'Idiomas' },
    { id: 'footer', type: 'footer', visible: true, title: 'Recepção disponível 24h', subtitle: 'Procure nossa equipe se precisar de ajuda' },
  ],
}

const STYLE_PRESETS: Array<{ id: string; name: string; description: string; design: TotemDesign }> = [
  {
    id: 'premium-utilitario',
    name: 'Premium utilitário',
    description: 'Base neutra, contraste alto e aparência de equipamento bem acabado.',
    design: EMPTY_DESIGN,
  },
  {
    id: 'lobby-claro',
    name: 'Lobby claro',
    description: 'Mais luminoso, ideal para hotéis com identidade leve.',
    design: {
      ...EMPTY_DESIGN,
      theme: { ...EMPTY_DESIGN.theme, primaryColor: '#0e7490', backgroundColor: '#eef8f7', textColor: '#10212a', surfaceColor: '#ffffff' },
      layout: { template: 'lobby-claro', density: 'comfortable', screen: 'portrait' },
    },
  },
  {
    id: 'terminal-compacto',
    name: 'Terminal compacto',
    description: 'Denso, objetivo e pensado para alto fluxo de hóspedes.',
    design: {
      ...EMPTY_DESIGN,
      theme: { ...EMPTY_DESIGN.theme, primaryColor: '#475569', backgroundColor: '#111827', textColor: '#f8fafc', surfaceColor: '#1f2937' },
      layout: { template: 'terminal-compacto', density: 'compact', screen: 'portrait' },
    },
  },
]

export default function ContentPage() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.role === 'ADMIN'
  const [hotelId, setHotelId] = useState(usuario?.hotelId ?? 1)
  const [hoteis, setHoteis] = useState<{ id: number; nome: string }[]>([])
  const [design, setDesign] = useState<TotemDesign>(EMPTY_DESIGN)
  const [midias, setMidias] = useState<TotemMediaAsset[]>([])
  const [tab, setTab] = useState<'design' | 'publish'>('design')
  const [previewScreen, setPreviewScreen] = useState<TotemPreviewScreen>('idle')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const heroBlock = getBlock(design, 'hero')
  const videoBlock = getBlock(design, 'video')
  const footerBlock = getBlock(design, 'footer')
  const screenIndex = PREVIEW_SCREENS.findIndex(screen => screen.id === previewScreen)
  const currentScreen = PREVIEW_SCREENS[screenIndex] ?? PREVIEW_SCREENS[0]

  useEffect(() => {
    if (isAdmin) {
      hotelService.listar(0, 100)
        .then(data => setHoteis(data.content ?? data))
        .catch(() => setHoteis([]))
    }
  }, [isAdmin])

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [draft, assets] = await Promise.all([
        totemDesignService.buscarDraft(hotelId),
        totemMediaService.listar(hotelId),
      ])
      setDesign(normalizeDesign(draft))
      setMidias(assets)
    } catch {
      setDesign(EMPTY_DESIGN)
      setMidias([])
      setError('Não foi possível carregar o Totem Studio deste hotel.')
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvarDraft(nextDesign = design) {
    setSaving(true)
    setError(null)
    try {
      const saved = await totemDesignService.salvarDraft(hotelId, nextDesign)
      setDesign(normalizeDesign(saved))
      setMessage('Rascunho salvo.')
    } catch {
      setError('Não foi possível salvar o rascunho.')
    } finally {
      setSaving(false)
    }
  }

  async function publicar() {
    setSaving(true)
    setError(null)
    try {
      await totemDesignService.salvarDraft(hotelId, design)
      await totemDesignService.publicar(hotelId)
      setMessage('Design publicado para os totens deste hotel.')
    } catch {
      setError('Não foi possível publicar o design.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadForBlock(file: File | undefined, blockType: TotemBlock['type'], kind: 'image' | 'video') {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const asset = await totemMediaService.upload(hotelId, file)
      const block = getBlock(design, blockType)
      const previousUrl = kind === 'image' ? block?.imageUrl : block?.videoUrl
      setMidias(current => [asset, ...current.filter(item => item.publicUrl !== previousUrl)])
      upsertBlock(blockType, kind === 'image' ? { imageUrl: asset.publicUrl, visible: true } : { videoUrl: asset.publicUrl, visible: true })
      setMessage('Mídia atualizada.')
    } catch {
      setError('Arquivo inválido ou acima do limite permitido.')
    } finally {
      setUploading(false)
    }
  }

  function applyPreset(template: TotemDesign) {
    const next = cloneDesign(template)
    setDesign(current => ({
      ...next,
      blocks: mergePresetBlocks(current.blocks, next.blocks),
    }))
    setMessage('Estilo global aplicado ao rascunho.')
  }

  function updateTheme<K extends keyof TotemDesign['theme']>(key: K, value: TotemDesign['theme'][K]) {
    setDesign(current => ({ ...current, theme: { ...current.theme, [key]: value } }))
  }

  function updateLayout<K extends keyof TotemDesign['layout']>(key: K, value: TotemDesign['layout'][K]) {
    setDesign(current => ({ ...current, layout: { ...current.layout, [key]: value } }))
  }

  function upsertBlock(type: TotemBlock['type'], patch: Partial<TotemBlock>) {
    setDesign(current => {
      const index = current.blocks.findIndex(block => block.type === type)
      if (index >= 0) {
        return {
          ...current,
          blocks: current.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block),
        }
      }
      return {
        ...current,
        blocks: [...current.blocks, { ...createBlock(type), ...patch }],
      }
    })
  }

  function goPreview(offset: number) {
    const nextIndex = (screenIndex + offset + PREVIEW_SCREENS.length) % PREVIEW_SCREENS.length
    setPreviewScreen(PREVIEW_SCREENS[nextIndex].id)
  }

  const visibleBlockCount = useMemo(() => design.blocks.filter(block => block.visible).length, [design.blocks])

  return (
    <div className="min-h-full bg-[#101513] p-4 text-[#eef3ef] md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-[#9eb2aa]">Totem Studio</p>
            <h1 className="mt-2 text-4xl font-semibold leading-none text-[#f5fbf7] md:text-5xl">
              Identidade do autoatendimento
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aabbb4]">
              Defina a aparência global do totem, edite a tela inicial e confira como a identidade se aplica ao fluxo do hóspede.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {isAdmin && hoteis.length > 0 && (
              <select
                value={hotelId}
                onChange={event => setHotelId(Number(event.target.value))}
                className="h-11 rounded-xl border border-white/10 bg-white/8 px-3 text-sm text-white outline-none focus:border-[#d7fbe8]"
              >
                {hoteis.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>{hotel.nome}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => salvarDraft()}
              disabled={saving || loading}
              className="h-11 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
            >
              Salvar rascunho
            </button>
            <button
              onClick={publicar}
              disabled={saving || loading}
              className="h-11 rounded-xl bg-[#d7fbe8] px-4 text-sm font-semibold text-[#10201d] hover:bg-[#c1f1d8] disabled:opacity-50"
            >
              Publicar
            </button>
          </div>
        </header>

        {(message || error) && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-[#d7fbe8]/30 bg-[#d7fbe8]/10 text-[#d8fff4]'}`}>
            {error ?? message}
          </div>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {(['design', 'publish'] as const).map(nextTab => (
            <button
              key={nextTab}
              onClick={() => setTab(nextTab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === nextTab ? 'bg-[#d7fbe8] text-[#10201d]' : 'bg-white/8 text-[#aabbb4] hover:bg-white/12 hover:text-white'}`}
            >
              {nextTab === 'design' ? 'Design' : 'Publicação'}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingStudio />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(420px,1fr)_360px]">
            <aside className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              {tab === 'design' ? (
                <GlobalDesignPanel
                  design={design}
                  onApplyPreset={applyPreset}
                  onThemeChange={updateTheme}
                  onLayoutChange={updateLayout}
                />
              ) : (
                <PublishPanel design={design} saving={saving} visibleBlockCount={visibleBlockCount} onSave={() => salvarDraft()} onPublish={publicar} />
              )}
            </aside>

            <main className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <PanelTitle icon={<ImageSquare size={19} />} title="Preview do totem" />
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{currentScreen.label}</p>
                  <p className="text-xs text-[#9eb2aa]">Portrait 9:16</p>
                </div>
              </div>

              <div className="relative mx-auto flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goPreview(-1)}
                  className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-[#d8fff4] hover:bg-white/12 md:flex"
                  aria-label="Tela anterior"
                >
                  <CaretLeft size={22} />
                </button>

                <div className="aspect-[9/16] h-[min(74vh,780px)] max-h-[780px] max-w-full flex-none overflow-hidden rounded-[2rem] border border-white/10 bg-black p-2 shadow-[0_30px_100px_-60px_rgba(0,0,0,1)]">
                  {previewScreen === 'idle'
                    ? <TotemDesignRenderer design={design} />
                    : <TotemFlowPreview design={design} screen={previewScreen} />}
                </div>

                <button
                  type="button"
                  onClick={() => goPreview(1)}
                  className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-[#d8fff4] hover:bg-white/12 md:flex"
                  aria-label="Próxima tela"
                >
                  <CaretRight size={22} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {PREVIEW_SCREENS.map(screen => (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setPreviewScreen(screen.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${previewScreen === screen.id ? 'bg-[#d7fbe8] text-[#10201d]' : 'bg-white/8 text-[#9eb2aa] hover:bg-white/12 hover:text-white'}`}
                  >
                    {screen.label}
                  </button>
                ))}
              </div>
            </main>

            <aside className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              {tab === 'design' ? (
                <ScreenContentPanel
                  screen={currentScreen}
                  heroBlock={heroBlock}
                  videoBlock={videoBlock}
                  footerBlock={footerBlock}
                  midias={midias}
                  uploading={uploading}
                  onHeroChange={patch => upsertBlock('hero', patch)}
                  onFooterChange={patch => upsertBlock('footer', patch)}
                  onUploadImage={file => uploadForBlock(file, 'hero', 'image')}
                  onUploadVideo={file => uploadForBlock(file, 'video', 'video')}
                  onClearImage={() => upsertBlock('hero', { imageUrl: undefined })}
                  onClearVideo={() => upsertBlock('video', { videoUrl: undefined })}
                />
              ) : (
                <PublishPanel design={design} saving={saving} visibleBlockCount={visibleBlockCount} onSave={() => salvarDraft()} onPublish={publicar} />
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function GlobalDesignPanel({
  design,
  onApplyPreset,
  onThemeChange,
  onLayoutChange,
}: {
  design: TotemDesign
  onApplyPreset: (template: TotemDesign) => void
  onThemeChange: <K extends keyof TotemDesign['theme']>(key: K, value: TotemDesign['theme'][K]) => void
  onLayoutChange: <K extends keyof TotemDesign['layout']>(key: K, value: TotemDesign['layout'][K]) => void
}) {
  return (
    <>
      <PanelTitle icon={<SlidersHorizontal size={19} />} title="Estilo global" />
      <p className="mb-4 text-xs leading-5 text-[#9eb2aa]">
        Estas escolhas valem para a tela inicial e para todo o fluxo de atendimento.
      </p>

      <div className="space-y-2">
        {STYLE_PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => onApplyPreset(preset.design)}
            className={`w-full rounded-2xl border p-4 text-left ${design.layout.template === preset.id ? 'border-[#d7fbe8]/55 bg-[#d7fbe8]/10' : 'border-white/10 bg-white/[0.04] hover:border-[#d7fbe8]/40 hover:bg-white/[0.07]'}`}
          >
            <span className="text-sm font-semibold text-white">{preset.name}</span>
            <span className="mt-1 block text-xs leading-5 text-[#9eb2aa]">{preset.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        <PanelTitle icon={<Palette size={19} />} title="Marca e tokens" />
        <Field label="Nome exibido">
          <input value={design.theme.brandName} onChange={event => onThemeChange('brandName', event.target.value)} className="studio-input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Acento" value={design.theme.primaryColor} onChange={value => onThemeChange('primaryColor', value)} />
          <ColorField label="Fundo" value={design.theme.backgroundColor} onChange={value => onThemeChange('backgroundColor', value)} />
          <ColorField label="Texto" value={design.theme.textColor} onChange={value => onThemeChange('textColor', value)} />
          <ColorField label="Superfície" value={design.theme.surfaceColor} onChange={value => onThemeChange('surfaceColor', value)} />
        </div>
        <Field label="Fonte">
          <select value={design.theme.fontFamily} onChange={event => onThemeChange('fontFamily', event.target.value)} className="studio-input">
            {FONTS.map(font => (
              <option key={font.id} value={font.id} style={{ fontFamily: `'${font.id}', system-ui, sans-serif` }}>
                {font.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Densidade do fluxo">
          <select value={design.layout.density} onChange={event => onLayoutChange('density', event.target.value as TotemDesign['layout']['density'])} className="studio-input">
            <option value="compact">Compacta</option>
            <option value="comfortable">Confortável</option>
            <option value="spacious">Espaçosa</option>
          </select>
        </Field>
      </div>
    </>
  )
}

function ScreenContentPanel({
  screen,
  heroBlock,
  videoBlock,
  footerBlock,
  midias,
  uploading,
  onHeroChange,
  onFooterChange,
  onUploadImage,
  onUploadVideo,
  onClearImage,
  onClearVideo,
}: {
  screen: { id: TotemPreviewScreen; label: string; kind: 'idle' | 'flow' }
  heroBlock?: TotemBlock
  videoBlock?: TotemBlock
  footerBlock?: TotemBlock
  midias: TotemMediaAsset[]
  uploading: boolean
  onHeroChange: (patch: Partial<TotemBlock>) => void
  onFooterChange: (patch: Partial<TotemBlock>) => void
  onUploadImage: (file: File | undefined) => void
  onUploadVideo: (file: File | undefined) => void
  onClearImage: () => void
  onClearVideo: () => void
}) {
  if (screen.kind === 'flow') {
    return (
      <div>
        <PanelTitle icon={<Monitor size={19} />} title={screen.label} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-[#aabbb4]">
          <p className="font-semibold text-white">Preview sem edição por tela</p>
          <p className="mt-2">
            Esta etapa herda fonte, cores e estilo global. Campos, hierarquia e ações permanecem fixos para preservar legibilidade e reduzir atrito de configuração.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PanelTitle icon={<ImageSquare size={19} />} title="Tela inicial" />
      <Field label="Mensagem principal">
        <input value={heroBlock?.title ?? ''} onChange={event => onHeroChange({ title: event.target.value, visible: true })} className="studio-input" />
      </Field>
      <Field label="Mensagem de apoio">
        <textarea value={heroBlock?.subtitle ?? ''} onChange={event => onHeroChange({ subtitle: event.target.value, visible: true })} className="studio-input min-h-20 resize-none" />
      </Field>
      <MediaField
        kind="video"
        assets={midias}
        selectedUrl={videoBlock?.videoUrl}
        uploading={uploading}
        onUpload={onUploadVideo}
        onClear={onClearVideo}
      />
      <MediaField
        kind="image"
        assets={midias}
        selectedUrl={heroBlock?.imageUrl}
        uploading={uploading}
        onUpload={onUploadImage}
        onClear={onClearImage}
      />
      <Field label="Escurecimento da mídia">
        <input type="range" min={0} max={75} value={heroBlock?.overlay ?? 42} onChange={event => onHeroChange({ overlay: Number(event.target.value), visible: true })} className="w-full accent-[#d7fbe8]" />
      </Field>
      <div className="border-t border-white/10 pt-4">
        <Field label="Rodapé">
          <input value={footerBlock?.title ?? ''} onChange={event => onFooterChange({ title: event.target.value, visible: true })} className="studio-input" />
        </Field>
        <Field label="Texto auxiliar do rodapé">
          <input value={footerBlock?.subtitle ?? ''} onChange={event => onFooterChange({ subtitle: event.target.value, visible: true })} className="studio-input" />
        </Field>
      </div>
    </div>
  )
}

function MediaField({ kind, assets, selectedUrl, uploading, onUpload, onClear }: {
  kind: 'image' | 'video'
  assets: TotemMediaAsset[]
  selectedUrl?: string
  uploading: boolean
  onUpload: (file: File | undefined) => void
  onClear: () => void
}) {
  const selectedAsset = assets.find(asset => asset.publicUrl === selectedUrl)
  const label = kind === 'image' ? 'Imagem de fallback' : 'Vídeo de fundo'
  const uploadLabel = selectedUrl
    ? kind === 'image' ? 'Substituir imagem' : 'Substituir vídeo'
    : kind === 'image' ? 'Enviar imagem' : 'Enviar vídeo'
  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4'

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-[#9eb2aa]">{label}</span>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="overflow-hidden rounded-xl bg-black/20">
          {selectedUrl ? (
            kind === 'image' ? (
              <img src={selectedUrl} alt={selectedAsset?.originalName ?? 'Mídia selecionada'} className="h-32 w-full object-cover" />
            ) : (
              <video src={selectedUrl} className="h-32 w-full object-cover" muted loop autoPlay playsInline />
            )
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-center text-sm text-[#9eb2aa]">
              <CloudArrowUp size={26} weight="duotone" />
              <span className="mt-2">Nenhuma mídia selecionada</span>
            </div>
          )}
        </div>

        {selectedUrl && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{selectedAsset?.originalName ?? 'Mídia selecionada'}</p>
              {selectedAsset && <p className="text-xs text-[#9eb2aa]">{formatBytes(selectedAsset.sizeBytes)}</p>}
            </div>
            <button type="button" onClick={onClear} className="shrink-0 rounded-xl bg-white/8 px-3 py-2 text-xs font-semibold text-[#d8fff4] hover:bg-white/12">
              Remover
            </button>
          </div>
        )}

        <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#d7fbe8]/35 bg-[#d7fbe8]/8 px-3 py-2 text-xs font-semibold text-[#d8fff4] hover:bg-[#d7fbe8]/12">
          <CloudArrowUp className="mr-2" size={16} />
          {uploading ? 'Enviando arquivo...' : uploadLabel}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={event => {
              onUpload(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
      </div>
    </div>
  )
}

function PublishPanel({ design, saving, visibleBlockCount, onSave, onPublish }: {
  design: TotemDesign
  saving: boolean
  visibleBlockCount: number
  onSave: () => void
  onPublish: () => void
}) {
  return (
    <div>
      <PanelTitle icon={<Check size={19} />} title="Publicação" />
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[#aabbb4]">
        <p className="font-semibold text-white">Resumo do rascunho</p>
        <p className="mt-2">{visibleBlockCount} blocos técnicos ativos</p>
        <p>{design.theme.brandName}</p>
        <p>{design.layout.template} · {design.layout.density}</p>
      </div>
      <div className="mt-4 grid gap-2">
        <button onClick={onSave} disabled={saving} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50">
          Salvar rascunho
        </button>
        <button onClick={onPublish} disabled={saving} className="rounded-xl bg-[#d7fbe8] px-4 py-3 text-sm font-semibold text-[#10201d] hover:bg-[#c1f1d8] disabled:opacity-50">
          Publicar nos totens
        </button>
      </div>
    </div>
  )
}

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d8fff4]">
      {icon}
      <span>{title}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-4 block last:mb-0">
      <span className="mb-1.5 block text-xs font-medium text-[#9eb2aa]">{label}</span>
      {children}
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2">
        <input type="color" value={value} onChange={event => onChange(event.target.value)} className="h-8 w-9 rounded-lg border-0 bg-transparent" />
        <input value={value} onChange={event => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
      </div>
    </Field>
  )
}

function LoadingStudio() {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(420px,1fr)_360px]">
      {[0, 1, 2].map(item => (
        <div key={item} className="h-[620px] animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04]" />
      ))}
    </div>
  )
}

function getBlock(design: TotemDesign, type: TotemBlock['type']): TotemBlock | undefined {
  return design.blocks.find(block => block.type === type)
}

function createBlock(type: TotemBlock['type']): TotemBlock {
  const labels: Record<TotemBlock['type'], string> = {
    hero: 'Bem-vindo',
    cta: 'Atendimento',
    carousel: 'Galeria',
    banner: 'Aviso',
    amenities: 'Durante sua estadia',
    video: 'Vídeo de fundo',
    footer: 'Recepção disponível 24h',
    language: 'Idiomas',
  }
  return {
    id: `${type}-${Date.now()}`,
    type,
    visible: true,
    title: labels[type],
    subtitle: type === 'hero' ? 'Toque para começar' : '',
    alignment: 'left',
    variant: type === 'hero' ? 'attract' : 'default',
    overlay: 42,
    items: type === 'amenities' ? ['Wi-Fi', 'Restaurante', 'Recepção 24h'] : [],
  }
}

function normalizeDesign(value: TotemDesign): TotemDesign {
  return {
    ...EMPTY_DESIGN,
    ...value,
    theme: { ...EMPTY_DESIGN.theme, ...(value.theme ?? {}) },
    layout: { ...EMPTY_DESIGN.layout, ...(value.layout ?? {}) },
    blocks: ensureCoreBlocks(Array.isArray(value.blocks) && value.blocks.length > 0 ? value.blocks : EMPTY_DESIGN.blocks),
  }
}

function ensureCoreBlocks(blocks: TotemBlock[]): TotemBlock[] {
  return (['hero', 'video', 'cta', 'language', 'footer'] as TotemBlock['type'][]).reduce((current, type) => {
    if (current.some(block => block.type === type)) return current
    return [...current, createBlock(type)]
  }, blocks)
}

function mergePresetBlocks(currentBlocks: TotemBlock[], presetBlocks: TotemBlock[]): TotemBlock[] {
  const currentHero = currentBlocks.find(block => block.type === 'hero')
  const currentVideo = currentBlocks.find(block => block.type === 'video')
  const currentFooter = currentBlocks.find(block => block.type === 'footer')
  return ensureCoreBlocks(presetBlocks).map(block => {
    if (block.type === 'hero' && currentHero) return { ...block, title: currentHero.title, subtitle: currentHero.subtitle, imageUrl: currentHero.imageUrl, overlay: currentHero.overlay }
    if (block.type === 'video' && currentVideo) return { ...block, videoUrl: currentVideo.videoUrl }
    if (block.type === 'footer' && currentFooter) return { ...block, title: currentFooter.title, subtitle: currentFooter.subtitle }
    return block
  })
}

function cloneDesign(value: TotemDesign): TotemDesign {
  return JSON.parse(JSON.stringify(value))
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
