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
| `/totem` | `TotemPage` | OPERADOR |
| `/conteudo` | `ContentPage` | OPERADOR |

`/conteudo` e o Totem Studio. Rotas fora do perfil do usuario redirecionam para `/dashboard`: ADMIN nao acessa as telas operacionais do hotel, e OPERADOR nao acessa cadastros globais de hoteis/usuarios.

## Dashboard

`DashboardPage` renderiza experiencias diferentes por perfil:

- `ADMIN`: console FlexMedia de plataforma, com indicadores globais, total de hoteis, usuarios/operadores e atalhos para cadastro de hoteis e usuarios.
- `OPERADOR`: dashboard operacional do hotel vinculado, chamando `/api/metricas/dashboard?hotelId={hotelId}` para historico, idiomas e totais do dia.

O dashboard nao usa mais dados simulados silenciosos quando o backend falha; em erro de API ou permissao, exibe estado de indisponibilidade.

## Reservas

`ReservationsPage` e uma tela operacional do `OPERADOR`. O formulario de nova reserva nao expõe seleção de hotel nem digitação manual de codigo: o hotel vem do usuario logado e o backend retorna um `codigoReserva` alfanumerico curto para o hospede usar no totem. Na edicao, o codigo aparece apenas como informacao gerada e nao deve ser alterado pelo gerente.

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
- editar estilo global da plataforma do hotel: nome, fonte, cores e densidade;
- editar conteúdo específico da tela inicial: vídeo de fundo, imagem de fallback, escurecimento da mídia, carrossel de promoções/eventos/serviços, velocidade contínua do carrossel, cards recolhíveis/reordenáveis e rodapé;
- nos cards do carrossel, editar texto por idioma (`pt`, `en`, `es`); idiomas sem texto aparecem com indicador discreto no editor, e o campo legado `text` continua como fallback técnico;
- usar imagens/vídeos da biblioteca local de mídia;
- preview renderiza a tela inicial igual ao attract mode do totem, incluindo vídeo de fundo em loop e fontes dinâmicas;
- preview permite navegar por `Tela inicial`, `Escolha`, `Busca`, `Confirmação`, `Biometria`, `Chave` e `Check-out`;
- salvar rascunho e publicar para os totens.

O Studio não expõe customização granular de cada tela transacional do hóspede. O gestor edita identidade global e conteúdo da tela inicial; o totem aplica essa identidade automaticamente ao fluxo interno com layout fixo, preservando legibilidade e reduzindo atrito operacional. Os blocos continuam existindo no payload técnico, mas a UI do Studio não apresenta mais lista/reordenação de blocos como tarefa principal do operador.

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
