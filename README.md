# CheckIn Hub

Totem de autoatendimento hoteleiro para check-in, check-out, emissao de chave digital e validacao facial local.

Projeto academico FIAP Challenge Flexmedia 2025-2.

## Superficies

| Superficie | Pasta | Porta | Stack |
|---|---|---:|---|
| Backend | `backend` | `8080` | Spring Boot 3.4.4, Java 17, MySQL |
| Totem | `frontend-totem` | `5173` | React 19, Vite, Tailwind, Human |
| Admin | `frontend-admin` | `5174` | React 19, Vite, Tailwind |

Os tres projetos sao independentes e se comunicam via API REST.

## Rodando localmente com Docker

Este modo sobe banco, backend, totem e admin juntos. Requer Docker Desktop ou Docker Engine com Compose.

```bash
docker compose up --build
```

Se a maquina usar o binario antigo do Compose:

```bash
docker-compose up --build
```

URLs:

| Servico | URL |
|---|---|
| Backend | `http://localhost:8080` |
| Totem | `http://localhost:5173` |
| Admin | `http://localhost:5174` |

Para parar:

```bash
docker compose down
```

No Docker, o MySQL fica no volume `mysql_data` e as midias enviadas pelo Totem Studio ficam no volume `backend_uploads`, montado em `/app/uploads` dentro do container backend.

Para apagar tambem os volumes do MySQL e dos uploads, recriando banco e midias do zero:

```bash
docker compose down -v
```

## Rodando localmente em modo desenvolvimento

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
curl -sS http://localhost:8080/actuator/health
```

Credenciais seed:

| Tipo | Valor |
|---|---|
| Admin | `admin@flexmedia.com` / `admin123` |
| MySQL | `checkinhub` / `checkinhub123` |

## Fluxo do produto

Check-in:

```text
/ -> /buscar-reserva -> /confirmar-dados
-> /facial -> /emitir-chave -> /obrigado
```

Check-out:

```text
/checkout -> busca reserva -> confirma saida -> /obrigado
```

Porta:

```text
/porta/:quarto -> camera -> comparacao facial local -> abre/nega acesso
```

## Totem Studio

O admin possui o Totem Studio para customizar o visual do totem por hotel:

- temas, cores, densidade e layout;
- blocos visuais reordenaveis;
- biblioteca de imagens e videos;
- preview do totem;
- rascunho e publicacao por hotel.

O totem busca o design publicado e renderiza a idle customizada.

## Documentacao

- `docs/ARQUITETURA.md`: fonte tecnica central.
- `docs/backend.md`: detalhes do backend.
- `docs/frontend-admin.md`: detalhes do painel admin.
- `docs/frontend-totem.md`: detalhes do totem.
- `docs/REQUISITOS_CHALLENGE.md`: requisitos do enunciado e aderencia do MVP.
- `docs/OPERACAO_LOCAL.md`: comandos, banco e contratos locais.
- `docs/CENARIOS_TESTE.md`: tracker de homologacao manual.
- `AGENTS.md` e `CLAUDE.md`: contexto resumido para agentes.

## Validacao

```bash
cd backend && ./mvnw compile -q
cd frontend-admin && npm run build
cd frontend-totem && npm run build
```
