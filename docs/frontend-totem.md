# Frontend Totem — CheckIn Hub

Complementa `docs/ARQUITETURA.md` com detalhes do runtime do totem.

## Stack e runtime

React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Axios e `@vladmandic/human`.

```bash
npm run dev    # http://localhost:5173
npm run build
```

Em desenvolvimento, o Vite proxy redireciona `/api` e `/uploads` para `http://localhost:8080`.

## Rotas

| Rota | Pagina | Uso |
|---|---|---|
| `/` | `IdlePage` | Tela de repouso e entrada do fluxo com seleção de idioma integrada |
| `/setup` | `SetupPage` | Ativacao do totem por codigo |
| `/buscar-reserva` | `SearchReservationPage` | Busca por codigo ou CPF |
| `/confirmar-dados` | `ConfirmDataPage` | Confirma dados da reserva |
| `/facial` | `FacialRecognitionPage` | Cadastra face ou fallback por DOB |
| `/emitir-chave` | `IssueKeyPage` | Emite chave digital |
| `/checkout` | `CheckoutPage` | Fluxo de saida |
| `/obrigado` | `ThankYouPage` | Encerramento |
| `/porta/:quarto` | `DoorPage` | Simulador de porta |

## Estado local

`TotemContext` guarda:

- idioma atual (selecionado na tela inicial, sem pagina separada);
- reserva selecionada;
- fluxo `checkin` ou `checkout`;
- configuracao persistida do totem;
- reset de estado ao voltar para idle.

A configuracao do totem e persistida em `localStorage` para permitir kiosk mode sem reativar a cada reload.

## Idle customizada

`IdlePage` opera em modo attract — tela de repouso que convida o hóspede a interagir:

- Busca `TotemDesign` publicado via `totemDesignService.buscarPublicado(hotelId)`;
- Se o design tem bloco `video` visível, ele vira o vídeo de fundo do attract mode;
- Se tem bloco `hero` com imagem, ela vira o background do attract;
- Sem mídia, usa cor primária com gradientes sutis;
- Se tem bloco `carousel` com `contentItems` ativos, a tela inicial mostra um carrossel central de conteudos curtos do hotel, com velocidade continua ajustada no Studio;
- Cards do carrossel podem trazer textos por idioma em `texts.pt`, `texts.en` e `texts.es`; o runtime escolhe o texto do idioma atual e usa `text`/`texts.pt` como fallback para designs antigos;
- Texto \"Toque para começar\" com breathing animation (`animate-breathe`);
- CTAs \"Check-in\" e \"Check-out\" navegam para `/buscar-reserva` com fluxo definido e idioma ja selecionado;
- Language pills na tela inicial alteram o idioma instantaneamente — o texto da tela muda sem navegar para pagina separada;
- Fallback final para configuração legada quando não há design publicado.

## Identidade visual do fluxo

As telas transacionais do totem (`/setup`, `/buscar-reserva`, `/confirmar-dados`, `/facial`, `/emitir-chave`, `/checkout`, `/obrigado` e `/porta/:quarto`) usam uma camada visual comum em `src/components/KioskShell.tsx`.

Essa camada deriva a identidade do `TotemDesign` publicado quando existir. Caso contrário, usa a configuração legada do totem (`nomeExibido`, `logoUrl`, `corPrimaria`) e um tema padrão. O objetivo é manter o fluxo com aparência premium e consistente sem permitir que cada hotel customize individualmente telas críticas de atendimento.

O Totem Studio controla a identidade, a tela idle e blocos de conteúdo. Na tela inicial, o conteúdo promocional fica no bloco `carousel` do JSON publicado, com itens simples de texto, mídia opcional, status ativo/inativo e velocidade. O fluxo interno herda fonte, marca, cor primária, fundo, texto e superfície, mas preserva layout fixo para reduzir atrito de configuração e proteger legibilidade/usabilidade.

A tela fixa de escolha entre check-in e check-out deve permanecer enxuta: título curto, dois alvos de toque grandes e microcopy mínima dentro de cada opção. Ela não expõe edição granular no Studio, mas herda a identidade visual publicada para funcionar bem com diferentes hotéis.

No admin, o Studio expõe a tela inicial como área editável de conteúdo (mensagens, vídeo/imagem de fundo e rodapé) e oferece preview navegável das demais etapas do fluxo. Essas etapas internas são preview-only: refletem o tema publicado, mas não têm campos de edição próprios.

Fontes são carregadas dinamicamente via `useFontLoader` que injeta `<link>` no `<head>`. Seis fontes disponíveis: Satoshi, Outfit, Playfair Display, Cormorant Garamond, DM Sans, Space Grotesk.

Animações: blocos entram com `totem-block-enter` (staggered fade-up), breathing no indicador de toque, `touch-press` para feedback tátil nos botões.

`TotemDesignRenderer` renderiza blocos de hero, CTA, galeria, banner, amenidades, video, idiomas e rodape. Videos usam `muted loop autoPlay playsInline`. Carousel usa scroll horizontal com snap.

## Human e biometria

O reconhecimento facial roda localmente no browser:

1. `faceRecognitionService` carrega modelos locais do Human.
2. `FacialRecognitionPage` captura descriptor durante o check-in.
3. Backend persiste `faceDescriptor` na reserva.
4. `DoorPage` captura descriptor ao vivo e compara localmente contra o descriptor salvo.

O backend nao recebe imagem facial e nao chama servico externo.

Fallback por data de nascimento:

- aparece quando a reserva tem `hospedeDataNascimento`;
- aceita formato localizado;
- envia check-in sem descriptor facial quando a data confere.

## i18n e kiosk

Idiomas suportados: `pt`, `en`, `es`.

`useIdleReset` deve ser usado nas paginas do fluxo para voltar a `/` apos inatividade. A tela idle nao deve depender de mouse/teclado e precisa funcionar em touch.

## Validacao

```bash
npm run build
```
