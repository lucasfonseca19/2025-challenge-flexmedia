import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowDown,
  ArrowUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  CloudArrowUp,
  Copy,
  DotsSixVertical,
  ImageSquare,
  Monitor,
  Palette,
  Pause,
  PencilSimple,
  Play,
  Plus,
  SlidersHorizontal,
  Trash,
} from '@phosphor-icons/react'
import { hotelService, totemDesignService, totemMediaService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { FONTS } from '../constants/fonts'
import type { TotemBlock, TotemCarouselSpeed, TotemContentItem, TotemDesign, TotemMediaAsset } from '../types'
import TotemDesignRenderer, { TotemFlowPreview, type TotemPreviewScreen } from '../components/TotemDesignRenderer'

const PREVIEW_SCREENS: Array<{ id: TotemPreviewScreen; label: string; kind: 'idle' | 'flow' }> = [
  { id: 'idle', label: 'Tela inicial', kind: 'idle' },
  { id: 'actions', label: 'Escolha', kind: 'flow' },
  { id: 'search', label: 'Busca', kind: 'flow' },
  { id: 'confirm', label: 'Confirmação', kind: 'flow' },
  { id: 'facial', label: 'Biometria', kind: 'flow' },
  { id: 'key', label: 'Chave', kind: 'flow' },
  { id: 'checkout', label: 'Check-out', kind: 'flow' },
]

const CONTENT_LANGUAGES = ['pt', 'en', 'es'] as const
type ContentLanguage = typeof CONTENT_LANGUAGES[number]

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
    { id: 'hotel-content', type: 'carousel', visible: true, title: 'Conteúdos do hotel', speed: 50, contentItems: [] },
    { id: 'actions', type: 'cta', visible: true, title: 'Atendimento', subtitle: 'Check-in e check-out', variant: 'dual' },
    { id: 'language', type: 'language', visible: true, title: 'Idiomas' },
    { id: 'footer', type: 'footer', visible: true, title: '' },
  ],
}



