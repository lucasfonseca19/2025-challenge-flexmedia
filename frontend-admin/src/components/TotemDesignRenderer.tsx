import type { TotemDesign } from '../types'
import { FONTS } from '../constants/fonts'

export type TotemPreviewScreen = 'idle' | 'search' | 'confirm' | 'facial' | 'key' | 'checkout'

interface Props {
  design: TotemDesign
  scale?: 'preview' | 'runtime'
}

export default function TotemDesignRenderer({ design, scale = 'preview' }: Props) {
  const font = FONTS.find(f => f.id === design.theme.fontFamily)
  const fontStack = font ? `'${font.id}', system-ui, sans-serif` : 'system-ui, sans-serif'
  const heroBlock = design.blocks.find(block => block.type === 'hero' && block.visible)
  const videoBlock = design.blocks.find(block => block.type === 'video' && block.visible && block.videoUrl)
  const footerBlock = design.blocks.find(block => block.type === 'footer' && block.visible)

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
      {videoBlock?.videoUrl && (
        <video src={videoBlock.videoUrl} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
      )}
      {!videoBlock?.videoUrl && heroBlock?.imageUrl && (
        <img src={heroBlock.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0, 0, 0, ${(heroBlock?.overlay ?? 42) / 100})` }} />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          background:
            `radial-gradient(ellipse at 18% 82%, ${design.theme.primaryColor} 0, transparent 50%), ` +
            `linear-gradient(180deg, rgba(255,255,255,0.08), transparent 35%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-82">
            <span className="h-2 w-2 rounded-full" style={{ background: design.theme.primaryColor }} />
            {design.theme.brandName}
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/75">Tela inicial</span>
        </header>

        <main>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/58">Autoatendimento</p>
          <h2 className="mt-2 max-w-[8.5ch] text-5xl font-bold leading-none text-white">{heroBlock?.title || 'Bem-vindo'}</h2>
          {heroBlock?.subtitle && (
            <p className="mt-3 max-w-[20rem] text-base leading-snug text-white/72">{heroBlock.subtitle}</p>
          )}
        </main>

        <footer>
          <div className="mb-4 flex justify-center">
            <div className="animate-pulse rounded-[1.25rem] px-6 py-4 text-sm font-bold text-white" style={{ background: design.theme.primaryColor }}>
              Toque para começar
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {['PT', 'EN', 'ES'].map(lang => (
              <span key={lang} className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85">
                {lang}
              </span>
            ))}
          </div>
          {footerBlock && (
            <p className="mt-4 text-center text-xs font-medium text-white/58">{footerBlock.title}</p>
          )}
        </footer>
      </div>
    </div>
  )
}

export function TotemFlowPreview({ design, screen }: { design: TotemDesign; screen: Exclude<TotemPreviewScreen, 'idle'> }) {
  const font = FONTS.find(f => f.id === design.theme.fontFamily)
  const fontStack = font ? `'${font.id}', system-ui, sans-serif` : 'system-ui, sans-serif'
  const spec = FLOW_SPECS[screen]

  return (
    <div
      className="relative isolate h-full w-full overflow-hidden rounded-[1.75rem] text-left"
      style={{
        background:
          `linear-gradient(145deg, ${hexToRgba(design.theme.primaryColor, 0.24)}, transparent 34%), ` +
          `linear-gradient(180deg, rgba(255,255,255,0.05), transparent 42%), ${design.theme.backgroundColor}`,
        color: design.theme.textColor,
        fontFamily: fontStack,
      }}
    >
      <link rel="stylesheet" href={font?.href} />
      <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="relative z-10 flex h-full flex-col p-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-80">
            <span className="h-2 w-2 rounded-full" style={{ background: design.theme.primaryColor }} />
            {design.theme.brandName}
          </div>
          {spec.step && (
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold opacity-75">{spec.step}</span>
          )}
        </header>

        <main className="flex flex-1 flex-col justify-center">
          {spec.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-55">{spec.eyebrow}</p>}
          <h2 className="mt-2 max-w-[9ch] text-4xl font-bold leading-none">{spec.title}</h2>
          {spec.subtitle && <p className="mt-3 text-sm leading-snug opacity-65">{spec.subtitle}</p>}
          {renderPreviewBody(screen, design)}
        </main>
      </div>
    </div>
  )
}

const FLOW_SPECS: Record<Exclude<TotemPreviewScreen, 'idle'>, { eyebrow: string; title: string; subtitle: string; step: string }> = {
  search: { eyebrow: 'Check-in', title: 'Identificação', subtitle: 'Informe o código ou CPF para iniciar o atendimento.', step: '1 de 2' },
  confirm: { eyebrow: 'Conferência', title: 'Confirmar dados', subtitle: 'Revise os dados antes de continuar.', step: '2 de 2' },
  facial: { eyebrow: '', title: 'Reconhecimento facial', subtitle: '', step: '' },
  key: { eyebrow: '', title: 'Chave emitida', subtitle: '', step: '' },
  checkout: { eyebrow: 'Check-out', title: 'Confirmar saída', subtitle: 'Finalize sua estadia com segurança.', step: '2 de 2' },
}

function renderPreviewBody(screen: Exclude<TotemPreviewScreen, 'idle'>, design: TotemDesign) {
  if (screen === 'confirm' || screen === 'checkout') {
    return (
      <div className="mt-7 rounded-2xl border border-white/12 p-4 text-sm" style={{ background: hexToRgba(design.theme.surfaceColor, 0.72) }}>
        {['Hóspede', 'Quarto', 'Check-in', 'Check-out'].map((label, index) => (
          <div key={label} className="flex justify-between border-b border-white/10 py-2 last:border-0">
            <span className="opacity-60">{label}</span>
            <span className="font-semibold">{index === 1 ? '1208' : index === 0 ? 'Maria Silva' : '24/05/2026'}</span>
          </div>
        ))}
        <div className="mt-4 rounded-xl px-4 py-4 text-center text-lg font-bold text-white" style={{ background: design.theme.primaryColor }}>
          {screen === 'checkout' ? 'Confirmar saída' : 'Confirmar'}
        </div>
      </div>
    )
  }

  if (screen === 'facial') {
    return (
      <div className="mt-7 flex flex-col items-center gap-4">
        <div className="aspect-square w-48 rounded-[2rem] border-2 border-blue-400/60 bg-black/30">
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-10 w-10 rounded-full border-2 border-white/10 bg-white/[0.04]" />
          </div>
        </div>
        <p className="text-xs text-white/35">Posicione o rosto para validar sua identidade</p>
        <div className="w-48 rounded-xl px-4 py-3.5 text-center text-sm font-bold text-white" style={{ background: design.theme.primaryColor }}>
          Validar rosto
        </div>
      </div>
    )
  }

  if (screen === 'key') {
    return (
      <div className="mt-7 grid grid-cols-[0.8fr_1fr] gap-4">
        <div className="aspect-square rounded-2xl bg-white p-3">
          <div className="h-full w-full rounded-xl bg-slate-950" />
        </div>
        <div className="rounded-2xl border border-white/12 p-4 text-sm" style={{ background: hexToRgba(design.theme.surfaceColor, 0.72) }}>
          <p className="font-bold opacity-60">Token</p>
          <p className="mt-3 font-mono text-lg font-bold">A91F-28CB</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-7 rounded-2xl border border-white/12 p-4" style={{ background: hexToRgba(design.theme.surfaceColor, 0.72) }}>
      <div className="rounded-xl border border-white/12 bg-black/10 px-4 py-4 text-xl font-semibold opacity-55">
        RES-001
      </div>
      <div className="mt-4 rounded-xl px-4 py-4 text-center text-lg font-bold text-white" style={{ background: design.theme.primaryColor }}>
        Buscar
      </div>
    </div>
  )
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.trim().replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map(char => char + char).join('')
    : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return `rgba(15, 118, 110, ${alpha})`
  const n = Number.parseInt(value, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
