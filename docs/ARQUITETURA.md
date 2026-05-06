# Arquitetura Tecnica — CheckIn Hub

Este documento e a fonte tecnica central do projeto. Os documentos especificos de backend, admin, totem, operacao local e cenarios de teste complementam esta visao.

## Visao geral

CheckIn Hub e um sistema academico FIAP para autoatendimento hoteleiro. Ele simula um ecossistema com painel administrativo, totem fisico e backend REST.

As tres superficies sao independentes:

| Superficie | Pasta | Porta | Responsabilidade |
|---|---|---:|---|
| Backend | `backend` | `8080` | API REST, regras de negocio, JWT, MySQL, arquivos de upload |
| Totem | `frontend-totem` | `5173` | Fluxo publico do hospede, kiosk mode, camera, reconhecimento facial local |
| Admin | `frontend-admin` | `5174` | Painel FlexMedia e gestor hoteleiro, reservas, totens, Totem Studio |

Nao ha compartilhamento de codigo entre os fronts. Contratos sao compartilhados apenas por HTTP e tipos duplicados em TypeScript.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Backend | Java 17, Spring Boot 3.4.4, Spring Security, Spring Data JPA, Lombok, JJWT |
| Banco | MySQL 8.4, `GenerationType.IDENTITY`, `ddl-auto=update` em desenvolvimento |
| Frontends | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Axios |
| Admin UI | Recharts, Phosphor Icons, DnD Kit |
| Biometria | `@vladmandic/human` rodando localmente no browser |
| PMS | `MockPMSAdapter` por padrao (`app.pms.adapter=mock`) |

Decisoes atuais:

- MySQL 8.4 e o banco oficial do projeto.
- Redis foi removido e nao deve ser reintroduzido.
- Nenhuma API paga deve ser usada.
- O backend nao compara faces e nao processa imagem biometrica; ele persiste e serve descriptors.

## Banco e entidades principais

Banco local padrao:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/checkinhub?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
spring.datasource.username=checkinhub
spring.datasource.password=checkinhub123
spring.jpa.hibernate.ddl-auto=update
```

Entidades centrais:

- `Hotel`: cadastro do hotel e status ativo.
- `Usuario`: usuarios ADMIN e OPERADOR, com OPERADOR vinculado a um hotel.
- `Reserva`: reserva do hospede, estado do fluxo e `faceDescriptor`.
- `ChaveDigital`: token emitido apos check-in.
- `Totem`: dispositivo ativado por `codigo`, com heartbeat para online/offline.
- `HotelConfig`: configuracao simples de marca, logo, cor e idiomas.
- `ConteudoTotem`: conteudo legado de idle por slides/banners/videos.
- `TotemDesign`: rascunho/publicado do Totem Studio, com JSON de tema, layout e blocos.
- `TotemMediaAsset`: arquivos enviados para uso no Totem Studio.
- `MetricaDiaria`: agregados por hotel/dia.

State machine de reservas:

```text
CONFIRMADA -> CHECKIN_REALIZADO -> CHECKOUT_REALIZADO
CONFIRMADA -> CANCELADA
```

## Autenticacao e autorizacao

Auth usa JWT com os claims:

- `sub`: email do usuario.
- `hotelId`: hotel do operador; `null` para ADMIN global.
- `role`: `ADMIN` ou `OPERADOR`.

Regras:

- Endpoints operacionais do hospede sao publicos.
- Endpoints administrativos exigem token.
- OPERADOR deve atuar somente no hotel associado.
- ADMIN tem visao global e gerencia hoteis/usuarios.

## Fluxos principais

Check-in no totem:

```text
/ -> /selecionar-idioma -> /buscar-reserva -> /confirmar-dados
-> /facial -> /emitir-chave -> /obrigado
```

Check-out:

```text
/checkout -> busca reserva -> confirma saida -> /obrigado
```

Porta do quarto:

```text
/porta/:quarto -> camera -> descriptor ao vivo -> backend retorna descriptor salvo -> comparacao local -> abre/nega acesso
```

## Biometria facial

O frontend do totem usa `@vladmandic/human` com modelos locais em `frontend-totem/public/models/human`.

Fluxo de cadastro:

1. Browser abre camera.
2. Human detecta rosto e gera embedding.
3. Frontend envia `faceDescriptor` em JSON no check-in.
4. Backend persiste o descriptor na reserva.

Fluxo de validacao da porta:

1. Browser captura descriptor ao vivo.
2. Backend retorna o descriptor salvo da reserva ativa do quarto.
3. Frontend compara localmente com Human.
4. Similaridade suficiente libera acesso.

Fallback por data de nascimento continua disponivel quando camera/Human nao consegue concluir.

## Totem Studio

Totem Studio e a customizacao visual por hotel, editada no admin e renderizada no totem.

Modelo funcional:

- `TotemDesign` tem status `DRAFT` ou `PUBLISHED`.
- `theme`, `layout` e `blocks` sao JSON persistidos em colunas `TEXT`.
- O admin edita rascunho, visualiza preview e publica.
- O totem busca o design publicado e renderiza a idle customizada.
- Se nao houver design publicado, o totem usa o fluxo visual antigo como fallback.

Endpoints principais:

| Metodo | Rota | Auth | Uso |
|---|---|---|---|
| GET | `/api/hoteis/{hotelId}/totem-design/draft` | Autenticado | Buscar/criar rascunho |
| PUT | `/api/hoteis/{hotelId}/totem-design/draft` | Autenticado | Salvar rascunho |
| POST | `/api/hoteis/{hotelId}/totem-design/publish` | Autenticado | Publicar rascunho |
| GET | `/api/hoteis/{hotelId}/totem-design/published` | Publico | Totem busca design publicado |
| GET | `/api/hoteis/{hotelId}/totem-media` | Autenticado | Listar midias |
| POST | `/api/hoteis/{hotelId}/totem-media` | Autenticado | Upload multipart |
| DELETE | `/api/hoteis/{hotelId}/totem-media/{assetId}` | Autenticado | Remover midia |

Uploads:

- Arquivos sao gravados em `backend/uploads/totem/{hotelId}/`.
- URLs publicas usam `/uploads/totem/{hotelId}/{arquivo}`.
- Em desenvolvimento, os dois Vite configs proxyam `/uploads` para `http://localhost:8080`.
- `backend/uploads/` e artefato de runtime e fica fora do Git.

Tipos aceitos:

- Imagens: JPEG, PNG, WEBP ate 8 MB.
- Video: MP4 ate 80 MB.

## Documentos complementares

- `docs/backend.md`: pacotes, entidades e endpoints do backend.
- `docs/frontend-admin.md`: rotas, servicos e estrutura do painel admin.
- `docs/frontend-totem.md`: fluxo do totem, Human, i18n e runtime.
- `docs/REQUISITOS_CHALLENGE.md`: requisitos do enunciado, entregas e aderencia do MVP.
- `docs/OPERACAO_LOCAL.md`: comandos locais, queries e contratos de homologacao.
- `docs/CENARIOS_TESTE.md`: tracker vivo de QA manual.
- `docs/TASKS.md`: historico legado de planejamento, nao fonte atual de arquitetura.