export default function ContentPage() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.role === 'ADMIN'
  const [hotelId, setHotelId] = useState(usuario?.hotelId ?? 1)
  const [hoteis, setHoteis] = useState<{ id: number; nome: string }[]>([])
  const [presets, setPresets] = useState<TotemDesign[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const [isNewPreset, setIsNewPreset] = useState(false)
  const [designName, setDesignName] = useState('')
  const [design, setDesign] = useState<TotemDesign>(EMPTY_DESIGN)
  const [midias, setMidias] = useState<TotemMediaAsset[]>([])
  const [previewScreen, setPreviewScreen] = useState<TotemPreviewScreen>('idle')
  const [previewCarouselPaused, setPreviewCarouselPaused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const heroBlock = getBlock(design, 'hero')
  const videoBlock = getBlock(design, 'video')
  const carouselBlock = getBlock(design, 'carousel')
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
      const [savedPresets, assets] = await Promise.all([
        totemDesignService.listar(hotelId),
        totemMediaService.listar(hotelId),
      ])
      setPresets(savedPresets)
      setIsNewPreset(false)
      const firstPreset = savedPresets[0]
      setSelectedPresetId(firstPreset?.id ?? null)
      setDesignName(firstPreset?.nome ?? '')
      setDesign(firstPreset ? normalizeDesign(firstPreset) : EMPTY_DESIGN)
      setMidias(assets)
    } catch {
      setPresets([])
      setSelectedPresetId(null)
      setIsNewPreset(false)
      setDesignName('')
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

  async function salvarPreset(nextDesign = design) {
    if (!designName.trim()) {
      setError('Informe um nome para o design.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const saved = await totemDesignService.salvar(hotelId, {
        ...nextDesign,
        id: selectedPresetId ?? undefined,
        nome: designName.trim(),
      })
      setDesign(normalizeDesign(saved))
      setDesignName(saved.nome ?? designName.trim())
      setSelectedPresetId(saved.id ?? null)
      setIsNewPreset(false)
      setPresets(current => [
        saved,
        ...current.filter(preset => preset.id !== saved.id),
      ])
      setMessage('Design salvo.')
    } catch {
      setError('Não foi possível salvar o design.')
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

  async function uploadForContentItem(itemId: string, file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const asset = await totemMediaService.upload(hotelId, file)
      setMidias(current => [asset, ...current.filter(item => item.publicUrl !== asset.publicUrl)])
      patchContentItem(itemId, {
        mediaUrl: asset.publicUrl,
        mediaType: asset.mimeType.startsWith('video/') ? 'video' : 'image',
      })
      setMessage('Mídia do conteúdo atualizada.')
    } catch {
      setError('Arquivo inválido ou acima do limite permitido.')
    } finally {
      setUploading(false)
    }
  }

  function selectPreset(preset: TotemDesign) {
    setIsNewPreset(false)
    setSelectedPresetId(preset.id ?? null)
    setDesignName(preset.nome ?? '')
    setDesign(normalizeDesign(preset))
    setMessage(`Preset "${preset.nome ?? `Design ${preset.id}`}" carregado.`)
  }

  function duplicatePreset(preset: TotemDesign) {
    const copy = normalizeDesign({ ...preset, id: undefined, hotelId: undefined, createdAt: undefined, updatedAt: undefined })
    const theme = { ...copy.theme }
    const layout = { ...copy.layout }
    const blocks = copy.blocks.map(b => ({ ...b, id: `${b.type}-${Date.now()}` }))
    const carousel = blocks.find(b => b.type === 'carousel')
    if (carousel?.contentItems) {
      carousel.contentItems = carousel.contentItems.map(item => ({
        ...item,
        id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }))
    }
    setIsNewPreset(false)
    setSelectedPresetId(null)
    setDesignName(`${preset.nome ?? `Design ${preset.id}`} cópia`)
    setDesign({ ...copy, theme, layout, blocks })
    setMessage('Cópia pronta para salvar como novo preset.')
  }

  function createNewPreset() {
    setIsNewPreset(true)
    setSelectedPresetId(null)
    setDesignName('')
    setDesign(EMPTY_DESIGN)
    setMessage(null)
    setTimeout(() => {
      const input = document.getElementById('new-preset-name') as HTMLInputElement | null
      input?.focus()
    }, 50)
  }

  async function renamePreset(preset: TotemDesign, newName: string) {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const saved = await totemDesignService.salvar(hotelId, {
        ...preset,
        id: preset.id,
        nome: newName.trim(),
      })
      setPresets(current => current.map(p => p.id === saved.id ? saved : p))
      if (selectedPresetId === saved.id) {
        setDesignName(saved.nome ?? '')
      }
      setMessage('Preset renomeado.')
    } catch {
      setError('Não foi possível renomear o preset.')
    } finally {
      setSaving(false)
    }
  }

  function updateTheme<K extends keyof TotemDesign['theme']>(key: K, value: TotemDesign['theme'][K]) {
    setDesign(current => ({ ...current, theme: { ...current.theme, [key]: value } }))
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

  function updateCarouselSpeed(speed: TotemCarouselSpeed) {
    upsertBlock('carousel', { speed, visible: true })
  }

  function addContentItem() {
    upsertBlock('carousel', {
      visible: true,
      speed: carouselBlock?.speed ?? 50,
      contentItems: [...getContentItems(carouselBlock), createContentItem()],
    })
  }

  function patchContentItem(itemId: string, patch: Partial<TotemContentItem>) {
    upsertBlock('carousel', {
      visible: true,
      contentItems: getContentItems(carouselBlock).map(item => item.id === itemId ? { ...item, ...patch } : item),
    })
  }

  function removeContentItem(itemId: string) {
    upsertBlock('carousel', {
      visible: true,
      contentItems: getContentItems(carouselBlock).filter(item => item.id !== itemId),
    })
  }

  function moveContentItem(itemId: string, offset: -1 | 1) {
    const items = getContentItems(carouselBlock)
    const index = items.findIndex(item => item.id === itemId)
    const nextIndex = index + offset
    if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(nextIndex, 0, item)
    upsertBlock('carousel', { visible: true, contentItems: next })
  }

  function reorderContentItems(activeId: string, overId: string) {
    const items = getContentItems(carouselBlock)
    const oldIndex = items.findIndex(item => item.id === activeId)
    const newIndex = items.findIndex(item => item.id === overId)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
    upsertBlock('carousel', { visible: true, contentItems: arrayMove(items, oldIndex, newIndex) })
  }

  function goPreview(offset: number) {
    const nextIndex = (screenIndex + offset + PREVIEW_SCREENS.length) % PREVIEW_SCREENS.length
    setPreviewScreen(PREVIEW_SCREENS[nextIndex].id)
  }

  return (
    <div className="min-h-full bg-[#101513] p-4 text-[#eef3ef] md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-[#9eb2aa]">Totem Studio</p>
            <h1 className="mt-2 text-4xl font-semibold leading-none text-[#f5fbf7] md:text-5xl">
              Presets do autoatendimento
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aabbb4]">
              Crie designs nomeados para atribuir a cada dispositivo na tela de Totens.
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
              onClick={() => salvarPreset()}
              disabled={saving || loading}
              className="h-11 rounded-xl bg-[#d7fbe8] px-4 text-sm font-semibold text-[#10201d] hover:bg-[#c1f1d8] disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </header>

        {(message || error) && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-[#d7fbe8]/30 bg-[#d7fbe8]/10 text-[#d8fff4]'}`}>
            {error ?? message}
          </div>
        )}

        {loading ? (
          <LoadingStudio />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(420px,1fr)_360px]">
            <aside className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              <GlobalDesignPanel
                design={design}
                designName={designName}
                isNewPreset={isNewPreset}
                presets={presets}
                selectedPresetId={selectedPresetId}
                onDesignNameChange={setDesignName}
                onSelectPreset={selectPreset}
                onCreateNew={createNewPreset}
                onDuplicate={duplicatePreset}
                onRename={renamePreset}
                onThemeChange={updateTheme}
              />
            </aside>

            <main className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <PanelTitle icon={<ImageSquare size={19} />} title="Preview do totem" />
                <div className="flex items-center gap-3">
                  {previewScreen === 'idle' && (
                    <button
                      type="button"
                      onClick={() => setPreviewCarouselPaused(current => !current)}
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 text-xs font-semibold text-[#d8fff4] transition-colors hover:bg-white/12"
                      aria-label={previewCarouselPaused ? 'Retomar carrossel' : 'Pausar carrossel'}
                    >
                      {previewCarouselPaused ? <Play size={15} weight="fill" /> : <Pause size={15} weight="fill" />}
                      {previewCarouselPaused ? 'Play' : 'Pause'}
                    </button>
                  )}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{currentScreen.label}</p>
                    <p className="text-xs text-[#9eb2aa]">Portrait 9:16</p>
                  </div>
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
                    ? (
                        <TotemDesignRenderer
                          design={design}
                          carouselPaused={previewCarouselPaused}
                        />
                      )
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
              <ScreenContentPanel
                screen={currentScreen}
                heroBlock={heroBlock}
                videoBlock={videoBlock}
                carouselBlock={carouselBlock}
                midias={midias}
                uploading={uploading}
                onHeroChange={patch => upsertBlock('hero', patch)}
                onCarouselSpeedChange={updateCarouselSpeed}
                onAddContentItem={addContentItem}
                onContentItemChange={patchContentItem}
                onRemoveContentItem={removeContentItem}
                onMoveContentItem={moveContentItem}
                onReorderContentItems={reorderContentItems}
                onUploadContentMedia={uploadForContentItem}
                onUploadImage={file => uploadForBlock(file, 'hero', 'image')}
                onUploadVideo={file => uploadForBlock(file, 'video', 'video')}
                onClearImage={() => upsertBlock('hero', { imageUrl: undefined })}
                onClearVideo={() => upsertBlock('video', { videoUrl: undefined })}
              />
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function GlobalDesignPanel({
  design,
  designName,
  isNewPreset,
  presets,
  selectedPresetId,
  onDesignNameChange,
  onSelectPreset,
  onCreateNew,
  onDuplicate,
  onRename,
  onThemeChange,
}: {
  design: TotemDesign
  designName: string
  isNewPreset: boolean
  presets: TotemDesign[]
  selectedPresetId: number | null
  onDesignNameChange: (value: string) => void
  onSelectPreset: (preset: TotemDesign) => void
  onCreateNew: () => void
  onDuplicate: (preset: TotemDesign) => void
  onRename: (preset: TotemDesign, newName: string) => void
  onThemeChange: <K extends keyof TotemDesign['theme']>(key: K, value: TotemDesign['theme'][K]) => void
}) {
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')

  function startRenaming(preset: TotemDesign) {
    setRenamingId(preset.id ?? null)
    setRenameValue(preset.nome ?? '')
  }

  function confirmRename(preset: TotemDesign) {
    if (renameValue.trim() && renameValue.trim() !== (preset.nome ?? '')) {
      onRename(preset, renameValue.trim())
    }
    setRenamingId(null)
    setRenameValue('')
  }

  return (
    <>
      <PanelTitle icon={<SlidersHorizontal size={19} />} title="Presets salvos" />

      <button
        onClick={onCreateNew}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d7fbe8]/40 bg-[#d7fbe8]/8 px-4 py-3 text-sm font-semibold text-[#d8fff4] transition-colors hover:bg-[#d7fbe8]/15"
      >
        <Plus size={16} weight="bold" />
        Novo preset
      </button>

      <div className="space-y-2">
        {isNewPreset && (
          <div className="w-full rounded-2xl border-2 border-dashed border-[#d7fbe8]/50 bg-[#d7fbe8]/10 p-4">
            <input
              id="new-preset-name"
              value={designName}
              onChange={event => onDesignNameChange(event.target.value)}
              placeholder="Nome do novo preset"
              className="w-full rounded-lg border border-[#d7fbe8]/40 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-[#d7fbe8]"
            />
          </div>
        )}

        {presets.length === 0 && !isNewPreset && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-[#9eb2aa]">
            Nenhum preset salvo ainda. Clique em Novo preset para criar o primeiro.
          </div>
        )}

        {presets.map(preset => (
          <div
            key={preset.id}
            className={`w-full rounded-2xl border p-3 text-left ${selectedPresetId === preset.id && !isNewPreset ? 'border-[#d7fbe8]/55 bg-[#d7fbe8]/10' : 'border-white/10 bg-white/[0.04] hover:border-[#d7fbe8]/40 hover:bg-white/[0.07]'}`}
          >
            {renamingId === preset.id ? (
              <div className="flex items-center gap-2">
                <input
                  value={renameValue}
                  onChange={event => setRenameValue(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') confirmRename(preset)
                    if (event.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-[#d7fbe8]/40 bg-white/10 px-2 py-1 text-sm text-white outline-none focus:border-[#d7fbe8]"
                  autoFocus
                />
                <button
                  onClick={() => confirmRename(preset)}
                  className="shrink-0 rounded-lg bg-[#d7fbe8]/20 px-2 py-1 text-xs font-semibold text-[#d8fff4] hover:bg-[#d7fbe8]/30"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectPreset(preset)}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-white"
                >
                  {preset.nome ?? `Design ${preset.id}`}
                </button>
                <button
                  onClick={() => startRenaming(preset)}
                  className="shrink-0 rounded-lg p-1.5 text-[#9eb2aa] transition-colors hover:bg-white/10 hover:text-white"
                  title="Renomear"
                >
                  <PencilSimple size={14} />
                </button>
                <button
                  onClick={() => onDuplicate(preset)}
                  className="shrink-0 rounded-lg p-1.5 text-[#9eb2aa] transition-colors hover:bg-white/10 hover:text-white"
                  title="Duplicar"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>
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
      </div>
    </>
  )
}

function ScreenContentPanel({
  screen,
  heroBlock,
  videoBlock,
  carouselBlock,
  midias,
  uploading,
  onHeroChange,
  onCarouselSpeedChange,
  onAddContentItem,
  onContentItemChange,
  onRemoveContentItem,
  onMoveContentItem,
  onReorderContentItems,
  onUploadContentMedia,
  onUploadImage,
  onUploadVideo,
  onClearImage,
  onClearVideo,
}: {
  screen: { id: TotemPreviewScreen; label: string; kind: 'idle' | 'flow' }
  heroBlock?: TotemBlock
  videoBlock?: TotemBlock
  carouselBlock?: TotemBlock
  midias: TotemMediaAsset[]
  uploading: boolean
  onHeroChange: (patch: Partial<TotemBlock>) => void
  onCarouselSpeedChange: (speed: TotemCarouselSpeed) => void
  onAddContentItem: () => void
  onContentItemChange: (itemId: string, patch: Partial<TotemContentItem>) => void
  onRemoveContentItem: (itemId: string) => void
  onMoveContentItem: (itemId: string, offset: -1 | 1) => void
  onReorderContentItems: (activeId: string, overId: string) => void
  onUploadContentMedia: (itemId: string, file: File | undefined) => void
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
      <ContentCarouselPanel
        block={carouselBlock}
        uploading={uploading}
        onSpeedChange={onCarouselSpeedChange}
        onAdd={onAddContentItem}
        onChange={onContentItemChange}
        onRemove={onRemoveContentItem}
        onMove={onMoveContentItem}
        onReorder={onReorderContentItems}
        onUploadMedia={onUploadContentMedia}
      />
    </div>
  )
}

function ContentCarouselPanel({ block, uploading, onSpeedChange, onAdd, onChange, onRemove, onMove, onReorder, onUploadMedia }: {
  block?: TotemBlock
  uploading: boolean
  onSpeedChange: (speed: TotemCarouselSpeed) => void
  onAdd: () => void
  onChange: (itemId: string, patch: Partial<TotemContentItem>) => void
  onRemove: (itemId: string) => void
  onMove: (itemId: string, offset: -1 | 1) => void
  onReorder: (activeId: string, overId: string) => void
  onUploadMedia: (itemId: string, file: File | undefined) => void
}) {
  const items = getContentItems(block)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpanded(itemId: string) {
    setExpandedIds(current => {
      const next = new Set(current)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : ''
    if (overId) onReorder(activeId, overId)
  }

  return (
    <section className="border-t border-white/10 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <PanelTitle icon={<ImageSquare size={19} />} title="Conteúdo em destaque" />
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-[#d7fbe8] px-3 text-xs font-semibold text-[#10201d] hover:bg-[#c1f1d8]"
        >
          <Plus size={14} weight="bold" />
          Adicionar
        </button>
      </div>

      <Field label="Velocidade do carrossel">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="mb-2 flex items-center justify-between text-lg" aria-hidden="true">
            <span title="Mais lento">🐢</span>
            <span className="text-xs font-semibold text-[#9eb2aa]">{getSpeedLabel(block?.speed)}</span>
            <span title="Mais rápido">🐇</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={getSpeedSliderValue(block?.speed)}
            onChange={event => onSpeedChange(Number(event.target.value))}
            className="w-full accent-[#d7fbe8]"
            aria-label="Velocidade do carrossel"
          />
        </div>
      </Field>

      {items.length > 0 && (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableContentItem
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  expanded={expandedIds.has(item.id)}
                  uploading={uploading}
                  onToggle={() => toggleExpanded(item.id)}
                  onChange={patch => onChange(item.id, patch)}
                  onRemove={() => onRemove(item.id)}
                  onMove={offset => onMove(item.id, offset)}
                  onUploadMedia={file => onUploadMedia(item.id, file)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  )
}

function SortableContentItem({
  item,
  index,
  total,
  expanded,
  uploading,
  onToggle,
  onChange,
  onRemove,
  onMove,
  onUploadMedia,
}: {
  item: TotemContentItem
  index: number
  total: number
  expanded: boolean
  uploading: boolean
  onToggle: () => void
  onChange: (patch: Partial<TotemContentItem>) => void
  onRemove: () => void
  onMove: (offset: -1 | 1) => void
  onUploadMedia: (file: File | undefined) => void
}) {
  const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>('pt')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const label = getContentItemLabel(item)
  const languageText = getContentItemText(item, activeLanguage)
  const languageLabels: Record<ContentLanguage, string> = { pt: 'PT', en: 'EN', es: 'ES' }

  function updateLanguageText(value: string) {
    const texts = { ...getContentItemTexts(item), [activeLanguage]: value }
    onChange({
      texts,
      text: activeLanguage === 'pt' ? value : texts.pt || item.text || 'VAZIO',
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 ${isDragging ? 'relative z-20 shadow-[0_24px_70px_-45px_rgba(0,0,0,0.95)]' : ''}`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl bg-white/8 text-[#9eb2aa] active:cursor-grabbing"
          aria-label="Arrastar para ordenar"
          {...attributes}
          {...listeners}
        >
          <DotsSixVertical size={18} weight="bold" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-white/[0.04]"
          aria-expanded={expanded}
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{label}</span>
            <span className="mt-0.5 block text-xs text-[#9eb2aa]">{item.mediaUrl ? 'com mídia' : 'sem mídia'}</span>
          </span>
          <CaretDown size={16} className={`shrink-0 text-[#9eb2aa] transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Subir" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp size={14} /></IconButton>
          <IconButton label="Descer" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown size={14} /></IconButton>
          <IconButton label="Remover" onClick={onRemove}><Trash size={14} /></IconButton>
        </div>
      </div>

      {expanded && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Fundo do card"
              value={item.backgroundColor ?? '#1d342b'}
              onChange={value => onChange({ backgroundColor: value })}
            />
            <Field label="Alinhamento">
              <select
                value={item.textPosition ?? 'center'}
                onChange={event => onChange({ textPosition: event.target.value as TotemContentItem['textPosition'] })}
                className="studio-input"
              >
                <option value="top">Topo</option>
                <option value="center">Centro</option>
                <option value="bottom">Inferior</option>
              </select>
            </Field>
          </div>

          <div className="overflow-hidden rounded-xl bg-black/20">
            {item.mediaUrl ? (
              item.mediaType === 'video' ? (
                <video src={item.mediaUrl} className="h-28 w-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <img src={item.mediaUrl} alt="" className="h-28 w-full object-cover" />
              )
            ) : (
              <div className="flex h-24 flex-col items-center justify-center text-center text-xs text-[#9eb2aa]">
                <CloudArrowUp size={22} weight="duotone" />
                <span className="mt-1">Mídia opcional</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#d7fbe8]/35 bg-[#d7fbe8]/8 px-3 py-2 text-xs font-semibold text-[#d8fff4] hover:bg-[#d7fbe8]/12">
              <CloudArrowUp className="mr-2" size={16} />
              {uploading ? 'Enviando...' : item.mediaUrl ? 'Substituir mídia' : 'Adicionar mídia'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                className="hidden"
                disabled={uploading}
                onChange={event => {
                  onUploadMedia(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </label>
            {item.mediaUrl && (
              <button
                type="button"
                onClick={() => onChange({ mediaUrl: undefined, mediaType: undefined })}
                className="rounded-xl bg-white/8 px-3 py-2 text-xs font-semibold text-[#d8fff4] hover:bg-white/12"
              >
                Remover
              </button>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-1">
            {CONTENT_LANGUAGES.map(lang => {
              const missing = getContentItemText(item, lang).trim().length === 0
              const selected = activeLanguage === lang
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLanguage(lang)}
                  className={`relative h-9 flex-1 rounded-lg text-xs font-bold transition-colors ${
                    selected ? 'bg-[#d7fbe8] text-[#10201d]' : 'text-[#d8fff4] hover:bg-white/8'
                  }`}
                  aria-pressed={selected}
                >
                  {languageLabels[lang]}
                  {missing && (
                    <span
                      className="absolute right-2 top-1.5 h-2 w-2 rounded-full bg-[#ff5b5b] shadow-[0_0_0_2px_rgba(16,21,19,0.95)]"
                      aria-label={`${languageLabels[lang]} sem texto`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <Field label={`Texto ${languageLabels[activeLanguage]}`}>
            <textarea
              value={languageText}
              maxLength={120}
              onChange={event => updateLanguageText(event.target.value)}
              className="studio-input min-h-24 resize-none text-base leading-6"
              placeholder="VAZIO"
            />
          </Field>
        </div>
      )}
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

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-[#d8fff4] hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
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
    carousel: 'Conteúdos do hotel',
    banner: 'Aviso',
    amenities: 'Durante sua estadia',
    video: 'Vídeo de fundo',
    footer: 'Rodapé',
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
    contentItems: type === 'carousel' ? [] : undefined,
    speed: type === 'carousel' ? 50 : undefined,
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
  return (['hero', 'video', 'carousel', 'cta', 'language'] as TotemBlock['type'][]).reduce((current, type) => {
    if (current.some(block => block.type === type)) return current
    return [...current, createBlock(type)]
  }, blocks)
}



function createContentItem(): TotemContentItem {
  return {
    id: `content-${Date.now()}`,
    text: 'VAZIO',
    texts: { pt: 'VAZIO', en: '', es: '' },
    backgroundColor: '#1d342b',
    textPosition: 'center',
    active: true,
  }
}

function getContentItems(block?: TotemBlock): TotemContentItem[] {
  return Array.isArray(block?.contentItems) ? block.contentItems : []
}

function getContentItemTexts(item: TotemContentItem): Record<ContentLanguage, string> {
  return {
    pt: item.text ?? '',
    en: '',
    es: '',
    ...(item.texts ?? {}),
  }
}

function getContentItemText(item: TotemContentItem, language: ContentLanguage): string {
  return getContentItemTexts(item)[language] ?? ''
}

function getContentItemLabel(item: TotemContentItem): string {
  const texts = getContentItemTexts(item)
  return CONTENT_LANGUAGES.map(language => texts[language]?.trim()).find(Boolean) || 'VAZIO'
}

function getSpeedSliderValue(speed?: TotemCarouselSpeed): number {
  if (typeof speed === 'number') return Math.min(100, Math.max(0, speed))
  if (speed === 'slow') return 0
  if (speed === 'fast') return 100
  return 50
}

function getSpeedLabel(speed?: TotemCarouselSpeed): string {
  const value = getSpeedSliderValue(speed)
  if (value < 34) return 'Calma'
  if (value > 66) return 'Rápida'
  return 'Natural'
}



function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
