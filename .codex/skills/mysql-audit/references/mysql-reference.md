# MySQL Reference

## Schema resumido

### `hoteis`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | auto_increment |
| nome | VARCHAR(150) | NOT NULL |
| cnpj | VARCHAR(18) | UNIQUE |
| cidade | VARCHAR(100) | NOT NULL |
| estado | VARCHAR(2) | NOT NULL |
| ativo | TINYINT(1) | default 1 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `hotel_configs`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| hotel_id | BIGINT FK -> hoteis | UNIQUE (1:1) |
| nome_exibido | VARCHAR(100) | nome no totem |
| logo_url | VARCHAR(500) | |
| cor_primaria | VARCHAR(7) | hex, default `#1e40af` |
| idiomas_ativos | VARCHAR(20) | ex: `pt,en,es` |

### `usuarios`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| nome | VARCHAR(150) | NOT NULL |
| email | VARCHAR(150) | UNIQUE |
| senha | VARCHAR(255) | bcrypt |
| role | ENUM('ADMIN','OPERADOR') | |
| hotel_id | BIGINT FK -> hoteis | `NULL` se `ADMIN` |
| ativo | TINYINT(1) | default 1 |

### `reservas`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| codigo_reserva | VARCHAR(50) | UNIQUE, indexed |
| hospede_nome | VARCHAR(150) | NOT NULL |
| hospede_cpf | VARCHAR(14) | indexed |
| hospede_email | VARCHAR(150) | |
| hospede_data_nascimento | DATE | fallback de verificação |
| quarto_numero | VARCHAR(10) | NOT NULL |
| hotel_id | BIGINT FK -> hoteis | NOT NULL |
| face_descriptor | TEXT | JSON serializado pelo face-api.js |
| data_checkin | DATE | NOT NULL |
| data_checkout | DATE | NOT NULL |
| status | ENUM('CONFIRMADA','CHECKIN_REALIZADO','CHECKOUT_REALIZADO','CANCELADA') | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `chaves_digitais`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| reserva_id | BIGINT FK -> reservas | |
| token | VARCHAR(100) | UNIQUE |
| tipo | ENUM('DIGITAL','FISICA') | default DIGITAL |
| data_expiracao | DATETIME | |
| ativa | TINYINT(1) | default 1 |
| data_emissao | DATETIME | creation timestamp |

### `totens`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| hotel_id | BIGINT FK -> hoteis | |
| nome | VARCHAR(100) | |
| codigo | VARCHAR(10) | UNIQUE |
| ultimo_heartbeat | DATETIME | |
| ativo | TINYINT(1) | default 1 |
| created_at | DATETIME | |

### `conteudo_totem`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| hotel_id | BIGINT FK -> hoteis | |
| tipo | ENUM('IMAGEM','VIDEO') | |
| titulo | VARCHAR(200) | |
| url_midia | VARCHAR(500) | |
| ordem_exibicao | INT | default 1 |
| ativo | TINYINT(1) | default 1 |

### `metricas_diarias`
| Coluna | Tipo | Obs |
|---|---|---|
| id | BIGINT PK | |
| hotel_id | BIGINT FK -> hoteis | |
| data | DATE | UNIQUE com `hotel_id` |
| total_checkins | INT | default 0 |
| total_checkouts | INT | default 0 |
| total_chaves_emitidas | INT | default 0 |
| idioma_pt / idioma_en / idioma_es | INT | contador por idioma |

## Queries frequentes

### Visão geral rápida

```sql
SELECT status, COUNT(*) AS qtd
FROM reservas
GROUP BY status;

SELECT id, codigo_reserva, hospede_nome, quarto_numero, status, updated_at
FROM reservas
ORDER BY created_at DESC
LIMIT 10;

SELECT *
FROM reservas
WHERE data_checkin = CURDATE() OR data_checkout = CURDATE();
```

### Depuração de fluxo

```sql
SELECT *
FROM reservas
WHERE codigo_reserva = 'RES-001';

SELECT id, codigo_reserva, status,
       CASE WHEN face_descriptor IS NULL THEN 'SEM FACE' ELSE 'COM FACE' END AS face
FROM reservas
WHERE codigo_reserva = 'RES-001';

SELECT cd.*, r.codigo_reserva, r.status
FROM chaves_digitais cd
JOIN reservas r ON cd.reserva_id = r.id
WHERE r.codigo_reserva = 'RES-001';
```

### Usuários, hotéis e totens

```sql
SELECT id, nome, email, role, hotel_id, ativo
FROM usuarios;

SELECT t.id, t.nome, h.nome AS hotel, t.ativo, t.ultimo_heartbeat
FROM totens t
JOIN hoteis h ON t.hotel_id = h.id;

SELECT h.nome, hc.nome_exibido, hc.cor_primaria, hc.idiomas_ativos
FROM hotel_configs hc
JOIN hoteis h ON hc.hotel_id = h.id;
```

### Métricas

```sql
SELECT h.nome, md.*
FROM metricas_diarias md
JOIN hoteis h ON md.hotel_id = h.id
WHERE md.data = CURDATE();

SELECT md.data, h.nome, md.total_checkins, md.total_checkouts
FROM metricas_diarias md
JOIN hoteis h ON md.hotel_id = h.id
ORDER BY md.data DESC
LIMIT 30;
```

## Alterações seguras em dev

```sql
UPDATE reservas
SET status = 'CONFIRMADA', face_descriptor = NULL
WHERE codigo_reserva = 'RES-001';

UPDATE chaves_digitais
SET ativa = 0
WHERE reserva_id = 42;

DELETE FROM reservas
WHERE codigo_reserva LIKE 'TESTE-%';
```

## Dicas rápidas

- Status não mudou após check-in: confira `reservas.updated_at` e o retorno do backend.
- Chave não aparece: valide `chaves_digitais.reserva_id` e `ativa = 1`.
- Face não reconhece: confirme se `face_descriptor` está preenchido.
- Totem offline: compare `totens.ultimo_heartbeat` com `NOW()`.
- Usuário não loga: confirme `usuarios.ativo = 1`, `role` e `hotel_id`.
