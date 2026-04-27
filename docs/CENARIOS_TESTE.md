# Cenários de Teste — CheckIn Hub

> **Objetivo:** mapear todos os fluxos do sistema para validação manual/E2E.
> **Estratégia:** garantir o básico antes de edge cases. Seguir a ordem das seções (P0 → P3).
> **Ambientes:** Backend `http://localhost:8080` · Totem `http://localhost:5173` · Admin `http://localhost:5174`
> **Credenciais seed:** `admin@flexmedia.com` / `admin123`
> **Legenda de prioridade:** 🔴 P0 (bloqueante) · 🟠 P1 (crítico) · 🟡 P2 (importante) · 🟢 P3 (edge case / refinamento)
> **Legenda de execução:** ✅ passou · ⚠️ passou parcialmente / divergente · ❌ falhou · ⏳ não testado

---

## Índice

1. [🔴 P0 — Fluxos bloqueantes (o produto não funciona sem isso)](#p0)
2. [🟠 P1 — Fluxos críticos (o produto funciona, mas quebra cedo)](#p1)
3. [🟡 P2 — Fluxos importantes (funcionalidades acessórias)](#p2)
4. [🟢 P3 — Edge cases e refinamento](#p3)
5. [Status de execução](#status-execucao)
6. [Apêndice — Setup de dados de teste](#apendice)

---

<a id="status-execucao"></a>
# Status de execução

Última execução manual assistida: **2026-04-27**.

Ambiente usado:
- Backend `http://localhost:8080`
- Totem `http://localhost:5173`
- Admin `http://localhost:5174`
- MySQL local `checkinhub`

Dados criados/validados na execução:
- Operador: `op1777062452505@teste.local`
- Reserva: `RES497807`
- Reserva editável: `RES-P0-EDIT`
- Reserva cross-hotel: `RES-HOTEL-2`
- Hotel criado/editado: `Hotel P0 CRUD Editado` (`id=2`)
- Hotel criado indevidamente por operador durante teste de segurança: `Hotel Proibido` (`id=3`)
- Hotéis de massa: `Hotel Massa 9450220` (`id=4`, inativo), `Hotel Usuarios 9450220` (`id=5`)
- Reservas de massa: `PAGE-9450220-0` até `PAGE-9450220-15`, `KEY-9450220`, `DEL-9450220` (excluída)
- Conteúdo de totem: `Conteudo P0 Ativo` (`id=1`, atualmente inativo)
- Conteúdo visual ativo: `Conteudo Visual 483815` (`id=3`)
- Totem: `Totem P0 3344`, código `5RIKKD`

| TC | Resultado | Evidência / observação |
|----|-----------|------------------------|
| TC-001 | ✅ | Backend iniciou, actuator retornou `200`, `db.status=UP`, DataLoader informou admin existente. |
| TC-002 | ✅ | Totem abriu em `5173` e redirecionou para `/setup`. |
| TC-003 | ✅ | Admin abriu em `5174` e redirecionou para `/login`. |
| TC-010 | ✅ | Login ADMIN com `admin@flexmedia.com` funcionou e menu exibiu apenas Dashboard, Hotéis e Usuários. |
| TC-011 | ✅ | Operador criado pela UI conseguiu login e menu exibiu Dashboard, Reservas e Totem. |
| TC-012 | ✅ | Retestado após correção: senha inválida permanece em `/login` e exibe `E-mail ou senha inválidos.`. |
| TC-013 | ✅ | Acesso direto a `/dashboard` sem sessão redirecionou para `/login`. |
| TC-014 | ✅ | Token inválido em rota protegida retornou `401` pela API. |
| TC-015 | ✅ | Logout voltou para `/login`; sessão não permaneceu acessível na UI. |
| TC-020 | ✅ | `POST /api/hoteis` criou `Hotel P0 CRUD` com `201`. |
| TC-021 | ✅ | `PUT /api/hoteis/2` atualizou nome/cidade do hotel com `200`. |
| TC-022 | ✅ | `PATCH /api/hoteis/4/desativar` retornou `204`; `GET /api/hoteis/4` confirmou `ativo=false`. |
| TC-023 | ✅ | CNPJ duplicado retornou `422` com detalhe `CNPJ já cadastrado`. |
| TC-030 | ✅ | Retestado após correção: reserva com check-in, check-out e DOB persistiu corretamente no backend/MySQL. |
| TC-031 | ✅ | Código de reserva duplicado retornou `422` com detalhe `Código de reserva já cadastrado`. |
| TC-032 | ✅ | Checkout anterior ao check-in retornou `422` com detalhe de validação. |
| TC-033 | ✅ | `PUT /api/reservas/5` alterou quarto e datas de `RES-P0-EDIT` com `200`. |
| TC-034 | ✅ | `DELETE /api/reservas/{id}` retornou `204`; busca posterior da reserva excluída retornou `404`. |
| TC-035 | ✅ | Criadas 16 reservas `PAGE-9450220-*`; paginação retornou 10 itens na página 0 e 6 na página 1. |
| TC-040 | ✅ | Totem criado no painel; código `5RIKKD`, status inicial offline, `ultimo_heartbeat=NULL`. |
| TC-041 | ✅ | Código `5RIKKD` ativou o totem; redirecionou para IdlePage. |
| TC-042 | ✅ | Heartbeat atualizou `totens.ultimo_heartbeat`; admin mostrou `Online / Agora`. |
| TC-043 | ✅ | Código inválido exibiu erro e permaneceu em `/setup`. |
| TC-050 | ⚠️ | Retestado sem câmera real: check-in com DOB válido concluiu, chave foi emitida e tela mostra `Quarto: 203`; reconhecimento facial ainda não foi validado. |
| TC-051 | ⏳ | Não executado. |
| TC-052 | ⏳ | Não executado. |
| TC-053 | ⏳ | Não executado. |
| TC-054 | ⏳ | Não executado. |
| TC-055 | ✅ | Backend rejeitou check-in sem `faceDescriptor` e sem DOB válido; DOB correto permitiu prosseguir. |
| TC-060 | ✅ | Retestado após correção: fluxo de checkout vai de confirmação de dados para `/checkout`, sem passar por `/facial`. |
| TC-061 | ✅ | Checkout de reserva `CONFIRMADA` foi bloqueado com `422` e detalhe `Check-out não permitido`. |
| TC-100 | ✅ | Cadastro de operador via `/usuarios` funcionou e usuário apareceu na lista. |
| TC-101 | ✅ | ADMIN `admin9450220@teste.local` criado com `201` e `hotelId=null`. |
| TC-102 | ✅ | E-mail duplicado retornou `422` com detalhe `E-mail já cadastrado`. |
| TC-103 | ✅ | Usuário operador foi desativado com `204`; login posterior retornou `401`. |
| TC-104 | ✅ | Retestado após correção: tentativa de auto-desativação retorna `422` com mensagem clara. |
| TC-120 | ⚠️ | Configuração por API foi aplicada visualmente no totem: logo, nome `Hotel Teste P0` e idiomas `pt/en/es`; fluxo de upload/formulário da UI ainda não foi exercitado. |
| TC-121 | ✅ | Após reload do totem, `localStorage.totemConfig` manteve logo, nome e idiomas na IdlePage. |
| TC-130 | ✅ | Conteúdo `Conteudo P0 Ativo` foi criado via API com `201`. |
| TC-131 | ✅ | Retestado no navegador: IdlePage exibiu `Conteudo Visual 483815` vindo de `totemConfig.conteudo`. |
| TC-132 | ✅ | Conteúdo inativado saiu do payload público `conteudo`. |
| TC-133 | ✅ | `DELETE /api/conteudo/{id}` retornou `204`; conteúdo excluído não apareceu mais na listagem. |
| TC-140 | ✅ | Dashboard ADMIN renderizou cards e gráficos com dados agregados após massa com 2+ hotéis/check-ins. |
| TC-141 | ✅ | Dashboard OPERADOR renderizou dados do hotel do operador. |
| TC-142 | ✅ | `metricas_diarias` registrou `total_checkins=1`, `total_checkouts=1`, `total_chaves_emitidas=1` para 2026-04-24. |
| TC-150 | ✅ | Chave foi gerada com token único, `ativa=1` e `data_expiracao`; divergência de nome no documento anotada abaixo. |
| TC-151 | ✅ | Reemissão de chave para `KEY-9450220` gerou novo token; MySQL confirmou 2 chaves no total e apenas 1 ativa. |
| TC-240 | ✅ | Totem com heartbeat recente apareceu como Online. |
| TC-250 | ✅ | Tabela de reservas do admin exibiu coluna `Dt. Nascimento` com datas preenchidas, ex. `15/05/1990` e `02/02/1992`. |
| TC-320 | ✅ | Retestado após correção: OPERADOR com `hotelId=1` ignora `hotelId=2` da query e não recebe reservas de outro hotel. |
| TC-321 | ✅ | Retestado após correção: OPERADOR recebe `403` ao tentar `POST /api/hoteis` com payload válido. |
| TC-322 | ✅ | Request sem `Authorization` em `/api/hoteis` retornou `401`. |
| TC-323 | ✅ | Preflight CORS permitiu `Origin: http://localhost:5174` e não retornou `Access-Control-Allow-Origin` para `http://evil.local`. |
| TC-324 | ✅ | JWT inválido em `/api/hoteis` retornou `401`. |

Notas de divergência entre documentação e schema atual:
- `reservas.descriptor_facial` no documento corresponde a `reservas.face_descriptor` no banco.
- `reservas.data_checkin_real` e `reservas.data_checkout_real` aparecem no documento, mas não existem no schema atual.
- `chaves_digitais.expira_em` no documento corresponde a `chaves_digitais.data_expiracao` no banco.

Defeitos corrigidos e retestados:
- `TC-104`: auto-desativação do usuário logado bloqueada com `422`.
- `TC-131`: IdlePage passou a renderizar conteúdo ativo do payload público do totem.
- `TC-320`: operador não recebe reservas de outro hotel mesmo informando `hotelId` arbitrário.
- `TC-321`: endpoints de escrita de hotéis exigem `ADMIN`.

Observação de ambiente:
- `http://127.0.0.1:5173` foi incluído nas origens CORS de desenvolvimento e a ativação do totem com `5RIKKD` funcionou nesse host.

---

<a id="p0"></a>
# 🔴 P0 — Fluxos bloqueantes

O sistema precisa funcionar 100% nestes cenários antes de qualquer outro teste.

## 1.1 Subida do ambiente

**Objetivo:** garantir que as 3 superfícies sobem.

### TC-001 — Backend sobe e expõe actuator
- **Passos:** `docker-compose up mysql -d` → `cd backend && ./mvnw spring-boot:run`
- **Esperado:**
  - Log `Started CheckinHubApplication`
  - `GET http://localhost:8080/actuator/health` → `200 {"status":"UP"}`
  - `DataLoader` cria usuário `admin@flexmedia.com` na tabela `usuarios` (conferir no MySQL)
- **Banco:** tabela `usuarios` com 1 linha (role `ADMIN`, `ativo = 1`)

### TC-002 — Totem sobe e carrega setup
- **Passos:** `cd frontend-totem && npm run dev` → abrir `http://localhost:5173`
- **Esperado:** redirecionado para `/setup` (totem ainda não ativado) OU para `/` se `localStorage.totemConfig` já setado

### TC-003 — Admin sobe e carrega login
- **Passos:** `cd frontend-admin && npm run dev` → abrir `http://localhost:5174`
- **Esperado:** redireciona para `/login` com formulário visível

---

## 1.2 Autenticação do painel admin

### TC-010 — Login ADMIN FlexMedia (happy path)
- **Pré:** backend rodando, seed do DataLoader executado
- **Passos:** `/login` → email `admin@flexmedia.com` / senha `admin123` → Entrar
- **Esperado:**
  - `POST /api/auth/login` retorna `200` com `{ token, email, role: "ADMIN", hotelId: null }`
  - `localStorage` persiste `auth_token` e dados do usuário
  - Redireciona para `/dashboard`
  - Menu lateral exibe: Dashboard, Hotéis, Usuários (NÃO exibe Reservas/Totem)

### TC-011 — Login OPERADOR (gestor vinculado a hotel)
- **Pré:** criar hotel + usuário OPERADOR via `POST /api/auth/register` com role=OPERADOR e `hotelId` válido
- **Passos:** login com credenciais do OPERADOR
- **Esperado:**
  - Token retorna `role: "OPERADOR"`, `hotelId: <id>`
  - Redireciona para `/dashboard`
  - Menu exibe: Dashboard, Reservas, Totem (NÃO exibe Hotéis/Usuários)

### TC-012 — Login com credencial inválida
- **Passos:** `/login` → email correto + senha errada
- **Esperado:**
  - `POST /api/auth/login` retorna `401`
  - Mensagem de erro visível na UI
  - Permanece em `/login`, sem token no `localStorage`

### TC-013 — Acesso a rota protegida sem token
- **Passos:** deslogado, acessar `http://localhost:5174/dashboard` direto
- **Esperado:** `PrivateRoute` redireciona para `/login`

### TC-014 — Token expirado/inválido retorna 401
- **Passos:** editar `localStorage.auth_token` com string inválida → recarregar `/dashboard`
- **Esperado:** primeira chamada retorna `401` → interceptor axios limpa storage e redireciona para `/login`

### TC-015 — Logout limpa sessão
- **Passos:** logado → clicar em Sair
- **Esperado:** `localStorage` limpo, redireciona para `/login`, voltar no histórico não readquire sessão

---

## 1.3 Cadastro de hotel (ADMIN)

### TC-020 — Criar hotel (happy path)
- **Pré:** logado como ADMIN
- **Passos:** `/hoteis` → Novo Hotel → preencher Nome, CNPJ (formato `XX.XXX.XXX/XXXX-XX`), Cidade, UF → Salvar
- **Esperado:**
  - `POST /api/hoteis` retorna `201` com objeto criado (`id`, `ativo: true`)
  - Hotel aparece na listagem
  - **Banco:** linha criada em `hoteis` com `ativo = 1`

### TC-021 — Editar hotel
- **Passos:** lista → editar → alterar nome → Salvar
- **Esperado:** `PUT /api/hoteis/{id}` retorna `200`, lista atualizada

### TC-022 — Desativar hotel
- **Passos:** lista → Desativar
- **Esperado:** `PATCH /api/hoteis/{id}/desativar` retorna `200`, hotel marcado como inativo, **banco:** `ativo = 0`

### TC-023 — CNPJ duplicado bloqueia criação
- **Passos:** criar 2 hotéis com o mesmo CNPJ
- **Esperado:** segundo POST retorna `400`/`409`, mensagem de erro visível, registro não criado

---

## 1.4 Cadastro de reservas (OPERADOR)

### TC-030 — Criar reserva manual
- **Pré:** logado como OPERADOR de hotel X
- **Passos:** `/reservas` → Nova Reserva → preencher Código (único), Hóspede (Nome, CPF, DOB opcional, Email opcional), Quarto, Check-in, Check-out → Salvar
- **Esperado:**
  - `POST /api/reservas` retorna `201`
  - Reserva aparece com status `CONFIRMADA`
  - **Banco:** linha em `reservas` com `hotel_id = X`, `status = 'CONFIRMADA'`

### TC-031 — Código de reserva duplicado bloqueia
- **Passos:** criar 2 reservas com mesmo `codigoReserva` no mesmo hotel
- **Esperado:** segundo POST retorna `400`, reserva não criada

### TC-032 — Data de checkout anterior ao checkin é rejeitada
- **Passos:** criar reserva com `dataCheckout < dataCheckin`
- **Esperado:** POST retorna `400`, mensagem de validação

### TC-033 — Editar reserva
- **Passos:** lista → editar → alterar quarto ou datas → Salvar
- **Esperado:** `PUT /api/reservas/{id}` retorna `200`, lista atualizada

### TC-034 — Excluir reserva
- **Passos:** lista → Excluir → confirmar
- **Esperado:** reserva removida do banco (ou flagged como excluída — verificar implementação)

### TC-035 — Listagem com paginação e filtros
- **Passos:** criar 15+ reservas → navegar páginas → filtrar por status/busca
- **Esperado:** `GET /api/reservas?page=&size=&status=&busca=` retorna página correta, filtro aplicado no backend

---

## 1.5 Ativação do totem

### TC-040 — Criar totem no painel (OPERADOR)
- **Pré:** logado como OPERADOR
- **Passos:** `/totem` → aba Dispositivos → Novo Totem → nome/localização → Salvar
- **Esperado:**
  - `POST /api/hoteis/{hotelId}/totens` retorna `201` com `codigo` único gerado
  - Totem aparece na lista com status offline
  - **Banco:** linha em `totens` vinculada ao hotel, `ultimo_heartbeat = NULL`

### TC-041 — Ativar totem usando código
- **Pré:** totem criado (TC-040), código copiado
- **Passos:** abrir totem em `http://localhost:5173/setup` → colar código → Ativar
- **Esperado:**
  - `GET /api/totens/codigo/{codigo}` retorna config + `hotelId`
  - `localStorage.totemConfig` persistido (código, hotelId, logo, cores)
  - Redireciona para `/` (IdlePage)

### TC-042 — Heartbeat marca totem como online
- **Pré:** TC-041 concluído
- **Passos:** deixar totem aberto → aguardar ~60s → recarregar admin
- **Esperado:**
  - `POST /api/totens/{id}/heartbeat` chamado pelo totem
  - Admin (refresh 30s) mostra status Online
  - **Banco:** `totens.ultimo_heartbeat` atualizado

### TC-043 — Código de totem inválido
- **Passos:** `/setup` → código inexistente
- **Esperado:** mensagem de erro, permanece em `/setup`, `localStorage` não alterado

---

## 1.6 Fluxo de check-in no totem (CORAÇÃO DO PRODUTO)

### TC-050 — Check-in completo com código de reserva (happy path)
- **Pré:** totem ativado (TC-041), reserva CONFIRMADA criada (TC-030), câmera disponível no dispositivo
- **Passos:**
  1. Idle → tocar tela → vai para `/selecionar-idioma`
  2. Escolher Português → vai para `/buscar-reserva`
  3. Digitar código da reserva → Buscar
  4. Conferir dados do hóspede exibidos → Confirmar
  5. Permitir câmera → face-api.js detecta rosto → captura descriptor
  6. Confirmar cadastro facial
  7. Tela `/emitir-chave` exibe token digital
  8. Avançar para `/obrigado` → reset automático para `/`
- **Esperado (por etapa):**
  - Passo 3: `GET /api/checkin/reserva/{codigo}` → `200` com dados
  - Passo 4: valida que `status == CONFIRMADA` (se não, mostra erro)
  - Passo 6: `POST /api/checkin/confirmar/{id}` envia `{ descriptorFacial: Float32Array serializado, dataNascimento? }` → `200`
  - Passo 7: `POST /api/chaves/{reservaId}` → `200` com `{ token, expiraEm, tipo }`
- **Banco (estado final):**
  - `reservas.status` = `CHECKIN_REALIZADO`
  - `reservas.descriptor_facial` preenchido (BLOB/JSON com 128 floats)
  - `reservas.data_checkin_real` = timestamp atual
  - `chaves_digitais`: 1 linha ativa para a reserva, com `token`, `expira_em`, `ativa = 1`
  - `metricas_diarias`: contador de check-ins do hotel+data incrementado em 1

### TC-051 — Check-in buscando por CPF
- **Passos:** idêntico a TC-050, mas no passo 3 digitar CPF (formato `000.000.000-00` OU `00000000000`)
- **Esperado:** busca encontra reserva, fluxo segue igual

### TC-052 — Reserva não encontrada
- **Passos:** TC-050 passo 3 com código inexistente
- **Esperado:** mensagem clara, permanece em `/buscar-reserva`, permite nova tentativa

### TC-053 — Reserva já com check-in não permite novo check-in
- **Pré:** reserva já com `status = CHECKIN_REALIZADO`
- **Passos:** TC-050 até passo 4
- **Esperado:** `POST /api/checkin/confirmar` retorna `400` com mensagem de status inválido, UI exibe erro

### TC-054 — Reserva CANCELADA não permite check-in
- **Pré:** reserva com `status = CANCELADA`
- **Esperado:** ConfirmDataPage exibe aviso e não permite avançar

### TC-055 — Fallback de confirmação por data de nascimento quando face-api falha
- **Pré:** dispositivo sem câmera OU face-api.js não detecta rosto após N tentativas
- **Passos:** FacialRecognitionPage → usar fallback → digitar DOB → Confirmar
- **Esperado:**
  - Backend compara `dataNascimento` enviada com `reservas.hospede_data_nascimento`
  - Se bate: check-in confirmado sem descriptor facial (ou com flag)
  - Se não bate: `400`, mensagem de erro

---

## 1.7 Fluxo de check-out no totem

### TC-060 — Check-out completo (happy path)
- **Pré:** reserva com `status = CHECKIN_REALIZADO` (TC-050 concluído)
- **Passos:**
  1. Idle → tocar tela → idioma → `/checkout`
  2. Informar código/CPF → buscar
  3. Conferir resumo → Confirmar saída
  4. Tela sucesso → `/obrigado`
- **Esperado:**
  - Passo 2: `GET /api/checkout/reserva/{codigo}` → `200`
  - Passo 3: `POST /api/checkout/confirmar/{id}` → `200`
- **Banco:**
  - `reservas.status` = `CHECKOUT_REALIZADO`
  - `reservas.data_checkout_real` = timestamp
  - `chaves_digitais.ativa = 0` para todas as chaves da reserva
  - `metricas_diarias`: contador de check-outs incrementado

### TC-061 — Check-out em reserva sem check-in falha
- **Pré:** reserva `CONFIRMADA` (sem check-in)
- **Esperado:** backend retorna `400`, UI mostra erro

---

<a id="p1"></a>
# 🟠 P1 — Fluxos críticos

Funcionalidades essenciais que sustentam o produto ao longo do tempo.

## 2.1 Gestão de usuários (ADMIN)

### TC-100 — Cadastrar usuário OPERADOR vinculado a hotel
- **Pré:** logado como ADMIN, hotel existente
- **Passos:** `/usuarios` → Novo → nome, email, senha, role `OPERADOR`, hotel → Salvar
- **Esperado:** `POST /api/auth/register` → `201`, usuário aparece na lista, **banco:** `usuarios.hotel_id` preenchido

### TC-101 — Cadastrar outro ADMIN
- **Passos:** idêntico, role `ADMIN`, sem hotel
- **Esperado:** criado com `hotel_id = NULL`

### TC-102 — Email duplicado bloqueia
- **Esperado:** `POST /api/auth/register` → `400`/`409`

### TC-103 — Desativar usuário
- **Passos:** lista → Desativar
- **Esperado:** `DELETE /api/auth/usuarios/{id}` → `200`, `usuarios.ativo = 0`, usuário não consegue mais logar

### TC-104 — Não é possível desativar próprio usuário logado
- **Esperado:** backend ou UI bloqueia ação (validar comportamento esperado)

---

## 2.2 Reconhecimento facial na porta do quarto

### TC-110 — Validação facial bem-sucedida abre porta
- **Pré:** hóspede com check-in feito (descriptor armazenado)
- **Passos:** abrir totem em `/porta/{numeroQuarto}` → câmera → capturar rosto
- **Esperado:**
  - `POST /api/quartos/{quarto}/validar-face` com descriptor capturado
  - Backend compara com descriptor armazenado (distância euclidiana < threshold — conferir valor)
  - Retorna `{ autorizado: true }` → UI mostra "Acesso liberado"

### TC-111 — Validação facial nega acesso com rosto diferente
- **Passos:** outra pessoa tenta acesso
- **Esperado:** `autorizado: false`, UI mostra "Acesso negado"

### TC-112 — Quarto sem check-in ativo
- **Passos:** `/porta/{quartoSemReserva}`
- **Esperado:** retorna erro, UI informa que não há hóspede ativo no quarto

---

## 2.3 Configuração de aparência do totem

### TC-120 — Alterar logo e cores do hotel
- **Pré:** OPERADOR logado
- **Passos:** `/totem` → aba Aparência → upload logo, escolher cor primária → Salvar → recarregar totem
- **Esperado:**
  - `PUT /api/hoteis/{hotelId}/config` → `200`
  - **Banco:** `hotel_config` atualizado
  - Totem re-fetcha config via heartbeat ou reload → aparência aplicada (logo na IdlePage, cor dos botões)

### TC-121 — Config persiste entre reinícios do totem
- **Passos:** configurar → fechar navegador → reabrir
- **Esperado:** `localStorage.totemConfig` + `GET /api/hoteis/{hotelId}/config` → aparência mantida

---

## 2.4 Conteúdo exibido no totem (promoções/mídia)

### TC-130 — Criar conteúdo ativo
- **Passos:** `/totem` → aba Conteúdo → Novo → título, tipo (IMAGEM/VIDEO), URL, ordem, ativo=true → Salvar
- **Esperado:** `POST /api/conteudo` → `201`, aparece na lista

### TC-131 — Conteúdo ativo aparece na IdlePage do totem
- **Esperado:** Totem busca `GET /api/conteudo?apenasAtivos=true` e exibe na tela de idle (carrossel)

### TC-132 — Desativar conteúdo o remove da rotação
- **Passos:** editar → ativo=false → Salvar → recarregar totem
- **Esperado:** conteúdo some da IdlePage

### TC-133 — Excluir conteúdo
- **Esperado:** `DELETE /api/conteudo/{id}` → `200`, removido do banco

---

## 2.5 Dashboard de métricas

### TC-140 — Dashboard ADMIN (visão global)
- **Pré:** logado como ADMIN, 2+ hotéis com check-ins registrados
- **Passos:** `/dashboard`
- **Esperado:**
  - `GET /api/metricas/dashboard` (sem `hotelId`) retorna agregado de todos os hotéis
  - Cards mostram totais (check-ins, check-outs, chaves emitidas)
  - Gráfico 7 dias renderizado (Recharts)

### TC-141 — Dashboard OPERADOR (visão do hotel)
- **Pré:** logado como OPERADOR
- **Esperado:** `GET /api/metricas/dashboard?hotelId={hotel}` retorna apenas dados do seu hotel

### TC-142 — Métrica incrementa ao fazer check-in
- **Passos:** anotar contador atual → fazer TC-050 → recarregar dashboard
- **Esperado:** contador do dia +1

---

## 2.6 Emissão de chave digital

### TC-150 — Chave gerada tem token único e expiração
- **Esperado (TC-050 passo 7):**
  - `chaves_digitais.token` único (UUID ou similar)
  - `expira_em` = `dataCheckout + horário configurado`
  - `ativa = 1`

### TC-151 — Reemitir chave invalida a anterior
- **Pré:** reserva com chave ativa
- **Passos:** disparar `POST /api/chaves/{reservaId}` novamente
- **Esperado:** chave antiga fica `ativa = 0`, nova chave ativa criada

---

<a id="p2"></a>
# 🟡 P2 — Fluxos importantes

Funcionalidades de suporte e UX.

## 3.1 i18n do totem

### TC-200 — Textos traduzidos em Português, Inglês e Espanhol
- **Passos:** para cada idioma, passar por `/buscar-reserva`, `/confirmar-dados`, `/facial`, `/obrigado`
- **Esperado:** todos os textos traduzidos, sem chaves cruas (`key.not.found`)

### TC-201 — Formato de DOB muda com idioma
- **Passos:** PT → `DD/MM/AAAA`; EN → `MM/DD/YYYY`; ES → `DD/MM/AAAA`
- **Esperado:** placeholders e máscaras corretas

---

## 3.2 Auto-reset por inatividade

### TC-210 — Totem volta para idle após 90s sem interação
- **Passos:** navegar até `/buscar-reserva` → não mexer por 90s
- **Esperado:** `useIdleReset` dispara → estado limpo → `/`

### TC-211 — Interação reinicia o timer
- **Passos:** mexer a cada 30s
- **Esperado:** não reseta

---

## 3.3 Paginação de listagens

### TC-220 — Hotéis com paginação
- **Esperado:** `GET /api/hoteis?page=0&size=10` respeita parâmetros, UI navega corretamente

### TC-221 — Reservas com filtros combinados
- **Passos:** filtrar status `CONFIRMADA` + busca por nome
- **Esperado:** backend retorna intersecção correta

---

## 3.4 MockPMSAdapter

### TC-230 — Check-in notifica PMS mock
- **Pré:** `app.pms.adapter=mock` (padrão)
- **Passos:** fazer TC-050
- **Esperado:** log do backend mostra chamada ao `MockPMSAdapter.notificarCheckin`

---

## 3.5 Status online/offline de totens

### TC-240 — Totem com heartbeat recente aparece Online
- **Critério:** `ultimo_heartbeat` < 2 min atrás → Online; senão Offline

### TC-241 — Refresh automático da lista de totens (30s)
- **Passos:** admin aberto em aba → matar totem → aguardar 30s
- **Esperado:** status atualiza sem reload manual

---

## 3.6 Visualização de data de nascimento na reserva

### TC-250 — DOB exibida na tabela de reservas do admin
- **Esperado:** coluna mostra DOB quando preenchida, vazio quando não

---

<a id="p3"></a>
# 🟢 P3 — Edge cases e refinamento

## 4.1 Validações de campo

### TC-300 — CPF em formatos diferentes
- **Passos:** testar busca com `000.000.000-00`, `00000000000`, espaços extras, letras
- **Esperado:** backend aceita ambos os formatos numéricos; rejeita com letras

### TC-301 — CNPJ inválido
- **Esperado:** backend rejeita formatos diferentes de `XX.XXX.XXX/XXXX-XX`

### TC-302 — UF com 3 caracteres
- **Esperado:** validação rejeita (max 2)

### TC-303 — Email inválido na reserva
- **Esperado:** `@valid` rejeita `abc@` ou `abc.com`

### TC-304 — Nome do hóspede com > 150 caracteres
- **Esperado:** truncado ou rejeitado

---

## 4.2 Concorrência

### TC-310 — Dois totens tentando check-in da mesma reserva simultaneamente
- **Esperado:** apenas um sucede; o outro recebe `400` (status já alterado)

### TC-311 — Emitir chave durante check-out
- **Esperado:** comportamento definido (preferencialmente bloqueia)

---

## 4.3 Segurança

### TC-320 — OPERADOR tenta acessar dados de outro hotel
- **Passos:** logado como OPERADOR de hotel A → chamar `GET /api/reservas?hotelId=B` via curl
- **Esperado:** backend filtra por `hotelId` do JWT, retorna apenas hotel A (ou `403`)

### TC-321 — OPERADOR tenta criar hotel (endpoint ADMIN)
- **Esperado:** `POST /api/hoteis` → `403`

### TC-322 — Request sem Authorization header em rota protegida
- **Esperado:** `401`

### TC-323 — CORS bloqueia origem não permitida
- **Esperado:** config `SecurityConfig` permite apenas origens configuradas

### TC-324 — JWT adulterado é rejeitado
- **Passos:** alterar 1 caractere do token → chamar endpoint
- **Esperado:** `JwtAuthFilter` rejeita com `401`

---

## 4.4 Câmera e face-api.js

### TC-330 — Usuário nega permissão de câmera
- **Esperado:** UI oferece fallback por DOB (TC-055)

### TC-331 — Nenhum rosto detectado após N segundos
- **Esperado:** timeout, UI sugere fallback ou reposicionamento

### TC-332 — Múltiplos rostos no frame
- **Esperado:** UI pede para apenas 1 pessoa ficar em frente à câmera

### TC-333 — Descriptor corrompido no banco
- **Esperado:** `POST /api/quartos/{n}/validar-face` trata erro sem 500

---

## 4.5 Dados e integridade

### TC-340 — Soft delete de hotel com reservas ativas
- **Passos:** desativar hotel que tem reservas `CHECKIN_REALIZADO`
- **Esperado:** comportamento definido (bloquear? cascatear?) — documentar

### TC-341 — Excluir totem ativo em uso
- **Esperado:** totem em uso recebe erro no próximo heartbeat

### TC-342 — Reserva com check-out após expiração da chave
- **Esperado:** check-out ainda funciona, chave é invalidada mesmo se já expirada

---

## 4.6 UX e acessibilidade

### TC-350 — Botões do totem com área de toque grande (kiosk)
### TC-351 — Admin responsivo em resoluções de tablet
### TC-352 — Mensagens de erro claras e em PT-BR
### TC-353 — Loading states visíveis em todas as chamadas HTTP

---

<a id="apendice"></a>
# Apêndice — Setup de dados de teste

## A.1 Dados mínimos para testar P0

```sql
-- Após subir backend (DataLoader já cria admin):
-- 1. Via admin UI logado como admin@flexmedia.com / admin123:

-- Criar hotel teste
POST /api/hoteis { nome: "Hotel Teste", cnpj: "11.222.333/0001-44", cidade: "São Paulo", estado: "SP" }

-- Criar operador do hotel
POST /api/auth/register { nome: "Op Teste", email: "op@teste.com", senha: "op123", role: "OPERADOR", hotelId: 1 }

-- 2. Logar como op@teste.com e criar:
POST /api/reservas {
  codigoReserva: "RES001",
  hospedeNome: "João Silva",
  hospedeCpf: "123.456.789-00",
  hospedeDataNascimento: "1990-05-15",
  hospedeEmail: "joao@email.com",
  quartoNumero: "101",
  hotelId: 1,
  dataCheckin: "2026-04-16",
  dataCheckout: "2026-04-20"
}

-- Criar totem
POST /api/hoteis/1/totens { nome: "Totem Lobby", localizacao: "Recepção" }
-- Copiar o codigo retornado
```

## A.2 Limpeza entre suítes

```sql
-- Restaurar estado zero (cuidado em produção):
DELETE FROM chaves_digitais;
DELETE FROM metricas_diarias;
UPDATE reservas SET status = 'CONFIRMADA', face_descriptor = NULL;
```

## A.3 Ferramentas sugeridas

- **API:** Postman/Insomnia/Bruno com collection importando os endpoints
- **Banco:** MySQL Workbench ou `docker exec -it mysql mysql -ucheckinhub -pcheckinhub123 checkinhub`
- **E2E admin/totem:** Playwright (futuro)
- **Câmera em dev:** usar webcam real ou OBS Virtual Camera com foto para repetibilidade

## A.4 Convenção para registrar execução

Para cada execução da suíte, preencher tabela:

| TC | Data | Resultado | Observação |
|----|------|-----------|------------|
| TC-001 | 2026-04-24 | ✅ | Backend `UP`, MySQL `UP`, admin seed existente. |
| TC-012 | 2026-04-24 | ⚠️ | API retorna `401`, mas a UI não exibiu mensagem de erro. |
| TC-030 | 2026-04-24 | ⚠️ | Reserva criada, mas checkout/DOB não persistiram como informado no formulário. |
| TC-050 | 2026-04-24 | ⚠️ | Check-in concluiu sem câmera real; fallback manual bypassou DOB e `face_descriptor` ficou vazio. |
| TC-055 | 2026-04-24 | ❌ | Fallback manual não exigiu data de nascimento. |
| TC-060 | 2026-04-24 | ⚠️ | Checkout concluiu, mas fluxo real diverge do roteiro. |
