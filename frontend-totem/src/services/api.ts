import type { Reserva, ChaveEmitida, TotemConfig, TotemDesign } from '../types'

const apiBaseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api')

type JsonBody = Record<string, unknown> | Array<unknown>

type ApiErrorPayload = {
  detail?: string
  message?: string
}

class ApiError extends Error {
  response?: { data?: ApiErrorPayload }

  constructor(message: string, data?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.response = { data }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  const isJsonBody = typeof init?.body === 'string'

  if (isJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseURL}${path}`, {
    ...init,
    headers,
  })

  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (!response.ok) {
    const payload = (data as ApiErrorPayload | null) ?? undefined
    throw new ApiError(
      payload?.detail ?? payload?.message ?? `Erro HTTP ${response.status}`,
      payload
    )
  }

  return data as T
}

function get<T>(path: string): Promise<T> {
  return request<T>(path)
}

function post<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export type ValidacaoFaceResponse = {
  sucesso: boolean
  mensagem: string
  descriptorArmazenado: string | null
  hospedeNome: string | null
  quartoNumero: string | null
}

export const checkinService = {
  buscarReserva: (codigoOuCpf: string): Promise<Reserva> =>
    get(`/checkin/reserva/${encodeURIComponent(codigoOuCpf)}`),

  confirmar: (
    reservaId: number,
    payload?: { faceDescriptor?: string | null, dataNascimento?: string | null, idioma?: string }
  ): Promise<void> => post(`/checkin/confirmar/${reservaId}`, payload ?? {}),
}

export const quartoService = {
  validarFace: (quartoNumero: string): Promise<ValidacaoFaceResponse> =>
    post(`/quartos/${encodeURIComponent(quartoNumero)}/validar-face`),
}

export const checkoutService = {
  buscarReserva: (codigoOuCpf: string): Promise<Reserva> =>
    get(`/checkout/reserva/${encodeURIComponent(codigoOuCpf)}`),

  confirmar: (reservaId: number): Promise<void> =>
    post(`/checkout/confirmar/${reservaId}`),
}

export const chavesService = {
  emitir: (reservaId: number): Promise<ChaveEmitida> =>
    post(`/chaves/${reservaId}`),
}

export const totemConfigService = {
  buscarPorCodigo: (codigo: string): Promise<TotemConfig> =>
    get(`/totens/codigo/${codigo.toUpperCase()}`),

  heartbeat: (totemId: number): Promise<void> =>
    post(`/totens/${totemId}/heartbeat`),
}

export const totemDesignService = {
  buscarPublicado: (hotelId: number): Promise<TotemDesign | null> =>
    get(`/hoteis/${hotelId}/totem-design/published`),
}
