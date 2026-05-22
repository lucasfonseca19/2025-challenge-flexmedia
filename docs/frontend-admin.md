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
- `OPERADOR`: dashboard operacional do hotel vinculado, chamando `/api/metricas/dashboard?hotelId={hotelId}` para historico, idiomas, check-ins, check-outs e chaves emitidas no dia. O painel nao exibe ocupacao percentual enquanto o cadastro de hotel nao possuir total de quartos para calcular uma taxa real.

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

- carregar biblioteca de mídia do hotel;
- carregar presets salvos do hotel e permitir selecionar para editar, renomear inline ou duplicar como base para novo design;
- botão "Novo preset" acima da lista carrega o design base interno e permite criar preset do zero;
- exigir nome do design ao salvar, como `Design Saguão`;
- editar estilo global do preset: marca, fonte, modo claro/escuro e cor de acento;
- o fundo operacional nao e editavel livremente: o modo claro usa bege claro (`#F4EFE6`) com superficie `#FFF8EE`, e o modo escuro usa carvao (`#171A1F`) com superficie `#232A32`;
- editar conteúdo específico da tela inicial: campo único "Mídia de fundo" obrigatório (JPEG, PNG, WEBP ou MP4), escurecimento da mídia, carrossel de promoções/eventos/serviços, velocidade contínua do carrossel, cards recolhíveis/reordenáveis;
- ao escolher uma cor de acento com contraste insuficiente, o Studio preserva a cor como referência de marca e exibe a variante aplicada com o aviso "Ajustada para legibilidade";
- nos cards do carrossel, editar texto por idioma (`pt`, `en`, `es`); idiomas sem texto aparecem com indicador discreto no editor, e o campo legado `text` continua como fallback técnico;
- usar imagens/vídeos da biblioteca local de mídia;
- preview renderiza a tela inicial igual ao attract mode do totem, incluindo mídia de fundo em loop quando for vídeo e fontes dinâmicas;
- preview permite navegar por `Tela inicial`, `Escolha`, `Busca`, `Confirmação`, `Biometria`, `Chave` e `Check-out`; essas telas devem espelhar o runtime real do totem em frame portrait 9:16, usando mídia da idle somente na tela de escolha e usando fundo transacional fixo por `theme.mode` nas demais etapas;
- quando a janela tem menos de 1280 px de largura, o Studio oculta os painéis de edição/preview e mostra um aviso de largura mínima para evitar decisões visuais com o preview comprimido;
- salvar preset. A aplicacao ao dispositivo acontece na tela `Totens`, nao por publicacao global.

`TotemPage` gerencia apenas dispositivos: lista, codigo de ativacao, status online/offline, criacao, edicao de nome e atribuicao opcional de preset visual.

O Studio não expõe customização granular de cada tela transacional do hóspede. O gestor edita identidade global e conteúdo da tela inicial; o totem aplica essa identidade automaticamente ao fluxo interno com layout fixo quando o preset estiver atribuido ao dispositivo, preservando legibilidade e reduzindo atrito operacional. `backgroundColor` e `surfaceColor` antigos podem existir no JSON para compatibilidade, mas as telas internas ignoram esses valores e usam os tokens fixos do modo claro/escuro. Os blocos continuam existindo no payload técnico, mas a UI do Studio não apresenta mais lista/reordenação de blocos como tarefa principal do operador.

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
