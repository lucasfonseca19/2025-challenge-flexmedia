# Operação Local e Contratos do Sistema

> Objetivo: documentar como o CheckIn Hub funciona hoje para que mudanças de UI/UX sejam feitas com segurança, validando o banco e preservando os fluxos que já passaram na homologação.

## Superfícies locais

| Superfície | Pasta | Porta | Responsabilidade |
|---|---|---:|---|
| Backend | `backend` | `8080` | API REST, regras de negócio, JWT, persistência MySQL |
| Totem | `frontend-totem` | `5173` | Fluxo público do hóspede, check-in, check-out, porta e Human no browser |
| Admin | `frontend-admin` | `5174` | Gestão de hotéis, usuários, reservas, totens, conteúdo e métricas |
| MySQL | Docker/local | `3306` | Banco `checkinhub` |

### Subida completa com Docker

Este modo sobe MySQL, backend, totem e admin juntos. E o caminho mais simples para colegas testarem o projeto sem abrir quatro terminais.

```bash
docker compose up --build
```

Alternativa para instalacoes com o binario antigo:

```bash
docker-compose up --build
```

URLs expostas na maquina:

```text
Backend: http://localhost:8080
Totem:   http://localhost:5173
Admin:   http://localhost:5174
```

Para parar os containers:

```bash
docker compose down
```

No Docker, o MySQL fica no volume `mysql_data` e as midias enviadas pelo Totem Studio ficam no volume `backend_uploads`, montado em `/app/uploads` dentro do container backend.

Para recriar banco e midias do zero, removendo os volumes do MySQL e dos uploads:

```bash
docker compose down -v
```

### Subida em modo desenvolvimento

Use este modo quando for editar codigo localmente com hot reload nos frontends.

```bash
docker-compose up mysql -d

cd backend
./mvnw spring-boot:run

cd frontend-totem
npm run dev

cd frontend-admin
npm run dev
```

Health check:

```bash
curl -sS -i http://localhost:8080/actuator/health
```

## Banco de dados local

Configuração atual do backend:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/checkinhub?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo
spring.datasource.username=checkinhub
spring.datasource.password=checkinhub123
spring.jpa.hibernate.ddl-auto=update
```

Comando preferido no macOS com `mysql-client` via Homebrew:

```bash
/opt/homebrew/opt/mysql-client/bin/mysql -h127.0.0.1 -P3306 -ucheckinhub -pcheckinhub123 -Dcheckinhub -e "SHOW TABLES;"
```

Alternativa se `mysql` estiver no `PATH`:

```bash
mysql -h127.0.0.1 -P3306 -ucheckinhub -pcheckinhub123 -Dcheckinhub -e "SHOW TABLES;"
```

Se estiver usando o container:

```bash
docker exec checkinhub-mysql mysql -ucheckinhub -pcheckinhub123 checkinhub -e "SHOW TABLES;"
```

Regras para alterações manuais:

- Antes de qualquer `UPDATE` ou `DELETE`, rode um `SELECT` com a mesma cláusula `WHERE`.
- Trate `reservas.face_descriptor` como payload opaco. Para limpar, use `NULL`; não edite o JSON manualmente.
- Em ambiente local de testes, dados podem ser recriados, mas não apague massa útil sem registrar no tracker de testes.
- `spring.jpa.hibernate.ddl-auto=update` cria/ajusta colunas, mas não remove colunas obsoletas. Confirme o schema real com `DESCRIBE` ou `SHOW CREATE TABLE`.

## Tabelas críticas

### `reservas`

Campos operacionais principais:

```text
id
codigo_reserva
hotel_id
hospede_nome
hospede_cpf
hospede_data_nascimento
quarto_numero
data_checkin
data_checkout
status
face_descriptor
created_at
updated_at
```

`codigo_reserva` e preenchido pela API de reservas na criacao. O formato atual e alfanumerico curto, com ate 6 caracteres e sem hifens, para digitacao pelo hospede no totem.

State machine:

```text
CONFIRMADA -> CHECKIN_REALIZADO -> CHECKOUT_REALIZADO
CONFIRMADA -> CANCELADA
```

O campo `face_descriptor` guarda o embedding facial do Human como JSON array. Para descriptors válidos do Human, a homologação espera:

```sql
JSON_VALID(face_descriptor) = 1
JSON_LENGTH(face_descriptor) = 1024
```

### `chaves_digitais`

Campos operacionais principais:

```text
id
reserva_id
token
tipo
ativa
data_emissao
data_expiracao
```

Após check-in bem-sucedido, deve existir uma chave ativa para a reserva. Em reemissão, o comportamento esperado é manter apenas a chave mais recente ativa.

### `totens`

Campos operacionais principais:

```text
id
hotel_id
nome
codigo
ativo
ultimo_heartbeat
created_at
```

`codigo` é o identificador usado para ativar o totem em `/setup`. Heartbeat recente indica dispositivo online no admin.

### `hotel_config`, `conteudo_totem`, `totem_designs` e `totem_media_assets`

`hotel_config` e `conteudo_totem` são o contrato simples/legado da IdlePage.

O Totem Studio usa:

```text
totem_designs
id
hotel_id
status
theme
layout
blocks
created_at
updated_at

totem_media_assets
id
hotel_id
original_name
stored_name
mime_type
size_bytes
public_url
width
height
created_at
```

`theme`, `layout` e `blocks` devem ser `TEXT`, porque o JSON dos blocos pode passar de 255 bytes. `public_url` aponta para `/uploads/totem/{hotelId}/{arquivo}`.

Arquivos enviados pelo Totem Studio ficam em `backend/uploads/` e não devem ser versionados.

## Contrato da biometria facial

A biometria atual é demonstrativa, gratuita e local:

- Biblioteca: `@vladmandic/human`.
- Modelos locais: `frontend-totem/public/models/human`.
- Nenhuma imagem é enviada para API externa.
- Backend não compara faces; apenas persiste e retorna `face_descriptor`.

Enrollment no check-in:

```text
/facial
-> Human captura embedding no vídeo
-> POST /api/checkin/confirmar/{reservaId}
   body: { "faceDescriptor": "[...]", "idioma": "pt" }
