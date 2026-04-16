import axios from 'axios'
import type { Reserva, ChaveEmitida } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const checkinService = {
  buscarReserva: (codigoOuCpf: string): Promise<Reserva> =>
    api.get(`/checkin/reserva/${encodeURIComponent(codigoOuCpf)}`).then(r => r.data),

  confirmar: (reservaId: number, payload?: { faceDescriptor?: string | null, idioma?: string }): Promise<void> =>
    api.post(`/checkin/confirmar/${reservaId}`, payload ?? {}).then(r => r.data),
}

export const checkoutService = {
  buscarReserva: (codigoOuCpf: string): Promise<Reserva> =>
    api.get(`/checkout/reserva/${encodeURIComponent(codigoOuCpf)}`).then(r => r.data),

  confirmar: (reservaId: number): Promise<void> =>
    api.post(`/checkout/confirmar/${reservaId}`).then(r => r.data),
}

export const chavesService = {
  emitir: (reservaId: number): Promise<ChaveEmitida> =>
    api.post(`/chaves/${reservaId}`).then(r => r.data),
}
