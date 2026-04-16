---
name: mysql-audit
description: >
  Audita e consulta o banco MySQL do projeto CheckIn Hub durante desenvolvimento e depuração.
  Use esta skill quando o usuário quiser validar se dados foram persistidos corretamente, inspecionar
  reservas, hóspedes, hotéis, chaves digitais, totens, métricas ou usuários, entender por que um fluxo
  não atualizou o banco, ou executar queries SQL de diagnóstico sobre o estado atual do sistema.
---

# MySQL Audit

Skill para inspeção operacional do MySQL local do CheckIn Hub.

## Quando usar

- Validar se check-in, check-out, emissão de chave ou cadastro facial gravaram corretamente.
- Investigar divergência entre UI, backend e estado persistido.
- Conferir registros atuais de reservas, hotéis, usuários, totens e métricas.
- Rodar queries SQL pontuais de diagnóstico.
- Fazer correções manuais em ambiente local de desenvolvimento.

## Conexão

Antes de consultar o banco, valide o método de acesso disponível no ambiente.

1. Confira as credenciais atuais do projeto em `backend/src/main/resources/application.properties`.
2. Prefira acesso local direto quando o MySQL estiver rodando na máquina ou publicado em `localhost:3306`.
3. Use Docker apenas como fallback quando o projeto estiver realmente rodando em container.

Prefira comandos one-shot para evitar shell interativo.

### Opção 1: MySQL local via TCP

```bash
mysql -h 127.0.0.1 -P 3306 -u checkinhub -pcheckinhub123 checkinhub -e "SELECT * FROM reservas LIMIT 5;"
```

Se o cliente foi instalado via Homebrew em macOS e não estiver no `PATH`, use o caminho absoluto:

```bash
/opt/homebrew/opt/mysql-client/bin/mysql -h 127.0.0.1 -P 3306 -u checkinhub -pcheckinhub123 checkinhub -e "SELECT * FROM reservas LIMIT 5;"
```

Teste rápido de conectividade:

```bash
mysql -h 127.0.0.1 -P 3306 -u checkinhub -pcheckinhub123 -D checkinhub -e "SHOW TABLES;"
```

Versão com caminho absoluto:

```bash
/opt/homebrew/opt/mysql-client/bin/mysql -h 127.0.0.1 -P 3306 -u checkinhub -pcheckinhub123 -D checkinhub -e "SHOW TABLES;"
```

### Opção 2: MySQL em container Docker

```bash
docker exec checkinhub-mysql mysql -u checkinhub -pcheckinhub123 checkinhub -e "SELECT * FROM reservas LIMIT 5;"
```

Alternativas:

```bash
docker exec -it checkinhub-mysql mysql -u checkinhub -pcheckinhub123 checkinhub
```

Se o container não estiver rodando:

```bash
docker-compose up mysql -d
```

### Diagnóstico de falha

Se `mysql` não existir no PATH, a skill não conseguirá abrir conexão local mesmo que o banco esteja no ar.

Verifique:

```bash
command -v mysql
```

Em macOS com Homebrew, instale o cliente:

```bash
brew install mysql-client
```

Depois adicione o binário ao PATH, por exemplo:

```bash
echo 'export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"' >> ~/.zshrc
```

Se a porta `3306` estiver ocupada mas `docker` não existir no PATH, trate isso como indício de um serviço publicado externamente; ainda assim o acesso da skill continua sendo pelo cliente `mysql` local.

Se a conexão falhar apenas dentro do sandbox da ferramenta, mas funcionar fora dele, trate isso como limitação do ambiente de execução. Nessa situação, a skill deve explicitar que o banco está acessível, porém o teste local precisou de permissão fora do sandbox.

## Fluxo recomendado

1. Identifique o fluxo que falhou: reserva, hóspede, hotel, chave, totem ou métrica.
2. Rode um `SELECT` mínimo para confirmar o estado atual.
3. Se houver suspeita de transição inválida, compare com a state machine das reservas.
4. Se precisar alterar dados, execute antes um `SELECT` com a mesma cláusula `WHERE`.
5. Ao responder, descreva o que foi encontrado no banco e o impacto prático no fluxo.

## Regras de segurança

- Nunca rode `UPDATE` ou `DELETE` sem confirmar primeiro o escopo com `SELECT`.
- Trate `face_descriptor` como payload opaco. Só zere com `NULL`; não edite o JSON manualmente.
- Em respostas, priorize evidência objetiva: registros encontrados, status atual, timestamps e vínculos.

## State machine de reservas

```text
CONFIRMADA -> CHECKIN_REALIZADO -> CHECKOUT_REALIZADO
CONFIRMADA -> CANCELADA
```

## Consultas de referência

Leia [references/mysql-reference.md](references/mysql-reference.md) quando precisar de:

- schema resumido das tabelas;
- queries de auditoria recorrentes;
- exemplos de depuração de fluxo;
- consultas de métricas, hotéis, usuários e totens;
- exemplos de alterações seguras em ambiente local.

## Padrão de resposta

Ao auditar o banco, responda de forma direta:

1. qual query foi usada;
2. o que ela retornou;
3. se o estado está coerente com o fluxo esperado;
4. qual próximo passo corrige ou aprofunda o diagnóstico.
