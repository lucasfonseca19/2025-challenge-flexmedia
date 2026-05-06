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
- `docs/OPERACAO_LOCAL.md` — operação local, queries e contratos de homologação
- `docs/CENARIOS_TESTE.md` — tracker vivo de QA manual
- `docs/TASKS.md` — histórico legado; não usar como fonte atual

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
