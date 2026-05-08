# CheckIn Hub — Contexto para Agentes de IA

Projeto acadêmico FIAP — Challenge Flexmedia 2025-2 (3º ano Engenharia de Software).
Totem de autoatendimento hoteleiro com check-in/check-out automatizados e reconhecimento facial.

## Arquitetura — 3 superfícies independentes

```
/backend          → Spring Boot 3.4.4, Java 17, MySQL
/frontend-totem   → React 19 + Vite + Tailwind (tela do hóspede, kiosk mode)
/frontend-admin   → React 19 + Vite + Tailwind (painel gestor + painel FlexMedia)
```

Os três projetos são **completamente independentes** — não compartilham código.
Backend roda na porta `8080`. Totem em `5173`. Admin em `5174`.

## Como rodar localmente

```bash
# MySQL via Docker (ou local via brew)
docker-compose up mysql -d

# Backend
cd backend && ./mvnw spring-boot:run

# Totem
cd frontend-totem && npm run dev

# Admin
cd frontend-admin && npm run dev
```

Verificar saúde: `GET http://localhost:8080/actuator/health` → `{"status":"UP"}`

## Credenciais padrão

| Tipo | Email | Senha |
|---|---|---|
| FlexMedia Admin | admin@flexmedia.com | admin123 |
| MySQL | checkinhub | checkinhub123 |

## Decisões já tomadas — não questionar

- Banco: **MySQL 8.4**
- Frontend: **React 19 + TypeScript + Vite + Tailwind CSS v4**
- Reconhecimento facial: **@vladmandic/human** local no browser — frontend captura embedding facial e backend apenas persiste/serve o descriptor
- Auth: **JWT** com claims `email`, `hotelId`, `role`
- Roles: `ADMIN` (FlexMedia global) e `OPERADOR` (gestor vinculado a um hotel)
- PMS: **MockPMSAdapter** ativo por padrão (`app.pms.adapter=mock`)
- IDs: `GenerationType.IDENTITY` em todas as entidades (auto_increment MySQL)
- Redis: **removido** — não usar
- Custo: **zero** — nenhuma API paga permitida
- Totem Studio: customização visual por hotel com rascunho/publicação, upload local de mídia e renderer compartilhado entre admin e totem

## Documentos de contexto detalhados

- `docs/ARQUITETURA.md` — fonte técnica central: arquitetura, tecnologias, banco, auth, Totem Studio e biometria
- `docs/backend.md` — entidades, endpoints e padrões do backend
- `docs/frontend-admin.md` — auth, rotas, páginas, serviços
- `docs/frontend-totem.md` — fluxo, páginas, Human, i18n
- `docs/REQUISITOS_CHALLENGE.md` — requisitos do enunciado, entregas e aderência do MVP
- `docs/OPERACAO_LOCAL.md` — operação local, queries e contratos de homologação
- `docs/CENARIOS_TESTE.md` — tracker vivo de QA manual
- `docs/TASKS.md` — histórico legado; não usar como fonte atual

## Workflow obrigatório para agentes

Antes de implementar:
- Leia `docs/ARQUITETURA.md`.
- Leia o documento específico da superfície alterada.
- Para requisitos de entrega, leia `docs/REQUISITOS_CHALLENGE.md`.
- Para validação, consulte `docs/CENARIOS_TESTE.md`.

Depois de implementar:
- Atualize docs afetados no mesmo commit ou em commit separado de docs.
- Rode build/teste compatível com a superfície alterada.
- Não use documentos fora deste repo como fonte direta sem consolidar aqui.

Antes da entrega final:
- Quando o usuário disser que está prestes a entregar o projeto, lembre de revisar e remover do repositório quaisquer arquivos, instruções ou artefatos ligados ao uso de IA que não devam fazer parte da entrega final.
- Exemplos típicos: arquivos de contexto para agentes, instruções operacionais de IA, skills auxiliares, pastas/tooling local e artefatos temporários criados só para desenvolvimento com IA.

## Fluxo principal do hóspede (totem)

```
/ (idle) → /selecionar-idioma → /buscar-reserva → /confirmar-dados
→ /facial (cadastra rosto) → /emitir-chave → /obrigado

/checkout → busca reserva → confirma saída → /obrigado

/porta/:quarto → câmera → compara rosto → abre/nega acesso
```

## State machine de reservas

```
CONFIRMADA → CHECKIN_REALIZADO → CHECKOUT_REALIZADO
CONFIRMADA → CANCELADA
```

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->