# Frontend Admin — CheckIn Hub

Complementa `docs/ARQUITETURA.md` com detalhes do painel administrativo.

## Stack e runtime

React 19, TypeScript, Vite, Tailwind CSS v4, Axios, Recharts, React Router v7, Phosphor Icons e DnD Kit.

```bash
npm run dev    # http://localhost:5174
npm run build
```

Em desenvolvimento, o Vite proxy redireciona `/api` e `/uploads` para `http://localhost:8080`.

## Perfis

| Perfil | Escopo |
|---|---|
| `ADMIN` | Painel FlexMedia, hoteis e usuarios |
| `OPERADOR` | Hotel vinculado, reservas, totens e Totem Studio |

Auth persiste `admin_token` e `admin_usuario` no `localStorage`. O interceptor Axios injeta `Authorization: Bearer {token}` e redireciona para `/login` em `401`.

## Rotas

| Rota | Pagina | Perfil |
|---|---|---|
| `/login` | `LoginPage` | Publica |
| `/dashboard` | `DashboardPage` | ADMIN/OPERADOR |
| `/hoteis` | `HotelsPage` | ADMIN |
| `/usuarios` | `UsersPage` | ADMIN |
| `/reservas` | `ReservationsPage` | OPERADOR |
| `/totens` | `TotemPage` | OPERADOR |
| `/conteudo` | `ContentPage` | OPERADOR |

`/conteudo` e o Totem Studio.

## Servicos

`src/services/api.ts` agrupa:

- `authService`
- `hotelService`
- `reservaService`
- `metricasService`
- `usuarioService`
- `totemService`
- `configService`
- `conteudoService`
- `totemDesignService`
- `totemMediaService`

Para uploads, `totemMediaService.upload` usa `FormData`. Nao definir `Content-Type` manualmente; o browser precisa incluir o boundary do multipart.

## Totem Studio

Arquivos principais:

- `src/pages/ContentPage.tsx`: editor do Totem Studio.
- `src/components/TotemDesignRenderer.tsx`: renderer de preview.
- `src/constants/fonts.ts`: fontes disponíveis para customização.
- `src/types/index.ts`: tipos `TotemDesign`, `TotemBlock` e `TotemMediaAsset`.

Comportamento esperado:

- carregar rascunho e biblioteca de mídia do hotel;
- editar tema (incluindo fonte com dropdown de 6 opções), layout e blocos;
- usar imagens/vídeos da biblioteca;
- preview renderiza igual ao totem, incluindo vídeo em loop e fontes dinâmicas;
- salvar rascunho e publicar para os totens.

Fontes disponíveis: Satoshi, Outfit, Playfair Display, Cormorant Garamond, DM Sans, Space Grotesk (todas via CDN gratuito).

## Padroes de UI

- Layout administrativo com sidebar e header.
- A sidebar do desktop pode ser minimizada para modo icone-only; no mobile ela continua abrindo em overlay via botao hamburguer.
- Operacoes destrutivas devem ter confirmacao clara.
- Erros HTTP devem preferir `response.data.detail`.
- Telas operacionais devem evitar mocks silenciosos quando houver contrato real de backend.

## Validacao

```bash
npm run build
```
