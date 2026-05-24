# Backend — CheckIn Hub

Complementa `docs/ARQUITETURA.md` com detalhes de implementacao do backend.

## Stack

Java 17, Spring Boot 3.4.4, Spring Security, Spring Data JPA, MySQL 8.4, Lombok e JJWT.

## Pacotes principais

```text
br.com.flexmedia.checkinhub
├── common/          excecoes e handler global
├── config/          DataLoader, CORS, uploads estaticos
├── pms/             PMSAdapter e MockPMSAdapter
├── security/        Usuario, AuthController, JWT, SecurityConfig
└── modules/
    ├── hotel/       hoteis, reservas e configuracao simples
    ├── checkin/     busca e confirmacao de check-in
    ├── checkout/    busca e confirmacao de check-out
    ├── keys/        chaves digitais
    ├── metrics/     metricas diarias
    ├── conteudo/    conteudo legado do totem
    ├── totem/       dispositivos e heartbeat
    ├── totemdesign/ Totem Studio e midias
    └── room/        validacao de porta
```

## Entidades

| Entidade | Papel |
|---|---|
| `Hotel` | Cadastro do hotel e status ativo |
| `Reserva` | Dados do hospede, datas, quarto, status e `faceDescriptor` |
| `Usuario` | Login, role e hotel vinculado |
| `HotelConfig` | Nome exibido, logo, cor primaria e idiomas |
| `Totem` | Dispositivo ativado por `codigo`, heartbeat e preset visual opcional |
| `ConteudoTotem` | Conteudo legado de idle |
| `TotemDesign` | Preset nomeado do Totem Studio com tema/layout/blocos em JSON |
| `TotemMediaAsset` | Midias enviadas para o Totem Studio |
| `ChaveDigital` | Token emitido apos check-in |
| `MetricaDiaria` | Agregados por hotel/dia |

## Endpoints

### Auth

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | `/api/auth/login` | Publico | Login e JWT |
| POST | `/api/auth/register` | ADMIN | Cria usuario |
| GET | `/api/auth/usuarios` | ADMIN | Lista usuarios |
| DELETE | `/api/auth/usuarios/{id}` | ADMIN | Desativa usuario |

### Hoteis, reservas e configuracao

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/api/hoteis` | Autenticado | Lista paginada |
| POST | `/api/hoteis` | ADMIN | Cria hotel |
| PUT | `/api/hoteis/{id}` | ADMIN | Atualiza hotel |
| PATCH | `/api/hoteis/{id}/desativar` | ADMIN | Desativa hotel |
| GET | `/api/hoteis/{id}/config` | Publico | Config simples do totem |
| PUT | `/api/hoteis/{id}/config` | Autenticado | Salva config simples |
| GET | `/api/reservas` | Autenticado | Lista reservas por escopo |
| POST | `/api/reservas` | OPERADOR | Cria reserva no hotel vinculado e gera codigo alfanumerico curto |
| PUT | `/api/reservas/{id}` | Autenticado | Atualiza reserva |
| DELETE | `/api/reservas/{id}` | Autenticado | Remove reserva |

### Fluxos publicos do hospede

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/api/checkin/reserva/{codigoOuCpf}` | Publico | Busca reserva para check-in |
| POST | `/api/checkin/confirmar/{reservaId}` | Publico | Confirma check-in com face ou DOB |
| GET | `/api/checkout/reserva/{codigoOuCpf}` | Publico | Busca reserva para check-out |
| POST | `/api/checkout/confirmar/{reservaId}` | Publico | Confirma check-out |
| POST | `/api/chaves/{reservaId}` | Publico | Emite chave digital |
| POST | `/api/quartos/{quarto}/validar-face` | Publico | Retorna descriptor salvo para comparacao local |

### Totens e Totem Studio

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | `/api/hoteis/{hotelId}/totens` | Autenticado | Lista dispositivos |
| POST | `/api/hoteis/{hotelId}/totens` | Autenticado | Cria dispositivo com `designId` opcional |
| PUT | `/api/totens/{id}` | Autenticado | Atualiza nome e `designId` opcional do dispositivo |
| DELETE | `/api/totens/{id}` | Autenticado | Remove dispositivo |
| POST | `/api/totens/{id}/heartbeat` | Publico | Atualiza online/offline |
| GET | `/api/hoteis/{hotelId}/totem-designs` | Autenticado | Lista presets salvos |
| POST | `/api/hoteis/{hotelId}/totem-designs` | Autenticado | Cria preset nomeado |
| PUT | `/api/hoteis/{hotelId}/totem-designs/{designId}` | Autenticado | Atualiza preset nomeado |
| GET | `/api/hoteis/{hotelId}/totem-media` | Autenticado | Lista midias |
| POST | `/api/hoteis/{hotelId}/totem-media` | Autenticado | Upload multipart |
| DELETE | `/api/hoteis/{hotelId}/totem-media/{assetId}` | Autenticado | Remove midia |

## Padroes de implementacao

- `BusinessException` retorna erro de regra de negocio.
- `ResourceNotFoundException` retorna recurso inexistente.
- Falhas de upload retornam `422` com mensagem de negocio.
- Na criacao de reserva, o backend ignora qualquer `hotelId` arbitrario do operador, usa o hotel vinculado ao JWT e gera `codigoReserva` com ate 6 caracteres alfanumericos, sem hifens.
- PMS e chamado no check-in/check-out, mas falha externa nao deve bloquear a demo local.
- `ddl-auto=update` e aceitavel para dev; confirme schema real com `SHOW CREATE TABLE`.
- Uploads ficam em `backend/uploads/` e nao sao versionados.

## Validacao

```bash
./mvnw compile -q
./mvnw test
```
