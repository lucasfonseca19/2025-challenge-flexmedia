# Backend — Contexto Detalhado

**Stack:** Java 17 · Spring Boot 3.4.4 · Spring Security · Spring Data JPA · MySQL 8.4 · Lombok · JJWT 0.12.6

## Estrutura de pacotes

```
br.com.flexmedia.checkinhub
├── config/
│   └── DataLoader.java          — cria admin@flexmedia.com na primeira inicialização
├── common/
│   ├── exception/               — BusinessException, ResourceNotFoundException
│   └── handler/GlobalExceptionHandler.java
├── security/
│   ├── Usuario.java             — entidade de usuário
│   ├── RoleUsuario.java         — enum: ADMIN, OPERADOR
│   ├── AuthController.java      — /api/auth/login, /register, /usuarios
│   ├── jwt/
│   │   ├── JwtService.java      — gera/valida token, extrai email/hotelId/role
│   │   ├── JwtAuthFilter.java   — intercepta requests e injeta autenticação
│   │   └── JwtProperties.java   — lê app.jwt.secret e app.jwt.expiration-ms
│   └── config/SecurityConfig.java
├── pms/
│   ├── PMSAdapter.java          — interface: buscarReserva, confirmarCheckin, confirmarCheckout
│   ├── MockPMSAdapter.java      — implementação mock (ativa por padrão)
│   └── PMSReservaDTO.java
└── modules/
    ├── hotel/
    │   ├── Hotel.java           — entidade hotel
    │   ├── Reserva.java         — entidade reserva (inclui faceDescriptor TEXT)
    │   ├── StatusReserva.java   — enum: CONFIRMADA, CHECKIN_REALIZADO, CHECKOUT_REALIZADO, CANCELADA
    │   ├── HotelController.java — /api/hoteis
    │   ├── ReservaController.java — /api/reservas
    │   ├── HotelService.java
    │   ├── ReservaService.java
    │   ├── HotelRepository.java
    │   ├── ReservaRepository.java
    │   ├── config/
    │   │   ├── HotelConfig.java — entidade config do hotel (logo, cores, idiomas)
    │   │   ├── HotelConfigController.java
    │   │   ├── HotelConfigService.java
    │   │   └── HotelConfigRepository.java
    │   └── dto/                 — HotelRequestDTO, HotelResponseDTO, ReservaRequestDTO, ReservaResponseDTO
    ├── checkin/
    │   ├── CheckinController.java — /api/checkin
    │   ├── CheckinService.java
    │   └── CheckinConfirmDTO.java — campos: faceDescriptor (String), idioma (String)
    ├── checkout/
    │   ├── CheckoutController.java — /api/checkout
    │   └── CheckoutService.java
    ├── keys/
    │   ├── ChaveDigital.java    — entidade chave digital (token UUID)
    │   ├── ChavesController.java — /api/chaves
    │   ├── ChavesService.java
    │   └── TipoChave.java       — enum: DIGITAL, RFID
    ├── metrics/
    │   ├── MetricaDiaria.java   — agregado por hotel/dia (checkins, checkouts, chaves, idiomas)
    │   ├── MetricasController.java — /api/metricas
    │   └── MetricasService.java
    ├── conteudo/
    │   ├── ConteudoTotem.java   — slides, banners, vídeos do totem
    │   ├── ConteudoTotemController.java — /api/conteudo
    │   └── TipoConteudo.java    — enum: SLIDE, BANNER, VIDEO
    ├── totem/
    │   ├── Totem.java           — entidade totem (nome, codigo, ultimoHeartbeat)
    │   ├── TotemController.java — /api/hoteis/{id}/totens, /api/totens/{id}
    │   └── TotemService.java    — isOnline() = heartbeat < 2 min atrás
    └── room/
        └── RoomController.java  — /api/quartos/{quarto}/validar-face
```

## Entidades principais

### Hotel
```
id (IDENTITY) | nome | cnpj (unique) | cidade | estado | ativo | createdAt | updatedAt
```

### Reserva
```
id (IDENTITY) | codigoReserva (unique) | hospedeNome | hospedeCpf | hospedeEmail
| quartoNumero | hotel (FK) | hospedeDataNascimento | dataCheckin | dataCheckout
| status (enum) | faceDescriptor (TEXT) | createdAt | updatedAt
```
> `faceDescriptor` — JSON array de 128 números gerado pelo face-api.js. Ex: `"[0.12, -0.34, ...]"`

### Usuario
```
id (IDENTITY) | nome | email (unique) | senha (bcrypt) | role (enum) | hotel (FK, nullable) | ativo
```
> `hotel = null` → acesso global (ADMIN/FlexMedia). `hotel != null` → acesso restrito ao hotel (OPERADOR).

### HotelConfig
```
id (IDENTITY) | hotel (OneToOne FK) | nomeExibido | logoUrl | corPrimaria (default #1e40af)
| idiomasAtivos (CSV, default "pt,en")
```

### Totem
```
id (IDENTITY) | hotel (FK) | nome | codigo (alfanumérico gerado no cadastro) | ultimoHeartbeat | ativo | createdAt
```

### MetricaDiaria
```
id (IDENTITY) | hotel (FK) | data | totalCheckins | totalCheckouts | totalChavesEmitidas
| idiomaPt | idiomaEn | idiomaEs
```
> Unique constraint: (hotel_id, data) — um registro por hotel por dia.

