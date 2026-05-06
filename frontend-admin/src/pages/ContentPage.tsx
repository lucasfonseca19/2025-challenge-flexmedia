import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowsOutCardinal,
  Check,
  CloudArrowUp,
  Eye,
  EyeSlash,
  ImageSquare,
  Layout,
  Palette,
  Plus,
  Rows,
  Trash,
} from '@phosphor-icons/react'
import { hotelService, totemDesignService, totemMediaService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { TotemBlock, TotemBlockType, TotemDesign, TotemMediaAsset } from '../types'
import TotemDesignRenderer from '../components/TotemDesignRenderer'

const BLOCK_LABELS: Record<TotemBlockType, string> = {
  hero: 'Capa',
  cta: 'Ações',
  carousel: 'Galeria',
  banner: 'Banner',
  amenities: 'Amenidades',
  video: 'Vídeo',
  footer: 'Rodapé',
  language: 'Idiomas',
}

const EMPTY_DESIGN: TotemDesign = {
  theme: {
    brandName: 'CheckIn Hub',
    primaryColor: '#0f766e',
    backgroundColor: '#f8fafc',
    textColor: '#10201d',
    surfaceColor: '#ffffff',
    fontFamily: 'Satoshi',
  },
  layout: {
    template: 'lobby-elegante',
    density: 'comfortable',
    screen: 'portrait',
  },
  blocks: [
    { id: 'hero', type: 'hero', visible: true, title: 'Boas-vindas', subtitle: 'Toque para iniciar seu atendimento', alignment: 'left', variant: 'imageSplit', overlay: 28 },
    { id: 'actions', type: 'cta', visible: true, title: 'Comece por aqui', subtitle: 'Check-in e check-out em poucos passos', variant: 'dual' },
    { id: 'amenities', type: 'amenities', visible: true, title: 'Durante sua estadia', items: ['Wi-Fi de alta velocidade', 'Restaurante aberto até 23h', 'Equipe disponível 24h'], variant: 'tiles' },
    { id: 'footer', type: 'footer', visible: true, title: 'CheckIn Hub', subtitle: 'Bem-vindo, Welcome, Bienvenido' },
  ],
}

const TEMPLATES: Array<{ id: string; name: string; description: string; design: TotemDesign }> = [
  {
    id: 'lobby-elegante',
    name: 'Lobby elegante',
    description: 'Visual limpo, acolhedor e ideal para hotéis urbanos.',
    design: EMPTY_DESIGN,
  },
  {
    id: 'resort-visual',
    name: 'Resort visual',
    description: 'Mais imagem, mais respiro e chamadas promocionais.',
    design: {
      ...EMPTY_DESIGN,
      theme: { ...EMPTY_DESIGN.theme, primaryColor: '#0e7490', backgroundColor: '#eef8f7', textColor: '#10212a' },
      layout: { template: 'resort-visual', density: 'spacious', screen: 'portrait' },
      blocks: [
        { id: 'hero', type: 'hero', visible: true, title: 'Sua estadia começa aqui', subtitle: 'Check-in rápido para aproveitar melhor o hotel', alignment: 'left', variant: 'immersive', overlay: 34 },
        { id: 'carousel', type: 'carousel', visible: true, title: 'Experiências do hotel', items: ['Piscina aquecida', 'Spa com reserva na recepção', 'Café da manhã até 10h30'] },
        { id: 'actions', type: 'cta', visible: true, title: 'Autoatendimento', subtitle: 'Escolha o fluxo desejado', variant: 'dual' },
        { id: 'footer', type: 'footer', visible: true, title: 'Equipe disponível 24h', subtitle: 'Procure a recepção para solicitações especiais' },
      ],
    },
  },
  {
    id: 'executivo-compacto',
    name: 'Executivo compacto',
    description: 'Interface objetiva para alto volume de hóspedes.',
    design: {
      ...EMPTY_DESIGN,
      theme: { ...EMPTY_DESIGN.theme, primaryColor: '#475569', backgroundColor: '#f4f7f5', textColor: '#111827' },
      layout: { template: 'executivo-compacto', density: 'compact', screen: 'portrait' },
      blocks: [
        { id: 'hero', type: 'hero', visible: true, title: 'Check-in digital', subtitle: 'Toque para começar', alignment: 'left', variant: 'minimal', overlay: 20 },
        { id: 'actions', type: 'cta', visible: true, title: 'Atendimento', subtitle: 'Processo seguro e rápido', variant: 'dual' },
        { id: 'language', type: 'language', visible: true, title: 'Idiomas' },
        { id: 'footer', type: 'footer', visible: true, title: 'CheckIn Hub', subtitle: 'Totem de autoatendimento' },
      ],
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
  const [selectedBlockId, setSelectedBlockId] = useState('hero')
  const [tab, setTab] = useState<'design' | 'media' | 'publish'>('design')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const selectedBlock = design.blocks.find(block => block.id === selectedBlockId) ?? design.blocks[0]

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
      setSelectedBlockId((draft.blocks?.[0]?.id as string | undefined) ?? 'hero')
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

  async function upload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const asset = await totemMediaService.upload(hotelId, file)
      setMidias(current => [asset, ...current])
      setMessage('Mídia adicionada à biblioteca.')
    } catch {
      setError('Arquivo inválido ou acima do limite permitido.')
    } finally {
      setUploading(false)
    }
  }

  async function removerMidia(assetId: number) {
    setError(null)
    try {
      await totemMediaService.remover(hotelId, assetId)
      setMidias(current => current.filter(asset => asset.id !== assetId))
      setMessage('Mídia removida.')
    } catch {
      setError('Não foi possível remover a mídia.')
    }
  }

  function applyTemplate(template: TotemDesign) {
    const next = cloneDesign(template)
    setDesign(next)
    setSelectedBlockId(next.blocks[0]?.id ?? 'hero')
    setMessage('Template aplicado ao rascunho.')
  }

  function updateTheme<K extends keyof TotemDesign['theme']>(key: K, value: TotemDesign['theme'][K]) {
    setDesign(current => ({ ...current, theme: { ...current.theme, [key]: value } }))
  }

  function updateLayout<K extends keyof TotemDesign['layout']>(key: K, value: TotemDesign['layout'][K]) {
    setDesign(current => ({ ...current, layout: { ...current.layout, [key]: value } }))
  }

  function updateBlock(id: string, patch: Partial<TotemBlock>) {
    setDesign(current => ({
      ...current,
      blocks: current.blocks.map(block => block.id === id ? { ...block, ...patch } : block),
    }))
  }

  function addBlock(type: TotemBlockType) {
    const block = createBlock(type)
    setDesign(current => ({ ...current, blocks: [...current.blocks, block] }))
    setSelectedBlockId(block.id)
  }

  function removeBlock(id: string) {
    setDesign(current => {
      const blocks = current.blocks.filter(block => block.id !== id)
      setSelectedBlockId(blocks[0]?.id ?? '')
      return { ...current, blocks }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDesign(current => {
      const oldIndex = current.blocks.findIndex(block => block.id === active.id)
      const newIndex = current.blocks.findIndex(block => block.id === over.id)
      return { ...current, blocks: arrayMove(current.blocks, oldIndex, newIndex) }
    })
  }

  const blockIds = useMemo(() => design.blocks.map(block => block.id), [design.blocks])

  return (
    <div className="min-h-full bg-[#101513] p-4 text-[#eef3ef] md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 grid gap-5 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-medium text-[#9eb2aa]">Totem Studio</p>
            <h1 className="mt-2 text-4xl font-semibold leading-none text-[#f5fbf7] md:text-5xl">
              Personalização visual do autoatendimento
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aabbb4]">
              Monte o idle screen do hotel com blocos guiados, biblioteca de mídia, templates e publicação controlada.
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
          {(['design', 'media', 'publish'] as const).map(nextTab => (
            <button
              key={nextTab}
              onClick={() => setTab(nextTab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === nextTab ? 'bg-[#d7fbe8] text-[#10201d]' : 'bg-white/8 text-[#aabbb4] hover:bg-white/12 hover:text-white'}`}
            >
              {nextTab === 'design' ? 'Design' : nextTab === 'media' ? 'Mídia' : 'Publicação'}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingStudio />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[360px_minmax(420px,1fr)_360px]">
            <aside className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              {tab === 'design' && (
                <>
                  <PanelTitle icon={<Layout size={19} />} title="Templates" />
                  <div className="space-y-2">
                    {TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.design)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left hover:border-[#d7fbe8]/40 hover:bg-white/[0.07]"
                      >
                        <span className="text-sm font-semibold text-white">{template.name}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#9eb2aa]">{template.description}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <PanelTitle icon={<Rows size={19} />} title="Blocos" />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {design.blocks.map(block => (
                            <SortableBlock
                              key={block.id}
                              block={block}
                              selected={block.id === selectedBlockId}
                              onSelect={() => setSelectedBlockId(block.id)}
                              onToggle={() => updateBlock(block.id, { visible: !block.visible })}
                              onRemove={() => removeBlock(block.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {(['hero', 'banner', 'carousel', 'amenities', 'video', 'language'] as TotemBlockType[]).map(type => (
                        <button key={type} onClick={() => addBlock(type)} className="rounded-xl bg-white/8 px-3 py-2 text-xs font-semibold text-[#d8fff4] hover:bg-white/12">
                          <Plus className="mr-1 inline" size={13} /> {BLOCK_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {tab === 'media' && (
                <MediaPanel
                  midias={midias}
                  uploading={uploading}
                  onUpload={upload}
                  onRemove={removerMidia}
                  onUse={asset => selectedBlock && updateBlock(selectedBlock.id, asset.mimeType.startsWith('video') ? { videoUrl: asset.publicUrl } : { imageUrl: asset.publicUrl })}
                />
              )}

              {tab === 'publish' && (
                <PublishPanel design={design} onSave={() => salvarDraft()} onPublish={publicar} saving={saving} />
              )}
            </aside>

            <main className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              <div className="mb-4 flex items-center justify-between">
                <PanelTitle icon={<ImageSquare size={19} />} title="Preview do totem" />
                <span className="rounded-lg bg-white/8 px-3 py-1 text-xs text-[#9eb2aa]">Portrait 9:16</span>
              </div>
              <div className="mx-auto aspect-[9/16] max-h-[780px] overflow-hidden rounded-[2rem] border border-white/10 bg-black p-2 shadow-[0_30px_100px_-60px_rgba(0,0,0,1)]">
                <TotemDesignRenderer design={design} />
              </div>
            </main>

            <aside className="rounded-[1.5rem] border border-white/10 bg-[#151d19] p-4 shadow-[0_20px_70px_-45px_rgba(0,0,0,0.85)]">
              <PanelTitle icon={<Palette size={19} />} title="Propriedades" />
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  midias={midias}
                  onChange={patch => updateBlock(selectedBlock.id, patch)}
                />
              ) : (
                <p className="text-sm text-[#9eb2aa]">Selecione ou adicione um bloco para editar.</p>
              )}

              <div className="mt-6 border-t border-white/10 pt-5">
                <PanelTitle icon={<Palette size={19} />} title="Marca e layout" />
                <Field label="Nome exibido">
                  <input value={design.theme.brandName} onChange={event => updateTheme('brandName', event.target.value)} className="studio-input" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <ColorField label="Acento" value={design.theme.primaryColor} onChange={value => updateTheme('primaryColor', value)} />
                  <ColorField label="Fundo" value={design.theme.backgroundColor} onChange={value => updateTheme('backgroundColor', value)} />
                  <ColorField label="Texto" value={design.theme.textColor} onChange={value => updateTheme('textColor', value)} />
                  <ColorField label="Superfície" value={design.theme.surfaceColor} onChange={value => updateTheme('surfaceColor', value)} />
                </div>
                <Field label="Densidade">
                  <select value={design.layout.density} onChange={event => updateLayout('density', event.target.value as TotemDesign['layout']['density'])} className="studio-input">
                    <option value="compact">Compacta</option>
                    <option value="comfortable">Confortável</option>
                    <option value="spacious">Espaçosa</option>
                  </select>
                </Field>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableBlock({ block, selected, onSelect, onToggle, onRemove }: {
  block: TotemBlock
  selected: boolean
  onSelect: () => void
  onToggle: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border p-3 ${selected ? 'border-[#d7fbe8]/60 bg-[#d7fbe8]/10' : 'border-white/10 bg-white/[0.04]'}`}
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="rounded-lg p-2 text-[#9eb2aa] hover:bg-white/8 hover:text-white" aria-label="Reordenar bloco">
          <ArrowsOutCardinal size={16} />
        </button>
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-white">{block.title || BLOCK_LABELS[block.type]}</span>
          <span className="block text-xs text-[#9eb2aa]">{BLOCK_LABELS[block.type]}</span>
        </button>
        <button onClick={onToggle} className="rounded-lg p-2 text-[#9eb2aa] hover:bg-white/8 hover:text-white" aria-label="Alternar visibilidade">
          {block.visible ? <Eye size={16} /> : <EyeSlash size={16} />}
        </button>
        <button onClick={onRemove} className="rounded-lg p-2 text-red-300 hover:bg-red-500/10" aria-label="Remover bloco">
          <Trash size={16} />
        </button>
      </div>
    </div>
  )
}

function BlockEditor({ block, midias, onChange }: {
  block: TotemBlock
  midias: TotemMediaAsset[]
  onChange: (patch: Partial<TotemBlock>) => void
}) {
  return (
    <div className="space-y-4">
      <Field label="Título">
        <input value={block.title ?? ''} onChange={event => onChange({ title: event.target.value })} className="studio-input" />
      </Field>
      <Field label="Subtítulo">
        <textarea value={block.subtitle ?? ''} onChange={event => onChange({ subtitle: event.target.value })} className="studio-input min-h-20 resize-none" />
      </Field>
      <Field label="Alinhamento">
        <select value={block.alignment ?? 'left'} onChange={event => onChange({ alignment: event.target.value as TotemBlock['alignment'] })} className="studio-input">
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </Field>
      <Field label="Imagem">
        <select value={block.imageUrl ?? ''} onChange={event => onChange({ imageUrl: event.target.value })} className="studio-input">
          <option value="">Sem imagem</option>
          {midias.filter(asset => asset.mimeType.startsWith('image')).map(asset => (
            <option key={asset.id} value={asset.publicUrl}>{asset.originalName}</option>
          ))}
        </select>
      </Field>
      {block.type === 'video' && (
        <Field label="Vídeo">
          <select value={block.videoUrl ?? ''} onChange={event => onChange({ videoUrl: event.target.value })} className="studio-input">
            <option value="">Sem vídeo</option>
            {midias.filter(asset => asset.mimeType.startsWith('video')).map(asset => (
              <option key={asset.id} value={asset.publicUrl}>{asset.originalName}</option>
            ))}
          </select>
        </Field>
      )}
      <ColorField label="Fundo do bloco" value={block.backgroundColor ?? '#ffffff'} onChange={value => onChange({ backgroundColor: value })} />
      <Field label="Overlay da imagem">
        <input type="range" min={0} max={75} value={block.overlay ?? 28} onChange={event => onChange({ overlay: Number(event.target.value) })} className="w-full accent-[#d7fbe8]" />
      </Field>
      {(block.type === 'amenities' || block.type === 'carousel') && (
        <Field label="Itens, um por linha">
          <textarea
            value={(block.items ?? []).join('\n')}
            onChange={event => onChange({ items: event.target.value.split('\n').filter(Boolean) })}
            className="studio-input min-h-28 resize-none"
          />
        </Field>
      )}
    </div>
  )
}

function MediaPanel({ midias, uploading, onUpload, onUse, onRemove }: {
  midias: TotemMediaAsset[]
  uploading: boolean
  onUpload: (file: File | undefined) => void
  onUse: (asset: TotemMediaAsset) => void
  onRemove: (assetId: number) => void
}) {
  return (
    <div>
      <PanelTitle icon={<CloudArrowUp size={19} />} title="Biblioteca de mídia" />
      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7fbe8]/35 bg-[#d7fbe8]/8 p-5 text-center text-sm text-[#d8fff4] hover:bg-[#d7fbe8]/12">
        <CloudArrowUp size={28} weight="duotone" />
        <span className="mt-2 font-semibold">{uploading ? 'Enviando arquivo...' : 'Enviar imagem ou vídeo'}</span>
        <span className="mt-1 text-xs text-[#9eb2aa]">JPG, PNG, WEBP até 8 MB; MP4 até 80 MB</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="hidden" onChange={event => onUpload(event.target.files?.[0])} disabled={uploading} />
      </label>
      <div className="space-y-3">
        {midias.length === 0 ? (
          <p className="rounded-2xl bg-white/[0.04] p-4 text-sm text-[#9eb2aa]">Nenhuma mídia enviada ainda.</p>
        ) : midias.map(asset => (
          <div key={asset.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="overflow-hidden rounded-xl bg-black/20">
              {asset.mimeType.startsWith('image') ? (
                <img src={asset.publicUrl} alt={asset.originalName} className="h-28 w-full object-cover" />
              ) : (
                <video src={asset.publicUrl} className="h-28 w-full object-cover" muted loop autoPlay playsInline />
              )}
            </div>
            <p className="mt-3 truncate text-sm font-semibold text-white">{asset.originalName}</p>
            <p className="text-xs text-[#9eb2aa]">{formatBytes(asset.sizeBytes)}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => onUse(asset)} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">Usar</button>
              <button onClick={() => onRemove(asset.id)} className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/15">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PublishPanel({ design, saving, onSave, onPublish }: { design: TotemDesign; saving: boolean; onSave: () => void; onPublish: () => void }) {
  return (
    <div>
      <PanelTitle icon={<Check size={19} />} title="Publicação" />
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[#aabbb4]">
        <p className="font-semibold text-white">Resumo do rascunho</p>
        <p className="mt-2">{design.blocks.filter(block => block.visible).length} blocos ativos</p>
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
    <label className="block">
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

function createBlock(type: TotemBlockType): TotemBlock {
  const id = `${type}-${Date.now()}`
  return {
    id,
    type,
    visible: true,
    title: BLOCK_LABELS[type],
    subtitle: type === 'cta' ? 'Escolha o fluxo desejado' : '',
    alignment: 'left',
    variant: 'default',
    overlay: 24,
    items: type === 'amenities' ? ['Wi-Fi', 'Restaurante', 'Recepção 24h'] : [],
  }
}

function normalizeDesign(value: TotemDesign): TotemDesign {
  return {
    ...EMPTY_DESIGN,
    ...value,
    theme: { ...EMPTY_DESIGN.theme, ...(value.theme ?? {}) },
    layout: { ...EMPTY_DESIGN.layout, ...(value.layout ?? {}) },
    blocks: Array.isArray(value.blocks) && value.blocks.length > 0 ? value.blocks : EMPTY_DESIGN.blocks,
  }
}

function cloneDesign(value: TotemDesign): TotemDesign {
  return JSON.parse(JSON.stringify(value))
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
