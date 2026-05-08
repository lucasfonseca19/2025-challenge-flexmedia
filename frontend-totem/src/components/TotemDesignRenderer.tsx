import type { TotemBlock, TotemDesign } from '../types'
import { getFontStack } from '../hooks/useFontLoader'

interface Props {
  design: TotemDesign
  onCtaClick?: (action: 'checkin' | 'checkout') => void
  onLanguageClick?: (lang: 'pt' | 'en' | 'es') => void
}

export default function TotemDesignRenderer({ design, onCtaClick, onLanguageClick }: Props) {
  const blocks = design.blocks.filter(block => block.visible)
  const compact = design.layout.density === 'compact'
  const spacious = design.layout.density === 'spacious'
  const fontStack = getFontStack(design.theme.fontFamily)

  return (
    <div
      className="relative isolate flex min-h-[100dvh] w-screen select-none flex-col overflow-hidden"
      style={{
        background: design.theme.backgroundColor,
        color: design.theme.textColor,
        fontFamily: fontStack,
      }}
    >
      <div
        className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          background:
            `radial-gradient(ellipse at 20% 80%, ${design.theme.primaryColor} 0, transparent 50%), ` +
            `radial-gradient(ellipse at 80% 20%, ${design.theme.surfaceColor} 0, transparent 45%)`,
        }}
      />
      <div className={`flex min-h-[100dvh] flex-col ${compact ? 'gap-4 p-8' : spacious ? 'gap-10 p-14' : 'gap-7 p-10'}`}>
        {blocks.map((block, i) => (
          <div key={block.id} className="totem-block-enter" style={{ animationDelay: `${i * 0.08}s` }}>
            <RenderBlock block={block} design={design} onCtaClick={onCtaClick} onLanguageClick={onLanguageClick} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RenderBlock({ block, design, onCtaClick, onLanguageClick }: {
  block: TotemBlock
  design: TotemDesign
  onCtaClick?: (action: 'checkin' | 'checkout') => void
  onLanguageClick?: (lang: 'pt' | 'en' | 'es') => void
}) {
  switch (block.type) {
    case 'hero': return <HeroBlock block={block} design={design} />
    case 'cta': return <CtaBlock block={block} design={design} onCtaClick={onCtaClick} />
    case 'carousel': return <CarouselBlock block={block} design={design} />
    case 'banner': return <BannerBlock block={block} design={design} />
    case 'amenities': return <AmenitiesBlock block={block} design={design} />
    case 'video': return <VideoBlock block={block} design={design} />
    case 'language': return <LanguageBlock design={design} onLanguageClick={onLanguageClick} />
    case 'footer': return <FooterBlock block={block} />
    default: return null
  }
}

function HeroBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  return (
    <section className="relative flex min-h-[36dvh] items-end overflow-hidden rounded-[2rem] p-10" style={{ background: block.backgroundColor ?? design.theme.surfaceColor }}>
      {block.imageUrl && <img src={block.imageUrl} alt={block.title} className="absolute inset-0 h-full w-full object-cover" />}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(6, 15, 12, ${(block.overlay ?? 28) / 100})` }}
      />
      <div className={`relative max-w-[74%] ${alignmentClass(block.alignment)}`}>
        <p className="text-lg font-semibold uppercase tracking-[0.18em] opacity-75">{design.theme.brandName}</p>
        <h1 className="mt-4 text-7xl font-bold leading-none">{block.title}</h1>
        {block.subtitle && <p className="mt-5 text-3xl font-light leading-tight opacity-85">{block.subtitle}</p>}
      </div>
    </section>
  )
}

function CtaBlock({ block, design, onCtaClick }: { block: TotemBlock; design: TotemDesign; onCtaClick?: (action: 'checkin' | 'checkout') => void }) {
  return (
    <section className="grid grid-cols-2 gap-5">
      {(['checkin', 'checkout'] as const).map(action => {
        const isPrimary = action === 'checkin'
        const label = action === 'checkin' ? 'Check-in' : 'Check-out'
        return (
          <button
            key={action}
            onClick={() => onCtaClick?.(action)}
            className="touch-press rounded-[1.75rem] px-8 py-7 text-left"
            style={{ background: isPrimary ? design.theme.primaryColor : design.theme.surfaceColor, color: isPrimary ? '#ffffff' : design.theme.textColor }}
          >
            <p className="text-lg font-semibold uppercase tracking-[0.16em] opacity-75">{block.title}</p>
            <p className="mt-4 text-5xl font-bold">{label}</p>
            {block.subtitle && <p className="mt-3 text-2xl font-light opacity-75">{block.subtitle}</p>}
          </button>
        )
      })}
    </section>
  )
}

function CarouselBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  const items = block.items?.filter(Boolean) ?? []
  return (
    <section className="rounded-[1.75rem] p-7" style={{ background: design.theme.surfaceColor }}>
      <p className="text-3xl font-bold">{block.title}</p>
      <div className="mt-5 flex gap-4 overflow-x-auto scroll-snap-x pb-2">
        {(block.imageUrl ? [block.imageUrl] : []).concat(items).slice(0, 6).map((item, index) => (
          <div key={`${item}-${index}`} className="h-44 min-w-56 flex-shrink-0 overflow-hidden rounded-2xl bg-black/10 snap-start">
            {item.startsWith('/') || item.startsWith('http') ? (
              <img src={item} alt={`${block.title} ${index + 1}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center p-5 text-2xl font-light opacity-75">{item}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function BannerBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  return (
    <section className="rounded-[1.75rem] p-8" style={{ background: block.backgroundColor ?? design.theme.primaryColor, color: '#ffffff' }}>
      <p className="text-5xl font-bold">{block.title}</p>
      {block.subtitle && <p className="mt-3 text-2xl font-light opacity-80">{block.subtitle}</p>}
    </section>
  )
}

function AmenitiesBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  const items = block.items?.filter(Boolean).slice(0, 4) ?? []
  return (
    <section>
      <p className="text-2xl font-semibold opacity-75">{block.title}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item} className="rounded-[1.5rem] p-6 text-2xl font-medium" style={{ background: design.theme.surfaceColor }}>
            {item}
          </div>
        ))}
      </div>
    </section>
  )
}

