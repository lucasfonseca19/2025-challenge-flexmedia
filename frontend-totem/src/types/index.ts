export type Idioma = 'pt' | 'en' | 'es'

export type StatusReserva = 'CONFIRMADA' | 'CHECKIN_REALIZADO' | 'CHECKOUT_REALIZADO' | 'CANCELADA'

export type TipoChave = 'DIGITAL' | 'RFID'

export interface Reserva {
  id: number
  codigoReserva: string
  hospedeNome: string
  hospedeCpf: string
  hospedeEmail: string
  quartoNumero: string
  dataCheckin: string
  dataCheckout: string
  status: StatusReserva
  hospedeDataNascimento: string | null
  faceDescriptor?: string | null
}

export interface ChaveEmitida {
  tipo: TipoChave
  token: string
  dataEmissao: string
}

export interface TotemConfig {
  id: number
  codigo: string
  nome: string
  hotelId: number
  config: {
    nomeExibido: string
    logoUrl: string
    corPrimaria: string
    idiomasAtivos: string
  }
  conteudo: {
    id: number
    tipo: 'SLIDE' | 'BANNER' | 'VIDEO'
    titulo: string
    urlMidia: string
    ordemExibicao: number
  }[]
  design?: TotemDesign | null
}

export type TotemBlockType = 'hero' | 'cta' | 'carousel' | 'banner' | 'amenities' | 'video' | 'footer' | 'language'
export type TotemCarouselSpeed = 'slow' | 'medium' | 'fast' | number

export interface TotemContentItem {
  id: string
  text: string
  texts?: Partial<Record<Idioma, string>>
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  backgroundColor?: string
  textPosition?: 'top' | 'center' | 'bottom'
  active: boolean
}

export interface TotemTheme {
  brandName: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  surfaceColor: string
  fontFamily: string
}

export interface TotemLayout {
  template: string
  density: 'compact' | 'comfortable' | 'spacious'
  screen: 'portrait' | 'landscape'
}

export interface TotemBlock {
  id: string
  type: TotemBlockType
  visible: boolean
  title: string
  subtitle?: string
  imageUrl?: string
  videoUrl?: string
  alignment?: 'left' | 'center' | 'right'
  variant?: string
  backgroundColor?: string
  overlay?: number
  items?: string[]
  contentItems?: TotemContentItem[]
  speed?: TotemCarouselSpeed
}

export interface TotemDesign {
  id?: number
  hotelId?: number
  status?: 'DRAFT' | 'PUBLISHED'
  theme: TotemTheme
  layout: TotemLayout
  blocks: TotemBlock[]
}
