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
| `/` | `IdlePage` | Tela de repouso e entrada do fluxo |
| `/setup` | `SetupPage` | Ativacao do totem por codigo |
| `/selecionar-idioma` | `LanguagePage` | Idioma do atendimento |
| `/buscar-reserva` | `SearchReservationPage` | Busca por codigo ou CPF |
| `/confirmar-dados` | `ConfirmDataPage` | Confirma dados da reserva |
| `/facial` | `FacialRecognitionPage` | Cadastra face ou fallback por DOB |
| `/emitir-chave` | `IssueKeyPage` | Emite chave digital |
| `/checkout` | `CheckoutPage` | Fluxo de saida |
| `/obrigado` | `ThankYouPage` | Encerramento |
| `/porta/:quarto` | `DoorPage` | Simulador de porta |

## Estado local

`TotemContext` guarda:

- idioma atual;
- reserva selecionada;
- fluxo `checkin` ou `checkout`;
- configuracao persistida do totem;
- reset de estado ao voltar para idle.

A configuracao do totem e persistida em `localStorage` para permitir kiosk mode sem reativar a cada reload.

## Idle customizada

`IdlePage` usa o design publicado do Totem Studio quando disponivel:

- `totemConfig.design` vindo do endpoint de configuracao publica;
- fallback por `totemDesignService.buscarPublicado(hotelId)`;
- fallback final para conteudo/configuracao legados.

`TotemDesignRenderer` renderiza blocos de hero, CTA, galeria, banner, amenidades, video, idiomas e rodape. Videos usam `muted loop autoPlay playsInline`.

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