function VideoBlock({ block, design }: { block: TotemBlock; design: TotemDesign }) {
  return (
    <section className="overflow-hidden rounded-[1.75rem]" style={{ background: design.theme.surfaceColor }}>
      {block.videoUrl ? (
        <video src={block.videoUrl} className="h-72 w-full object-cover" muted loop autoPlay playsInline />
      ) : (
        <div className="flex h-72 items-center justify-center text-2xl font-light opacity-65">Vídeo não selecionado</div>
      )}
      <div className="p-6">
        <p className="text-3xl font-bold">{block.title}</p>
        {block.subtitle && <p className="mt-2 text-2xl font-light opacity-75">{block.subtitle}</p>}
      </div>
    </section>
  )
}

function LanguageBlock({ design, onLanguageClick }: { design: TotemDesign; onLanguageClick?: (lang: 'pt' | 'en' | 'es') => void }) {
  return (
    <section className="flex justify-center gap-4">
      {(['pt', 'en', 'es'] as const).map(lang => (
        <button
          key={lang}
          onClick={() => onLanguageClick?.(lang)}
          className="touch-press rounded-2xl px-7 py-4 text-2xl font-semibold uppercase"
          style={{ background: design.theme.surfaceColor, color: design.theme.textColor }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </section>
  )
}

function FooterBlock({ block }: { block: TotemBlock }) {
  return (
    <footer className="mt-auto text-center text-2xl opacity-70">
      <p className="font-semibold">{block.title}</p>
      {block.subtitle && <p className="mt-2 font-light">{block.subtitle}</p>}
    </footer>
  )
}

function alignmentClass(alignment?: TotemBlock['alignment']) {
  if (alignment === 'center') return 'mx-auto text-center'
  if (alignment === 'right') return 'ml-auto text-right'
  return 'mr-auto text-left'
}