### ChaveDigital
```
id (IDENTITY) | reserva (FK) | token (UUID, unique) | tipo (enum) | dataExpiracao | ativa | dataEmissao
```

## Endpoints completos

### Auth — `/api/auth`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Retorna JWT + dados do usuário |
| POST | `/api/auth/register` | ADMIN | Cria novo usuário |
| GET | `/api/auth/usuarios` | ADMIN | Lista todos os usuários |
| DELETE | `/api/auth/usuarios/{id}` | ADMIN | Desativa usuário |

### Hotéis — `/api/hoteis`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/hoteis` | Autenticado | Lista paginada |
| GET | `/api/hoteis/{id}` | Autenticado | Busca por ID |
| POST | `/api/hoteis` | Autenticado | Cria hotel |
| PUT | `/api/hoteis/{id}` | Autenticado | Atualiza hotel |
| PATCH | `/api/hoteis/{id}/desativar` | Autenticado | Desativa hotel |
| GET | `/api/hoteis/{id}/config` | **Público** | Retorna config do totem |
| PUT | `/api/hoteis/{id}/config` | Autenticado | Atualiza config |
| GET | `/api/hoteis/{id}/totens` | Autenticado | Lista totens do hotel |
| POST | `/api/hoteis/{id}/totens` | Autenticado | Cria totem |

### Reservas — `/api/reservas`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/reservas` | Autenticado | Lista paginada (params: hotelId, busca, status) |
| GET | `/api/reservas/{id}` | Autenticado | Por ID |
| GET | `/api/reservas/codigo/{codigo}` | Autenticado | Por código |
| POST | `/api/reservas` | Autenticado | Cria reserva |
| PUT | `/api/reservas/{id}` | Autenticado | Atualiza reserva |
| DELETE | `/api/reservas/{id}` | Autenticado | Remove reserva |

### Check-in — `/api/checkin`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/checkin/reserva/{codigoOuCpf}` | **Público** | Busca reserva por código ou CPF |
| POST | `/api/checkin/confirmar/{reservaId}` | **Público** | Confirma check-in. Body: `{faceDescriptor, idioma}` |

### Check-out — `/api/checkout`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/checkout/reserva/{codigoOuCpf}` | **Público** | Busca reserva para checkout |
| POST | `/api/checkout/confirmar/{reservaId}` | **Público** | Confirma checkout |

### Chaves — `/api/chaves`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/chaves/{reservaId}` | **Público** | Emite chave digital após check-in |

### Quartos — `/api/quartos`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/quartos/{quartoNumero}/validar-face` | **Público** | Retorna faceDescriptor armazenado da reserva ativa do quarto |

### Totens — `/api/totens`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| DELETE | `/api/totens/{id}` | Autenticado | Remove totem |
| POST | `/api/totens/{id}/heartbeat` | **Público** | Atualiza timestamp de último acesso |

### Métricas — `/api/metricas`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/metricas/dashboard` | Autenticado | Totais do dia + histórico 7 dias. Param: `hotelId` |
| GET | `/api/metricas/historico` | Autenticado | Histórico N dias. Params: `hotelId`, `dias` |

### Conteúdo — `/api/conteudo`
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/conteudo` | **Público** | Lista conteúdo. Params: `hotelId`, `apenasAtivos` |
| POST | `/api/conteudo` | Autenticado | Cria conteúdo |
| PUT | `/api/conteudo/{id}` | Autenticado | Atualiza |
| DELETE | `/api/conteudo/{id}` | Autenticado | Remove |

## Autenticação e JWT

O JWT carrega 3 claims além do padrão:
- `sub` → email do usuário
- `hotelId` → Long (null se ADMIN global)
- `role` → String ("ADMIN" ou "OPERADOR")

**Fluxo:** `POST /api/auth/login` com `{email, senha}` → retorna `{token, usuario}`.
O token deve ser enviado como `Authorization: Bearer {token}` em todas as requisições autenticadas.

## Padrões do projeto

- **DTOs:** toda entidade tem `RequestDTO` (entrada) e `ResponseDTO` (saída) com método estático `from(Entidade e)`
- **Exceções:** `BusinessException` para regras de negócio (400), `ResourceNotFoundException` para not found (404)
- **PMS:** sempre chamar `pmsAdapter.confirmarCheckin/Checkout` dentro de try/catch — falha do PMS não deve impedir o fluxo
- **Métricas:** registrar via `MetricasService` ao final de cada checkin, checkout e emissão de chave
- **Timestamps:** usar `@CreationTimestamp` e `@UpdateTimestamp` do Hibernate
- **IDs:** sempre `@GeneratedValue(strategy = GenerationType.IDENTITY)` — não usar SEQUENCE

## Configuração do banco

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/checkinhub?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
spring.datasource.username=checkinhub
spring.datasource.password=checkinhub123
spring.jpa.hibernate.ddl-auto=update   # cria/atualiza schema automaticamente
```

## Testes

- Testes unitários: `*Test.java` — usam Mockito, não sobem contexto Spring
- Testes de integração: `*IT.java` — usam H2 in-memory (arquivo `application-test.properties`)
- Rodar: `./mvnw test`
- Compilar sem rodar testes: `./mvnw compile -q`
