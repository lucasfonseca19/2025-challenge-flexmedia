# Frontend Admin — Contexto Detalhado

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Axios · Recharts · react-router-dom v7

**Propósito:** Painel web para dois perfis de usuário:
- **ADMIN** (FlexMedia) — gerencia hotéis, usuários e tem visão global
- **OPERADOR** (Gestor do Hotel) — gerencia reservas, totens, conteúdo e configuração do seu hotel

**Dev:** `npm run dev` → `http://localhost:5174`
**Build:** `npm run build`
**Proxy:** Em dev, `/api/*` é redirecionado para `http://localhost:8080` via Vite config.

## Estrutura de arquivos

```
src/
├── App.tsx                      — roteamento principal com PrivateRoute
├── main.tsx
├── context/
│   └── AuthContext.tsx           — autenticação (token JWT, dados do usuário, login/logout)
├── components/
│   ├── Layout.tsx               — sidebar + header + <Outlet>
│   └── PrivateRoute.tsx         — redireciona para /login se não autenticado
├── pages/
│   ├── LoginPage.tsx            — formulário de login
│   ├── DashboardPage.tsx        — métricas com gráficos (Recharts)
│   ├── HotelsPage.tsx           — CRUD de hotéis (ADMIN)
│   ├── ReservationsPage.tsx     — CRUD de reservas (OPERADOR)
│   ├── UsersPage.tsx            — gestão de usuários (ADMIN)
│   └── TotemPage.tsx            — gestão de dispositivos, conteúdo e aparência do totem em abas (OPERADOR)
├── services/
│   └── api.ts                   — serviços axios com interceptors
└── types/
    └── index.ts                 — tipos TypeScript compartilhados
```

## Rotas

```
/login                → LoginPage (pública)
/dashboard            → DashboardPage
/hoteis               → HotelsPage    (visível para ADMIN)
/usuarios             → UsersPage     (visível para ADMIN)
/reservas             → ReservationsPage  (visível para OPERADOR)
/totem                → TotemPage         (visível para OPERADOR)
*                     → redireciona para /dashboard
```

Rotas são protegidas por `PrivateRoute` — redireciona para `/login` se `isAutenticado === false`.

## AuthContext

```ts
interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  login: (token: string, usuario: Usuario) => void
  logout: () => void
  isAutenticado: boolean
}
```

Estado persiste em `localStorage` com chaves `admin_token` e `admin_usuario`.

**Uso:**
```tsx
const { usuario, token, login, logout, isAutenticado } = useAuth()
const isAdmin = usuario?.role === 'ADMIN'
const isOperador = usuario?.role === 'OPERADOR'
```

## Tipos principais

```ts
interface Hotel {
  id: number; nome: string; cnpj: string; cidade: string; estado: string
  ativo: boolean; createdAt: string
}

interface Reserva {
  id: number; codigoReserva: string; hospedeNome: string; hospedeCpf: string
  hospedeEmail: string; quartoNumero: string; hotelId: number
  dataCheckin: string; dataCheckout: string
  status: 'CONFIRMADA' | 'CHECKIN_REALIZADO' | 'CHECKOUT_REALIZADO' | 'CANCELADA'
  hospedeDataNascimento?: string | null
}

interface Usuario {
  id: number; nome: string; email: string
  role: 'ADMIN' | 'OPERADOR'; hotelId: number | null; ativo: boolean
}

interface Totem {
  id: number; nome: string; codigo: string; online: boolean
  ultimoHeartbeat: string | null; hotelId: number; ativo: boolean
}

interface HotelConfig {
  id?: number; hotelId: number; nomeExibido: string; logoUrl: string
  corPrimaria: string; idiomasAtivos: string   // CSV: "pt,en,es"
}

interface ConteudoTotem {
  id: number; hotelId: number; tipo: 'SLIDE' | 'BANNER' | 'VIDEO'
  titulo: string; urlMidia: string; ordemExibicao: number; ativo: boolean
}

interface PageResponse<T> {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number
}
```

## Serviços de API (`src/services/api.ts`)

O axios está configurado com:
- `baseURL: '/api'`
- Interceptor de request: injeta `Authorization: Bearer {token}` automaticamente
- Interceptor de response: redireciona para `/login` em caso de 401

