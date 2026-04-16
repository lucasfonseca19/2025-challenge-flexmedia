# Frontend Totem — Contexto Detalhado

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Axios · face-api.js · react-router-dom v7

**Propósito:** Interface do hóspede. Roda em tela touch (kiosk mode). Sem autenticação de usuário — o totem acessa a API com endpoints públicos.

**Dev:** `npm run dev` → `http://localhost:5173`
**Build:** `npm run build`
**Proxy:** Em dev, `/api/*` é redirecionado para `http://localhost:8080` via Vite config.

## Estrutura de arquivos

```
src/
├── App.tsx                    — roteamento principal
├── main.tsx                   — entry point
├── index.css                  — globals + Tailwind
├── context/
│   └── TotemContext.tsx        — estado global do fluxo (idioma, reserva, fluxo, resetar)
├── hooks/
│   └── useIdleReset.ts        — reseta para / após 90s de inatividade
├── pages/
│   ├── IdlePage.tsx           — tela de repouso (entry point visual)
│   ├── LanguagePage.tsx       — seleção de idioma
│   ├── SearchReservationPage.tsx — busca por código ou CPF
│   ├── ConfirmDataPage.tsx    — exibe dados da reserva para confirmação
│   ├── FacialRecognitionPage.tsx — cadastra rosto (face-api.js) + fallback DOB
│   ├── IssueKeyPage.tsx       — emite chave digital
│   ├── CheckoutPage.tsx       — confirmação de checkout
│   ├── ThankYouPage.tsx       — tela final de agradecimento
│   └── DoorPage.tsx           — simulador de porta (/porta/:quarto)
├── services/
│   └── api.ts                 — serviços de chamada à API (axios)
├── types/
│   └── index.ts               — tipos TypeScript compartilhados
└── locales/
    ├── pt.json                — traduções português
    ├── en.json                — traduções inglês
    └── es.json                — traduções espanhol (bônus)
```

## Rotas

| Rota | Página | Descrição |
|---|---|---|
| `/` | IdlePage | Tela de repouso. Toque inicia o fluxo |
| `/selecionar-idioma` | LanguagePage | PT-BR, English, Español |
| `/buscar-reserva` | SearchReservationPage | Input de código ou CPF |
| `/confirmar-dados` | ConfirmDataPage | Exibe nome, quarto, datas |
| `/facial` | FacialRecognitionPage | Câmera + face-api.js ou fallback DOB |
| `/emitir-chave` | IssueKeyPage | Chama POST /api/chaves/{id} |
| `/checkout` | CheckoutPage | Resumo + confirmação de saída |
| `/obrigado` | ThankYouPage | Encerramento, reseta estado |
| `/porta/:quarto` | DoorPage | Simulador de porta para demo |
| `*` | — | Redireciona para `/` |

## TotemContext

Estado global acessível por todas as páginas via `useTotem()`:

```ts
interface TotemContextType {
  idioma: 'pt' | 'en' | 'es'
  setIdioma: (idioma: Idioma) => void
  t: typeof pt                        // objeto de traduções do idioma atual
  reserva: Reserva | null             // reserva encontrada no backend
  setReserva: (r: Reserva | null) => void
  fluxo: 'checkin' | 'checkout' | null
  setFluxo: (f: 'checkin' | 'checkout' | null) => void
  resetar: () => void                 // limpa reserva, fluxo, volta idioma para pt
}
```

**Uso:**
```tsx
const { t, idioma, reserva, setReserva, fluxo } = useTotem()
```

## Tipos principais

```ts
type Idioma = 'pt' | 'en' | 'es'
type StatusReserva = 'CONFIRMADA' | 'CHECKIN_REALIZADO' | 'CHECKOUT_REALIZADO' | 'CANCELADA'

interface Reserva {
  id: number
  codigoReserva: string
  hospedeNome: string
  hospedeCpf: string
  hospedeEmail: string
  quartoNumero: string
  dataCheckin: string       // ISO date string "YYYY-MM-DD"
  dataCheckout: string
  status: StatusReserva
  hospedeDataNascimento: string | null   // "YYYY-MM-DD" ou null
}

interface ChaveEmitida {
  tipo: 'DIGITAL' | 'RFID'
  token: string
  dataEmissao: string
}
```

## Serviços de API

