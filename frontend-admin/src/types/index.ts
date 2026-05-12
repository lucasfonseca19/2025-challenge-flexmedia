export interface Hotel {
  id: number
  nome: string
  cnpj: string
  cidade: string
  estado: string
  ativo: boolean
  createdAt: string
}

export interface Reserva {
  id: number
  codigoReserva: string
  hospedeNome: string
  hospedeCpf: string
  hospedeEmail: string
  quartoNumero: string
  hotelId: number
  dataCheckin: string
  dataCheckout: string
  status: 'CONFIRMADA' | 'CHECKIN_REALIZADO' | 'CHECKOUT_REALIZADO' | 'CANCELADA'
  hospedeDataNascimento?: string | null
}

export interface MetricasDia {
  data: string
  totalCheckins: number
  totalCheckouts: number
  ocupacao: number
}

export interface ConteudoTotem {
  id: number
  hotelId: number
  tipo: 'SLIDE' | 'BANNER' | 'VIDEO'
  titulo: string
  urlMidia: string
  ordemExibicao: number
  ativo: boolean
}

export type TotemDesignStatus = 'DRAFT' | 'PUBLISHED'

export type TotemBlockType = 'hero' | 'cta' | 'carousel' | 'banner' | 'amenities' | 'video' | 'footer' | 'language'
export type TotemCarouselSpeed = 'slow' | 'medium' | 'fast' | number

export interface TotemContentItem {
  id: string
  text: string
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
  status?: TotemDesignStatus
  theme: TotemTheme
  layout: TotemLayout
  blocks: TotemBlock[]
  createdAt?: string
  updatedAt?: string
}

export interface TotemMediaAsset {
  id: number
  hotelId: number
  originalName: string
  mimeType: string
  sizeBytes: number
  publicUrl: string
  width: number | null
  height: number | null
  createdAt: string
}

export interface Usuario {
  id: number
  nome: string
  email: string
  role: 'ADMIN' | 'OPERADOR'
  hotelId: number | null
  ativo: boolean
}

export interface Totem {
  id: number
  nome: string
  codigo: string
  online: boolean
  ultimoHeartbeat: string | null
  hotelId: number
  ativo: boolean
}

export interface HotelConfig {
  id?: number
  hotelId: number
  nomeExibido: string
  logoUrl: string
  corPrimaria: string
  idiomasAtivos: string  // CSV: "pt,en,es"
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