-> backend salva em reservas.face_descriptor
-> /emitir-chave gera chave digital
```

Fallback por data de nascimento:

```text
/facial
-> usuário escolhe data de nascimento
-> POST /api/checkin/confirmar/{reservaId}
   body: { "dataNascimento": "1990-01-01", "idioma": "pt" }
-> backend confirma sem preencher face_descriptor
```

Porta do quarto:

```text
/porta/:quarto
-> Human captura embedding ao vivo
-> POST /api/quartos/{quarto}/validar-face
-> backend retorna descriptorArmazenado da reserva CHECKIN_REALIZADO
-> frontend compara localmente com human.match.similarity(...)
-> similarity >= 0.5 libera acesso
```

Endpoints públicos envolvidos:

```text
GET  /api/checkin/reserva/{codigoOuCpf}
POST /api/checkin/confirmar/{reservaId}
POST /api/chaves/{reservaId}
GET  /api/checkout/reserva/{codigoOuCpf}
POST /api/checkout/confirmar/{reservaId}
POST /api/quartos/{quartoNumero}/validar-face
POST /api/totens/{id}/heartbeat
```

## Queries de validação recorrentes

Reserva e descriptor:

```sql
SELECT
  id,
  codigo_reserva,
  hospede_nome,
  quarto_numero,
  status,
  face_descriptor IS NOT NULL AS tem_descriptor,
  CASE
    WHEN face_descriptor IS NULL THEN NULL
    ELSE JSON_VALID(face_descriptor)
  END AS descriptor_json_valido,
  CASE
    WHEN face_descriptor IS NULL OR JSON_VALID(face_descriptor) = 0 THEN NULL
    ELSE JSON_LENGTH(face_descriptor)
  END AS descriptor_dimensoes,
  updated_at
FROM reservas
WHERE codigo_reserva = 'CODIGO_AQUI';
```

Chaves da reserva:

```sql
SELECT
  id,
  reserva_id,
  token,
  tipo,
  ativa,
  data_emissao,
  data_expiracao
FROM chaves_digitais
WHERE reserva_id = (SELECT id FROM reservas WHERE codigo_reserva = 'CODIGO_AQUI')
ORDER BY id DESC;
```

Porta por quarto:

```sql
SELECT
  codigo_reserva,
  hospede_nome,
  quarto_numero,
  status,
  face_descriptor IS NOT NULL AS tem_descriptor
FROM reservas
WHERE quarto_numero = '701'
ORDER BY updated_at DESC;
```

Totem e heartbeat:

```sql
SELECT id, hotel_id, nome, codigo, ativo, ultimo_heartbeat
FROM totens
ORDER BY id DESC;
```

## Massa de re-homologação atual

Criada em 2026-05-05 para validar os fluxos principais e negativos:

| Código | Quarto | Estado esperado | Uso |
|---|---:|---|---|
| `HML-DOB-OK` | `701` | `CHECKIN_REALIZADO`, sem descriptor, com chave ativa | Fallback por data de nascimento |
| `HML-CANCELADA` | `702` | `CANCELADA` | Bloqueio de reserva cancelada |
| `HML-JA-CHECKIN` | `703` | `CHECKIN_REALIZADO`, descriptor dummy | Bloqueio de novo check-in e retorno positivo do endpoint da porta |
| `HML-SEM-DESC` | `704` | `CHECKIN_REALIZADO`, sem descriptor | Porta sem face cadastrada |
| `HML-DESC-RUIM` | `705` | `CHECKIN_REALIZADO`, descriptor corrompido | Falha controlada de parsing/comparação no frontend |

## Checklist antes de refinamento visual

Antes de alterar telas do totem:

- Ler `docs/frontend-totem.md` e este documento.
- Identificar se a tela faz parte de check-in, checkout, porta ou idle.
- Preservar navegação e rotas públicas do fluxo.
- Preservar `TotemContext`: `idioma`, `reserva`, `fluxo`, `resetar`.
- Não remover fallback por data de nascimento.
- Não mover comparação facial para o backend.
- Não trocar `face_descriptor` por outro campo sem ajustar backend, docs e massa de teste.
- Não depender de CDN para modelos do Human.

Depois de alterar telas do totem:

- Rodar `npm run build` em `frontend-totem`.
- Testar navegação idle -> idioma -> busca -> confirmação.
- Se mexeu em `/facial`, testar câmera real e fallback DOB.
- Se mexeu em `/porta/:quarto`, testar mesmo rosto, rosto diferente, quarto sem descriptor e quarto sem check-in ativo.
- Validar no banco a transição da reserva e a emissão de chave quando houver check-in.

Antes de alterar backend ou banco:

- Rodar `./mvnw compile -q` em `backend`.
- Conferir schema real com `DESCRIBE`.
- Atualizar `docs/backend.md`, `docs/frontend-totem.md` e `docs/CENARIOS_TESTE.md` se o contrato mudar.
- Registrar o resultado em `docs/CENARIOS_TESTE.md`.

## Limitações conhecidas de homologação

- A validação automatizada em navegador ajuda a conferir navegação, textos, bloqueios e estados visuais, mas não substitui teste com câmera real.
- A validação facial com Human precisa ser testada em navegador com acesso à webcam.
- O reconhecimento é demonstrativo; não é equivalente a Face ID com sensor de profundidade.