```ts
authService.login(email, senha)              → POST /auth/login
authService.logout()                         → limpa localStorage

hotelService.listar(page, size)              → GET /hoteis
hotelService.buscarPorId(id)                 → GET /hoteis/{id}
hotelService.criar(data)                     → POST /hoteis
hotelService.atualizar(id, data)             → PUT /hoteis/{id}
hotelService.desativar(id)                   → PATCH /hoteis/{id}/desativar

reservaService.listar(params)                → GET /reservas?page&size&busca&status
reservaService.buscarPorId(id)               → GET /reservas/{id}
reservaService.criar(data)                   → POST /reservas
reservaService.atualizar(id, data)           → PUT /reservas/{id}
reservaService.deletar(id)                   → DELETE /reservas/{id}

metricasService.dashboard(hotelId?)          → GET /metricas/dashboard?hotelId=
metricasService.historico(hotelId, dias)     → GET /metricas/historico?hotelId=&dias=

conteudoService.listar(hotelId)              → GET /conteudo?hotelId=
conteudoService.criar(data)                  → POST /conteudo
conteudoService.atualizar(id, data)          → PUT /conteudo/{id}
conteudoService.remover(id)                  → DELETE /conteudo/{id}

usuarioService.listar()                      → GET /auth/usuarios
usuarioService.cadastrar(data)               → POST /auth/register
usuarioService.desativar(id)                 → DELETE /auth/usuarios/{id}

totemService.listar(hotelId)                 → GET /hoteis/{id}/totens
totemService.criar(hotelId, { nome })        → POST /hoteis/{id}/totens
totemService.remover(id)                     → DELETE /totens/{id}

configService.buscar(hotelId)                → GET /hoteis/{id}/config
configService.salvar(hotelId, data)          → PUT /hoteis/{id}/config
```

## Separação de menu por role

`Layout.tsx` renderiza itens de menu condicionalmente:

**ADMIN (FlexMedia):** Dashboard · Hotéis · Usuários

**OPERADOR (Hotel):** Dashboard · Reservas · Totem

`TotemPage` concentra três abas internas:
- `Dispositivos` — cadastro, listagem, remoção e código de ativação
- `Conteúdo` — CRUD de itens exibidos no totem
- `Aparência` — configuração visual e idiomas

## Padrões das páginas

### Padrão de CRUD com modal (HotelsPage, ReservationsPage, ContentPage, UsersPage, TotemPage)
```
1. useEffect → carrega lista do backend
2. Fallback: se backend offline, exibe dados mock (apenas em páginas que têm mock)
3. Tabela com dados + ações (editar/remover)
4. Botão "+ Novo" → abre modal
5. Modal com formulário → valida → salva → fecha → recarrega lista
6. Confirmação de exclusão inline (botões "Sim"/"Não" na linha da tabela)
```

### Padrão de tratamento de erro
```tsx
} catch (e: unknown) {
  const data = (e as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
  setErro(data?.detail ?? data?.message ?? 'Mensagem genérica de erro.')
}
```

### Padrão de paginação (ReservationsPage)
- Backend retorna `PageResponse<T>` com `content`, `totalPages`, `number`
- Frontend controla `pagina` (zero-indexed) e `totalPaginas`
- Botões "← Anterior" e "Próxima →" desabilitados nos limites

## DashboardPage — estrutura dos dados

```ts
interface DashboardData {
  totalCheckinsHoje: number
  totalCheckoutsHoje: number
  totalChavesHoje: number
  ocupacaoAtual: number       // ainda não implementado no backend — sempre 0
  hoteisAtivos: number
  historico: {
    data: string              // "dd/MM"
    totalCheckins: number
    totalCheckouts: number
    totalChaves: number
  }[]
  idiomaPt: number
  idiomaEn: number
  idiomaEs: number
}
```

Gráficos usam Recharts:
- `BarChart` — movimentação dos últimos 7 dias
- `PieChart` — distribuição de idiomas (usa dados reais se > 0, senão mock)

## Padrões de UI

- Fundo base: `bg-slate-900` (body) com `bg-slate-800` nos cards
- Bordas: `border border-slate-700`
- Arredondamento: `rounded-2xl` nos cards, `rounded-lg` em inputs e botões
- Botão primário: `bg-blue-600 hover:bg-blue-500`
- Botão destrutivo: `text-red-400 hover:text-red-300`
- Badges de status: `bg-green-500/20 text-green-400` (ativo/online) · `bg-slate-600 text-slate-400` (inativo/offline)
- Tabelas: `w-full text-sm` com `min-w-[600px]` e `overflow-x-auto` para responsividade
- Modais: `fixed inset-0 bg-black/60` com card centralizado `max-w-md max-h-[90vh] overflow-y-auto`
