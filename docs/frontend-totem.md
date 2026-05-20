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

- Usa o `TotemDesign` retornado no setup do dispositivo via `GET /api/totens/codigo/{codigo}`;
- Se o design tem bloco `video` visível, ele vira o vídeo de fundo do attract mode;
- Se tem bloco `hero` com imagem, ela vira o background do attract;
- O Totem Studio exige uma mídia de fundo para a tela inicial antes de salvar novos presets; designs antigos sem mídia ainda caem no fundo neutro do modo para compatibilidade;
- Se tem bloco `carousel` com `contentItems` ativos, a tela inicial mostra um carrossel central de conteudos curtos do hotel, com velocidade continua ajustada no Studio;
- Cards do carrossel podem trazer textos por idioma em `texts.pt`, `texts.en` e `texts.es`; o runtime escolhe o texto do idioma atual e usa `text`/`texts.pt` como fallback para designs antigos;
- Texto \"Toque para começar\" com breathing animation (`animate-breathe`);
- CTAs \"Check-in\" e \"Check-out\" navegam para `/buscar-reserva` com fluxo definido e idioma ja selecionado;
- Language pills na tela inicial alteram o idioma instantaneamente — o texto da tela muda sem navegar para pagina separada;
- Fallback final para configuração legada quando o totem não tem preset atribuído.

## Identidade visual do fluxo

As telas transacionais do totem (`/setup`, `/buscar-reserva`, `/confirmar-dados`, `/facial`, `/emitir-chave`, `/checkout`, `/obrigado` e `/porta/:quarto`) usam uma camada visual comum em `src/components/KioskShell.tsx`.

Essa camada deriva a identidade do `TotemDesign` atribuído ao dispositivo quando existir. Caso contrário, usa a configuração legada do totem (`nomeExibido`, `logoUrl`, `corPrimaria`) e um tema padrão. O objetivo é manter o fluxo com aparência premium e consistente sem permitir que cada hotel customize individualmente telas críticas de atendimento.

O Totem Studio controla a identidade, a tela idle e blocos de conteúdo por preset salvo. Na tela inicial, o conteúdo promocional fica no bloco `carousel` do JSON atribuído ao totem, com itens simples de texto, mídia opcional, status ativo/inativo e velocidade. O fluxo interno herda fonte, marca, modo claro/escuro e cor de acento, mas não reaproveita vídeo ou imagem de fundo da idle. Em vez disso, `KioskShell` usa fundo transacional fixo por `theme.mode`: light com bege claro (`#F4EFE6`) e superfície `#FFF8EE`, ou dark com carvão (`#171A1F`) e superfície `#232A32`. Presets antigos sem `mode` são tratados como dark. `backgroundColor` e `surfaceColor` legados são ignorados nas telas internas.

A cor de acento (`primaryColor`) pode ser qualquer cor escolhida pelo hotel. O runtime calcula uma variante acessível para botões e estados ativos quando a cor original não sustenta contraste de texto/componente, preservando a cor original apenas como referência decorativa quando necessário. O mesmo cálculo é usado no preview do Studio.

A tela fixa de escolha entre check-in e check-out deve permanecer enxuta: título curto, dois alvos de toque grandes e microcopy mínima dentro de cada opção. Ela não expõe edição granular no Studio, mas herda a identidade visual atribuída ao totem para funcionar bem com diferentes hotéis.

No admin, o Studio expõe a tela inicial como área editável de conteúdo (mensagens, vídeo/imagem de fundo e rodapé) e oferece preview navegável das demais etapas do fluxo. Essas etapas internas são preview-only: devem espelhar o runtime real do totem, refletindo o tema do preset atual sem campos de edição próprios. O frame portrait do runtime e do preview usa a mesma proporcao 9:16; a tela de escolha mantem dois cards lado a lado e reduz a tipografia em frames estreitos para evitar quebra de "Check in" e "Check out".

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