```ts
// src/services/api.ts — baseURL: '/api'

checkinService.buscarReserva(codigoOuCpf)  → GET /checkin/reserva/{codigo}
checkinService.confirmar(reservaId, { faceDescriptor, idioma }) → POST /checkin/confirmar/{id}

checkoutService.buscarReserva(codigoOuCpf) → GET /checkout/reserva/{codigo}
checkoutService.confirmar(reservaId)       → POST /checkout/confirmar/{id}

chavesService.emitir(reservaId)            → POST /chaves/{id}

quartoService.validarFace(quartoNumero)    → GET /quartos/{quarto}/validar-face
// retorna: { sucesso, mensagem, descriptorArmazenado, hospedeNome, quartoNumero }
```

## face-api.js — Como está implementado

### Modelos (em `public/models/`)
- `tiny_face_detector` (~190KB) — detecta onde o rosto está na imagem
- `face_landmark_68` (~350KB) — mapeia 68 pontos do rosto para normalização
- `face_recognition` (~6.2MB) — converte rosto normalizado em array de 128 números

Os modelos são carregados uma vez no `useEffect` da `FacialRecognitionPage` e cacheados pelo browser.

### Fluxo de enrollment (check-in — `FacialRecognitionPage`)
```
1. Carrega modelos do /models/
2. Abre câmera com getUserMedia({ video: { facingMode: 'user' } })
3. A cada frame detecta: tinyFaceDetector → landmarks → descriptor
4. Quando face detectada: extrai Float32Array(128)
5. Converte para number[] e serializa: JSON.stringify(Array.from(descriptor))
6. Envia no body de POST /checkin/confirmar/{id} como campo faceDescriptor
```

### Fluxo de verificação (porta — `DoorPage`)
```
1. Busca descriptor do backend: GET /quartos/{quarto}/validar-face
2. Parseia: JSON.parse(descriptorArmazenado) → Float32Array
3. Captura rosto ao vivo → extrai descriptor em tempo real
4. Compara: faceapi.euclideanDistance(d1, d2)
5. Distância < 0.5 → acesso liberado (verde ✓)
   Distância ≥ 0.5 → acesso negado (vermelho ✗)
```

> **Importante:** toda comparação acontece no browser. Nenhuma imagem é enviada ao servidor.

### Fallback por data de nascimento (`FacialRecognitionPage`)
- Aparece se `reserva.hospedeDataNascimento !== null`
- Usuário digita data no formato DD/MM/YYYY (EN: MM/DD/YYYY)
- Compara string ISO com `reserva.hospedeDataNascimento`
- Se bater, avança sem usar câmera

## Idle timeout (`useIdleReset`)

```ts
useIdleReset(90) // chamar nas páginas do fluxo (não na IdlePage)
```

Monitora eventos `touchstart`, `mousemove`, `keydown`, `click`.
Após 90s sem interação: chama `resetar()` e navega para `/`.

## i18n

Arquivos em `src/locales/{pt,en,es}.json`. O objeto `t` do contexto sempre reflete o idioma atual.

**Estrutura das chaves:**
```json
{
  "geral": { "btnVoltar", "carregando", "erro" },
  "idle": { ... },
  "idioma": { ... },
  "buscarReserva": { "titulo", "placeholder", "btnBuscar", "erro" },
  "confirmarDados": { "titulo", "nome", "quarto", "dataCheckin", "dataCheckout" },
  "reconhecimentoFacial": { "titulo", "instrucao", "processando", "sucesso", "btnManual" },
  "verificacaoIdentidade": { "btnCamera", "btnDataNascimento", "labelData", "formatoData", ... },
  "emitirChave": { ... },
  "checkout": { "titulo", "instrucao", "btnConfirmar", "sucesso" }
}
```

## Padrões de UI

- Fundo: `bg-slate-900` (quase preto) em todas as telas
- Texto principal: `text-white`
- Texto secundário: `text-slate-400`
- Cards/panels: `bg-slate-800 rounded-2xl`
- Botão primário: `bg-blue-600 hover:bg-blue-500 rounded-2xl`
- Botão secundário: `bg-slate-700 hover:bg-slate-600 rounded-2xl`
- Telas sempre `min-h-screen w-screen` — nunca scroll horizontal
- Fontes grandes para touch: `text-3xl md:text-5xl` nos títulos
- Botões grandes: `py-4 md:py-6`
