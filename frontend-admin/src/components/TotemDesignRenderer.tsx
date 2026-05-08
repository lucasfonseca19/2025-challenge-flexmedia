import type { TotemBlock, TotemDesign } from '../types'
import { FONTS } from '../constants/fonts'

interface Props {
  design: TotemDesign
  scale?: 'preview' | 'runtime'
}

export default function TotemDesignRenderer({ design, scale = 'preview' }: Props) {
  const visibleBlocks = design.blocks.filter(block => block.visible)
  const compact = design.layout.density === 'compact'
  const spacious = design.layout.density === 'spacious'
  const font = FONTS.find(f => f.id === design.theme.fontFamily)
  const fontStack = font ? `'${font.id}', system-ui, sans-serif` : 'system-ui, sans-serif'

  return (
    <div
      className={`relative isolate h-full w-full overflow-hidden text-left ${scale === 'preview' ? 'rounded-[1.75rem]' : ''}`}
      style={{
        background: design.theme.backgroundColor,
        color: design.theme.textColor,
        fontFamily: fontStack,
      }}
    >
      <link rel="stylesheet" href={font?.href} />
      <div
        className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          background:
            `radial-gradient(ellipse at 20% 80%, ${design.theme.primaryColor} 0, transparent 50%), ` +
            `radial-gradient(ellipse at 80% 20%, ${design.theme.surfaceColor} 0, transparent 45%)`,
        }}
      />
      <div className={`flex min-h-full flex-col ${compact ? 'gap-3 p-5' : spacious ? 'gap-7 p-9' : 'gap-5 p-7'}`}>
        {visibleBlocks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <p className="text-lg font-semibold">Totem sem blocos ativos</p>
              <p className="mt-2 text-sm opacity-70">Ative pelo menos um bloco no editor.</p>
            </div>
          </div>
        ) : (
          visibleBlocks.map((block, i) => (
            <div key={block.id} className="totem-block-enter" style={{ animationDelay: `${i * 0.08}s` }}>
              <RenderBlock block={block} design={design} compact={compact} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function RenderBlock({ block, design, compact }: { block: TotemBlock; design: TotemDesign; compact: boolean }) {
  switch (block.type) {
    case 'hero': return <HeroBlock block={block} design={design} compact={compact} />
    case 'cta': return <CtaBlock block={block} design={design} />
    case 'carousel': return <CarouselBlock block={block} design={design} />
    case 'banner': return <BannerBlock block={block} design={design} />
    case 'amenities': return <AmenitiesBlock block={block} design={design} />
    case 'video': return <VideoBlock block={block} design={design} />
    case 'language': return <LanguageBlock design={design} />
    case 'footer': return <FooterBlock block={block} />
    default: return null
  }
}

function HeroBlock({ block, design, compact }: { block: TotemBlock; design: TotemDesign; compact: boolean }) {
  const align = alignmentClass(block.alignment)
  return (
    <section
      className={`relative overflow-hidden rounded-[1.4rem] ${compact ? 'min-h-40 p-5' : 'min-h-56 p-7'} flex items-end`}
      style={{ background: block.backgroundColor ?? design.theme.surfaceColor }}
    >
      {block.imageUrl && (
        <img src={block.imageUrl} alt={block.title} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(6, 15, 12, ${(block.overlay ?? 28) / 100})` }} />
      <div className={`relative max-w-[78%] ${align}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{design.theme.brandName}</p>
        <h1 className="mt-2 text-3xl font-bold leading-none">{block.title}</h1>
        {block.subtitle && <p className="mt-3 text-base font-light leading-snug opacity-85">{block.subtitle}</p>}
      </div>
    </section>
  )
}

function CtaBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {(['checkin', 'checkout'] as const).map(action => {
        const isPrimary = action === 'checkin'
        const label = action === 'checkin' ? 'Check-in' : 'Check-out'
        return (
          <div
            key={action}
            className="rounded-2xl px-5 py-4 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.45)]"
            style={{ background: isPrimary ? design.theme.primaryColor : design.theme.surfaceColor, color: isPrimary ? '#ffffff' : design.theme.textColor }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">{block.title}</p>
            <p className="mt-3 text-xl font-bold">{label}</p>
            {block.subtitle && <p className="mt-1 text-sm font-light opacity-75">{block.subtitle}</p>}
          </div>
        )
      })}
    </section>
  )
}

function CarouselBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  const items = block.items?.filter(Boolean) ?? []
  return (
    <section className="overflow-hidden rounded-2xl p-4" style={{ background: design.theme.surfaceColor }}>
      <p className="text-sm font-bold">{block.title}</p>
      <div className="mt-3 flex gap-3 overflow-x-auto scroll-snap-x pb-1">
        {(block.imageUrl ? [block.imageUrl] : []).concat(items).slice(0, 6).map((item, index) => (
          <div key={`${item}-${index}`} className="h-24 min-w-32 flex-shrink-0 overflow-hidden rounded-xl bg-black/10 snap-start">
            {item.startsWith('/') || item.startsWith('http') ? (
              <img src={item} alt={`${block.title} ${index + 1}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center p-3 text-sm font-light opacity-75">{item}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function BannerBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  return (
    <section className="rounded-2xl p-5" style={{ background: block.backgroundColor ?? design.theme.primaryColor, color: '#ffffff' }}>
      <p className="text-xl font-bold">{block.title}</p>
      {block.subtitle && <p className="mt-1 text-sm font-light opacity-80">{block.subtitle}</p>}
    </section>
  )
}

function AmenitiesBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  const items = block.items?.filter(Boolean).slice(0, 4) ?? []
  return (
    <section>
      <p className="text-sm font-semibold opacity-75">{block.title}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item} className="rounded-2xl p-4 text-sm font-medium" style={{ background: design.theme.surfaceColor }}>
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

function VideoBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  return (
    <section className="overflow-hidden rounded-2xl" style={{ background: design.theme.surfaceColor }}>
      {block.videoUrl ? (
        <video src={block.videoUrl} className="h-40 w-full object-cover" muted loop autoPlay playsInline />
      ) : (
        <div className="flex h-40 items-center justify-center text-sm font-light opacity-65">Vídeo não selecionado</div>
      )}
      <div className="p-4">
        <p className="font-bold">{block.title}</p>
        {block.subtitle && <p className="mt-1 text-sm font-light opacity-75">{block.subtitle}</p>}
      </div>
    </section>
  )
}

function LanguageBlock({ design }: { design: TotemDesign }) {
  return (
    <section className="flex justify-center gap-2">
      {(['PT', 'EN', 'ES'] as const).map(lang => (
        <span key={lang} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: design.theme.surfaceColor }}>
          {lang}
        </span>
      ))}
    </section>
  )
}

function FooterBlock({ block }: { block: TotemBlock }) {
  return (
    <footer className="mt-auto text-center text-sm font-light opacity-70">
      <p className="font-semibold">{block.title}</p>
      {block.subtitle && <p className="mt-1">{block.subtitle}</p>}
    </footer>
  )
}

function alignmentClass(alignment?: TotemBlock['alignment']) {
  if (alignment === 'center') return 'mx-auto text-center'
  if (alignment === 'right') return 'ml-auto text-right'
  return 'mr-auto text-left'
}
