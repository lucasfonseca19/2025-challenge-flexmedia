import axios from 'axios'
import type { Totem } from '../types'

const api = axios.create({
  baseURL: '/api',
})

// Injeta token JWT em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redireciona para login em caso de 401
api.interceptors.response.use(
  res => res,
  err => {
    const isLoginRequest = err.config?.url === '/auth/login'
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authService = {
  login: (email: string, senha: string) =>
    api.post('/auth/login', { email, senha }).then(r => r.data),
  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_usuario')
  },
}

export const hotelService = {
  listar: (page = 0, size = 20) =>
    api.get('/hoteis', { params: { page, size } }).then(r => r.data),
  buscarPorId: (id: number) => api.get(`/hoteis/${id}`).then(r => r.data),
  criar: (data: unknown) => api.post('/hoteis', data).then(r => r.data),
  atualizar: (id: number, data: unknown) => api.put(`/hoteis/${id}`, data).then(r => r.data),
  desativar: (id: number) => api.patch(`/hoteis/${id}/desativar`).then(r => r.data),
}

export const reservaService = {
  listar: (params?: Record<string, unknown>) =>
    api.get('/reservas', { params }).then(r => r.data),
  buscarPorId: (id: number) => api.get(`/reservas/${id}`).then(r => r.data),
  criar: (data: unknown) => api.post('/reservas', data).then(r => r.data),
  atualizar: (id: number, data: unknown) => api.put(`/reservas/${id}`, data).then(r => r.data),
  deletar: (id: number) => api.delete(`/reservas/${id}`),
}

export const metricasService = {
  dashboard: (hotelId?: number) =>
    api.get('/metricas/dashboard', { params: { hotelId } }).then(r => r.data),
  historico: (hotelId: number, dias = 30) =>
    api.get('/metricas/historico', { params: { hotelId, dias } }).then(r => r.data),
}

export const conteudoService = {
  listar: (hotelId: number) =>
    api.get('/conteudo', { params: { hotelId } }).then(r => r.data),
  criar: (data: unknown) => api.post('/conteudo', data).then(r => r.data),
  atualizar: (id: number, data: unknown) => api.put(`/conteudo/${id}`, data).then(r => r.data),
  remover: (id: number) => api.delete(`/conteudo/${id}`),
}

export const totemService = {
  listar: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/totens`).then(r => r.data as Totem[]),
  criar: (hotelId: number, data: { nome: string }) =>
    api.post(`/hoteis/${hotelId}/totens`, data).then(r => r.data as Totem),
  remover: (id: number) =>
    api.delete(`/totens/${id}`),
}

export const configService = {
  buscar: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/config`).then(r => r.data),
  salvar: (hotelId: number, data: unknown) =>
    api.put(`/hoteis/${hotelId}/config`, data).then(r => r.data),
}

export const totemDesignService = {
  buscarDraft: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/totem-design/draft`).then(r => r.data),
  salvarDraft: (hotelId: number, data: unknown) =>
    api.put(`/hoteis/${hotelId}/totem-design/draft`, data).then(r => r.data),
  publicar: (hotelId: number) =>
    api.post(`/hoteis/${hotelId}/totem-design/publish`).then(r => r.data),
  buscarPublicado: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/totem-design/published`).then(r => r.data),
}

export const totemMediaService = {
  listar: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/totem-media`).then(r => r.data),
  upload: (hotelId: number, file: File) => {
    const data = new FormData()
    data.append('file', file)
    const token = localStorage.getItem('admin_token')
    return api.post(`/hoteis/${hotelId}/totem-media`, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then(r => r.data)
  },
  remover: (hotelId: number, assetId: number) =>
    api.delete(`/hoteis/${hotelId}/totem-media/${assetId}`),
}

export const usuarioService = {
  listar: () =>
    api.get('/auth/usuarios').then(r => r.data),
  cadastrar: (data: { nome: string; email: string; senha: string; role: string; hotelId?: number | null }) =>
    api.post('/auth/register', data).then(r => r.data),
  desativar: (id: number) =>
    api.delete(`/auth/usuarios/${id}`).then(r => r.data),
}

export default api
