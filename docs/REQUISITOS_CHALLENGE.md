# Requisitos do Challenge Flexmedia

Este documento consolida, dentro do repo atual, as informacoes necessarias do material em `/Users/lucas/Challenge`. Ele deve ser a referencia de produto/entrega para implementadores e avaliadores.

Fontes originais:

- `/Users/lucas/Challenge/TODO_Challenge_Flexmedia.md`
- `/Users/lucas/Challenge/3ESOR - Challenge Flexmedia 2025-2.pdf`
- `/Users/lucas/Challenge/docs/01_fluxo_hospede.md`
- `/Users/lucas/Challenge/docs/02_integracao_pms.md`
- `/Users/lucas/Challenge/docs/03_fluxo_gestor.md`
- `/Users/lucas/Challenge/docs/04_fluxo_flexmedia.md`

## Objetivo do desafio

Desenvolver um totem de autoatendimento para hotelaria que permita:

- check-in automatizado;
- check-out rapido;
- integracao com sistema de gestao hoteleira (PMS);
- emissao de chave digital ou fisica;
- reconhecimento facial para validacao de identidade;
- suporte a multiplos hoteis e totens;
- customizacao visual e de conteudo por hotel.

O MVP precisa demonstrar valor funcional e usabilidade. A entrega da sprint vale 30 pontos: 5 de video pitch e 25 de projeto/MVP.

## Datas e entregas

| Marco | Data | Entrega |
|---|---:|---|
| 1a mentoria | 08/04/2026 | Problema, solucao proposta, relevancia e riscos |
| 2a mentoria | 13/05/2026 | Problema, solucao e demonstracao de MVP/prototipo |
| Entrega da sprint | 24/05/2026 | ZIP no FIAP ON com codigo/MVP e PDF com link publico do video |
| Banca final | 17/06/2026 | Introducao, demonstracao, impacto, diferenciais e proximos passos |

Restricoes:

- equipe de ate 5 integrantes;
- nao desenvolver individualmente;
- usar somente tecnologias/conteudos abordados ate a FASE 7;
- manter arquivos organizados e corretamente nomeados;
- video pitch com ate 3 minutos e link publico.

## Personas e requisitos obrigatorios

### FlexMedia

Como plataforma white label, a solucao deve:

- estruturar modulos reutilizaveis, como check-in/out, emissao de chaves e pagamentos;
- suportar integracao futura com diferentes PMS, gateways de pagamento e controle de acesso;
- permitir que cada hotel adapte design e interface do totem a sua identidade visual;
- permitir multiplos cadastros de hoteis em uma unica plataforma.

Estado atual do produto:

- multi-hotel existe via `Hotel`, `Usuario.role`, `hotelId` no JWT e filtros de escopo;
- PMS esta abstraido por `PMSAdapter`, com `MockPMSAdapter` ativo;
- Totem Studio cobre customizacao visual e biblioteca de midia;
- modulos white label ainda sao demonstrados conceitualmente, nao como feature configuravel por hotel.

### Gestor do hotel

Como cliente/operador do hotel, o sistema deve:

- reduzir demanda da recepcao com totem autonomo;
- registrar metricas de uso;
- permitir atualizacoes de conteudo, promocoes, eventos e servicos extras no totem;
- permitir adicionar novos totens em diferentes pontos do hotel;
- ser compativel com integracoes PMS.

Estado atual do produto:

- painel do operador permite reservas, totens, dashboard e Totem Studio;
- status online/offline usa heartbeat do totem;
- metricas cobrem check-ins, check-outs, chaves e idiomas;
- conteudo visual novo deve priorizar Totem Studio; `conteudo_totem` fica como legado/fallback.

### Hospede

Como usuario final, o totem deve:

- permitir check-in;
- permitir check-out rapido;
- buscar reserva via PMS simulado/backend;
- emitir chave digital;
- validar identidade por reconhecimento facial;
- permitir selecao de idioma.

Estado atual do produto:

- check-in, check-out, emissao de chave e porta demonstrativa existem;
- reconhecimento facial usa `@vladmandic/human` local no browser;
- backend persiste descriptor, mas nao compara faces;
- fallback por data de nascimento existe quando camera/Human nao conclui.

## Nice to have

Itens desejaveis, mas nao obrigatorios para o MVP atual:

- pagamento diretamente no totem durante check-out;
- mapa digital do hotel;
- avisos sobre restaurante, piscina, spa e areas de lazer;
- avaliacao da estadia no totem;
- uso dos totens fisicos disponibilizados pela FlexMedia na FIAP Paulista.

Esses itens nao devem deslocar a estabilidade do fluxo principal.

## Decisoes de implementacao atuais

- Backend, totem e admin sao superficies independentes.
- Banco oficial: MySQL 8.4.
- Redis nao faz parte da arquitetura.
- Reconhecimento facial: `@vladmandic/human`, gratuito e local.
- PMS: `PMSAdapter` com `MockPMSAdapter` no MVP.
- Autenticacao: JWT com `email`, `hotelId` e `role`.
- Roles atuais: `ADMIN` e `OPERADOR`.
- Totem ativa por `codigo` unico, nao por API key.
- Uploads do Totem Studio sao artefatos de runtime em `backend/uploads/` e nao entram no Git.

## Lacunas conhecidas contra o enunciado

- Pagamento e gateways ainda nao implementados.
- Controle de acesso fisico real/RFID ainda e demonstrativo.
- Modulos por hotel ainda nao existem como configuracao no banco/UI.
- Offline-first/cache local de reservas do dia e pos-MVP.
- Teste em equipamento fisico depende de disponibilidade e acesso via equipe/FIAP.

## Como usar este documento

Use este documento como referencia de escopo do Challenge, requisitos de produto, entregaveis e priorizacao. Atualize-o quando uma decisao mudar a aderencia ao enunciado e registre validacoes relevantes em `docs/CENARIOS_TESTE.md`.
