# TASKS — Challenge Flexmedia 2025-2
> Documento de referência para desenvolvimento paralelo por agentes.
> Cada tarefa tem escopo, arquivos envolvidos e critério de conclusão bem definidos.
> Atualizado em: 2026-04-16

---

## Como usar este documento

- As tarefas estão organizadas por **superfície** (BACK / FRONT-TOTEM / FRONT-ADMIN / INFRA)
- Dentro de cada superfície, por **prioridade**: 🔴 Crítico → 🟡 Alto → 🟢 Médio
- Tarefas de BACK e FRONT são **independentes entre si** e podem ser executadas em paralelo
- Tarefas dentro da mesma superfície devem respeitar a **ordem numérica** quando há dependência indicada

---

## 🏗️ INFRA — Fazer PRIMEIRO (desbloqueia tudo)

### INFRA-01 — Migrar Oracle XE → MySQL 🔴
**Por quê:** Oracle XE tem imagem Docker de ~3GB e demora 10–15 min pra subir. MySQL sobe em 10 segundos. Os totens físicos da FIAP e a demo ao vivo dependem disso.

**Arquivos a modificar:**

`backend/pom.xml`
```xml
<!-- REMOVER -->
<dependency>
    <groupId>com.oracle.database.jdbc</groupId>
    <artifactId>ojdbc11</artifactId>
    <version>23.6.0.24.10</version>
</dependency>

<!-- ADICIONAR -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>
```

`backend/src/main/resources/application.properties`
```properties
# SUBSTITUIR bloco Oracle por:
spring.datasource.url=${MYSQL_URL:jdbc:mysql://localhost:3306/checkinhub?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true}
spring.datasource.username=${MYSQL_USER:checkinhub}
spring.datasource.password=${MYSQL_PASS:checkinhub123}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

`docker-compose.yml`
```yaml
# SUBSTITUIR serviço oracle por:
mysql:
  image: mysql:8.4
  container_name: checkinhub-mysql
  environment:
    MYSQL_ROOT_PASSWORD: root123
    MYSQL_DATABASE: checkinhub
    MYSQL_USER: checkinhub
    MYSQL_PASSWORD: checkinhub123
  ports:
    - "3306:3306"
  volumes:
    - mysql_data:/var/lib/mysql
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "checkinhub", "-pcheckinhub123"]
    interval: 10s
    timeout: 5s
    retries: 10
    start_period: 30s
  networks:
    - checkinhub-net
```

Atualizar também no serviço `backend` do docker-compose:
```yaml
environment:
  MYSQL_URL: jdbc:mysql://mysql:3306/checkinhub?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
  MYSQL_USER: checkinhub
  MYSQL_PASS: checkinhub123
  # remover ORACLE_URL, ORACLE_USER, ORACLE_PASS
depends_on:
  mysql:              # era oracle
    condition: service_healthy
```

Atualizar volumes:
```yaml
volumes:
  mysql_data:         # era oracle_data
  redis_data:
```

**6 entidades** — em cada uma, substituir o bloco de 3 linhas:
```java
// ANTES (em cada entidade)
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_xxxxx")
@SequenceGenerator(name = "seq_xxxxx", sequenceName = "seq_xxxxx", allocationSize = 1)

// DEPOIS (em cada entidade)
@GeneratedValue(strategy = GenerationType.IDENTITY)
```

Entidades afetadas:
- `modules/hotel/Hotel.java`
- `modules/hotel/Reserva.java`
- `modules/keys/ChaveDigital.java`
- `modules/metrics/MetricaDiaria.java`
- `modules/conteudo/ConteudoTotem.java`
- `security/Usuario.java`

**Critério de conclusão:** `docker-compose up mysql backend` sobe sem erros. `GET /actuator/health` retorna `UP`.

---

### INFRA-02 — Remover Redis (dependência sem uso) 🟡
**Por quê:** `spring-boot-starter-data-redis` está no pom.xml e no docker-compose mas nenhuma classe usa Redis. É peso morto que pode fazer o build/startup falhar se Redis não estiver disponível.

**Arquivos a modificar:**

`backend/pom.xml` — remover:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

`docker-compose.yml` — remover serviço `redis` inteiro e `redis_data` volume.

`backend/src/main/resources/application.properties` — remover bloco Redis.

**Critério de conclusão:** Projeto compila e sobe sem dependência de Redis.

---

## ⚙️ BACK — Backend Spring Boot

### BACK-01 — Adicionar `faceDescriptor` na entidade `Reserva` 🔴
**Por quê:** É o campo central de todo o reconhecimento facial. Sem ele, nenhuma biometria funciona na camada de dados.

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/hotel/Reserva.java`

Adicionar campo após `hospedeDataNascimento`:
```java
@Column(name = "face_descriptor", columnDefinition = "TEXT")
private String faceDescriptor;
```

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/hotel/dto/ReservaResponseDTO.java`

Adicionar `faceDescriptor` no DTO de resposta (incluir no `from(Reserva r)`).

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/hotel/dto/ReservaRequestDTO.java`

Adicionar `faceDescriptor` como campo opcional no DTO de request.

**Critério de conclusão:** Coluna existe no banco, campo aparece no JSON de resposta da reserva.

---

### BACK-02 — Receber `faceDescriptor` no check-in 🔴
**Dependência:** BACK-01

**Por quê:** O check-in biométrico precisa salvar o descriptor facial no momento da confirmação.

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/checkin/CheckinController.java`

Mudar endpoint `confirmar` para aceitar body:
```java
@PostMapping("/confirmar/{reservaId}")
public ReservaResponseDTO confirmar(
    @PathVariable Long reservaId,
    @RequestBody(required = false) CheckinConfirmDTO dto) {
    return checkinService.confirmarCheckin(reservaId, dto);
}
```

Criar `CheckinConfirmDTO.java` em `modules/checkin/`:
```java
public record CheckinConfirmDTO(String faceDescriptor) {}
```

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/checkin/CheckinService.java`

Atualizar `confirmarCheckin` para receber e salvar o descriptor:
```java
public ReservaResponseDTO confirmarCheckin(Long reservaId, CheckinConfirmDTO dto) {
    Reserva reserva = reservaService.findOrThrow(reservaId);
    if (reserva.getStatus() != StatusReserva.CONFIRMADA) {
        throw new BusinessException("Check-in não permitido. Status: " + reserva.getStatus());
    }
    reserva.setStatus(StatusReserva.CHECKIN_REALIZADO);
    if (dto != null && dto.faceDescriptor() != null) {
        reserva.setFaceDescriptor(dto.faceDescriptor());
    }
    reservaRepository.save(reserva);
    metricasService.registrarCheckin(reserva.getHotel().getId());
    return ReservaResponseDTO.from(reserva);
}
```

**Critério de conclusão:** `POST /api/checkin/confirmar/{id}` com body `{"faceDescriptor":"[0.1,0.2,...]"}` salva o descriptor na reserva.

---

### BACK-03 — Criar endpoint de validação facial para a porta 🔴
**Dependência:** BACK-01

**Por quê:** O simulador de porta precisa de um endpoint que receba um descriptor capturado pela câmera e compare com o descriptor armazenado na reserva do quarto.

Criar `backend/src/main/java/br/com/flexmedia/checkinhub/modules/room/RoomController.java`:
```java
@RestController
@RequestMapping("/api/quartos")
@RequiredArgsConstructor
public class RoomController {

    private final ReservaRepository reservaRepository;

    @PostMapping("/{quartoNumero}/validar-face")
    public ResponseEntity<ValidacaoFaceResponseDTO> validarFace(
            @PathVariable String quartoNumero,
            @RequestBody ValidacaoFaceRequestDTO dto) {

        // Busca reserva ativa (CHECKIN_REALIZADO) para o quarto
        Optional<Reserva> reservaOpt = reservaRepository
            .findByQuartoNumeroAndStatus(quartoNumero, StatusReserva.CHECKIN_REALIZADO);

        if (reservaOpt.isEmpty() || reservaOpt.get().getFaceDescriptor() == null) {
            return ResponseEntity.ok(new ValidacaoFaceResponseDTO(false, "Sem check-in ativo para este quarto"));
        }

        // Retorna o descriptor armazenado para comparação no frontend
        // A comparação real é feita pelo face-api.js no browser
        Reserva reserva = reservaOpt.get();
        return ResponseEntity.ok(new ValidacaoFaceResponseDTO(
            true,
            "Descriptor encontrado",
            reserva.getFaceDescriptor(),
            reserva.getHospedeNome(),
            reserva.getQuartoNumero()
        ));
    }
}
```

Criar DTOs em `modules/room/`:
- `ValidacaoFaceRequestDTO.java` — campo: `String faceDescriptor`
- `ValidacaoFaceResponseDTO.java` — campos: `boolean sucesso`, `String mensagem`, `String descriptorArmazenado` (nullable), `String hospedeNome` (nullable), `String quartoNumero` (nullable)

Adicionar no `ReservaRepository.java`:
```java
Optional<Reserva> findByQuartoNumeroAndStatus(String quartoNumero, StatusReserva status);
```

Liberar endpoint no `SecurityConfig.java` (público, o totem acessa sem login):
```java
.requestMatchers(new AntPathRequestMatcher("/api/quartos/**")).permitAll()
```

**Critério de conclusão:** `POST /api/quartos/304/validar-face` retorna o descriptor salvo da reserva do quarto 304.

---

### BACK-04 — Embeber `hotelId` e `role` no JWT 🟡
**Por quê:** A arquitetura requer que o token JWT carregue `hotelId` e `role` para que o frontend e o backend possam fazer controle de acesso sem ir ao banco a cada requisição.

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/security/jwt/JwtService.java`

```java
// Mudar assinatura de gerarToken:
public String gerarToken(String email, Long hotelId, String role) {
    long agora = System.currentTimeMillis();
    return Jwts.builder()
            .subject(email)
            .claim("hotelId", hotelId)
            .claim("role", role)
            .issuedAt(new Date(agora))
            .expiration(new Date(agora + jwtProperties.getExpirationMs()))
            .signWith(getKey())
            .compact();
}

// Adicionar métodos extratores:
public Long extrairHotelId(String token) {
    Claims claims = extrairClaims(token);
    Object hotelId = claims.get("hotelId");
    return hotelId != null ? Long.valueOf(hotelId.toString()) : null;
}

public String extrairRole(String token) {
    return (String) extrairClaims(token).get("role");
}
```

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/security/AuthController.java`

Atualizar chamada de `gerarToken`:
```java
String token = jwtService.gerarToken(
    usuario.getEmail(),
    usuario.getHotel() != null ? usuario.getHotel().getId() : null,
    usuario.getRole().name()
);
```

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/security/dto/LoginResponseDTO.java`

Garantir que `UsuarioInfoDTO` inclui `hotelId` e `role` na resposta de login.

**Critério de conclusão:** Ao decodificar o JWT retornado pelo login, claims `hotelId` e `role` estão presentes.

---

### BACK-05 — Chamar PMSAdapter dentro do CheckinService e CheckoutService 🟡
**Por quê:** O adapter está criado mas nunca é chamado. O fluxo deve notificar o PMS ao confirmar check-in e check-out.

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/checkin/CheckinService.java`

Injetar `PMSAdapter` e chamar `confirmarCheckin` após salvar:
```java
private final PMSAdapter pmsAdapter;

// dentro de confirmarCheckin(), após reservaRepository.save(reserva):
try {
    pmsAdapter.confirmarCheckin(String.valueOf(reserva.getId()));
} catch (Exception e) {
    log.warn("PMS não confirmou check-in {}: {}", reserva.getId(), e.getMessage());
    // não falha o fluxo — PMS é best-effort no mock
}
```

Mesma lógica no `CheckoutService.java` com `pmsAdapter.confirmarCheckout(...)`.

**Critério de conclusão:** Logs mostram chamada ao MockPMSAdapter durante check-in e check-out.

---

### BACK-06 — Criar entidade e endpoints de Totem 🟡
**Por quê:** O painel do hotel precisa gerenciar totens (listar, adicionar, remover, ver status online/offline via heartbeat).

Criar `backend/src/main/java/br/com/flexmedia/checkinhub/modules/totem/`:

`Totem.java` — entidade JPA:
```java
@Entity @Table(name = "totens")
public class Totem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;
    
    @Column(nullable = false, length = 100)
    private String nome;          // ex: "Totem Lobby"
    
    @Column(nullable = false, unique = true, length = 100)
    private String apiKey;        // UUID gerado no cadastro
    
    @Column(name = "ultimo_heartbeat")
    private LocalDateTime ultimoHeartbeat;
    
    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
```

`TotemController.java`:
- `GET  /api/hoteis/{hotelId}/totens` — lista totens do hotel
- `POST /api/hoteis/{hotelId}/totens` — cria totem (gera apiKey automática com `UUID.randomUUID()`)
- `DELETE /api/totens/{id}` — remove totem
- `POST /api/totens/{id}/heartbeat` — atualiza `ultimoHeartbeat = LocalDateTime.now()` (público, sem auth)

`TotemService.java` — lógica de negócio, incluindo método `isOnline(Totem t)`:
```java
// Online = heartbeat nos últimos 2 minutos
public boolean isOnline(Totem totem) {
    if (totem.getUltimoHeartbeat() == null) return false;
    return totem.getUltimoHeartbeat().isAfter(LocalDateTime.now().minusMinutes(2));
}
```

`TotemResponseDTO.java` — incluir campo calculado `online: boolean`.

**Critério de conclusão:** `GET /api/hoteis/1/totens` retorna lista com campo `online` correto. `POST /api/totens/1/heartbeat` atualiza o timestamp.

---

### BACK-07 — Criar entidade e endpoint de configuração do hotel (customização do totem) 🟡
**Por quê:** O painel do hotel precisa permitir customização de logo, cores, nome exibido e idiomas disponíveis.

Criar `backend/src/main/java/br/com/flexmedia/checkinhub/modules/hotel/HotelConfig.java`:
```java
@Entity @Table(name = "hotel_configs")
public class HotelConfig {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne @JoinColumn(name = "hotel_id", nullable = false, unique = true)
    private Hotel hotel;
    
    @Column(name = "nome_exibido", length = 100)
    private String nomeExibido;          // nome exibido no totem (pode diferir do nome jurídico)
    
    @Column(name = "logo_url", length = 500)
    private String logoUrl;
    
    @Column(name = "cor_primaria", length = 7)
    @Builder.Default
    private String corPrimaria = "#1e40af"; // azul padrão
    
    @Column(name = "idiomas_ativos", length = 20)
    @Builder.Default
    private String idiomasAtivos = "pt,en"; // CSV: "pt,en,es"
}
```

`HotelConfigController.java`:
- `GET  /api/hoteis/{hotelId}/config` — retorna config do hotel (público para o totem buscar)
- `PUT  /api/hoteis/{hotelId}/config` — atualiza config (autenticado)

Liberar o `GET` no `SecurityConfig.java`.

**Critério de conclusão:** `GET /api/hoteis/1/config` retorna configurações. `PUT` atualiza corretamente.

---

### BACK-08 — Rastrear idioma nas métricas 🟢
**Por quê:** O gráfico de "idiomas usados" no dashboard está completamente mockado no frontend. Precisa de dado real.

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/metrics/MetricaDiaria.java`

Adicionar campos:
```java
@Column(name = "idioma_pt", nullable = false) @Builder.Default private int idiomaPt = 0;
@Column(name = "idioma_en", nullable = false) @Builder.Default private int idiomaEn = 0;
@Column(name = "idioma_es", nullable = false) @Builder.Default private int idiomaEs = 0;
```

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/metrics/MetricasService.java`

Adicionar método:
```java
public void registrarIdioma(Long hotelId, String idioma) {
    MetricaDiaria m = getOuCriar(hotelId, LocalDate.now());
    switch (idioma.toLowerCase()) {
        case "en" -> m.setIdiomaEn(m.getIdiomaEn() + 1);
        case "es" -> m.setIdiomaEs(m.getIdiomaEs() + 1);
        default  -> m.setIdiomaPt(m.getIdiomaPt() + 1);
    }
    metricaDiariaRepository.save(m);
}
```

**Arquivo:** `backend/src/main/java/br/com/flexmedia/checkinhub/modules/checkin/CheckinService.java`

Chamar `metricasService.registrarIdioma(hotelId, idioma)` no `confirmarCheckin`. O idioma deve vir no `CheckinConfirmDTO` criado na BACK-02:
```java
public record CheckinConfirmDTO(String faceDescriptor, String idioma) {}
```

Incluir `idiomasPt/En/Es` no `DashboardDTO`.

**Critério de conclusão:** Após check-ins com idiomas diferentes, o dashboard retorna contagens reais por idioma.

---

## 📱 FRONT-TOTEM — Frontend do Totem

### TOTEM-01 — Integrar `face-api.js` real no `FacialRecognitionPage` 🔴
**Por quê:** O enunciado exige reconhecimento facial. Atualmente é uma simulação com `setTimeout`. A banca testa ao vivo nos totens físicos da FIAP.

**Instalação:**
```bash
cd frontend-totem
npm install face-api.js
```

**Modelos** — baixar de https://github.com/justadudewhohacks/face-api.js/tree/master/weights e colocar em `frontend-totem/public/models/`:
- `tiny_face_detector_model-weights_manifest.json` + shard
- `face_landmark_68_model-weights_manifest.json` + shard
- `face_recognition_model-weights_manifest.json` + shards

**Arquivo:** `frontend-totem/src/pages/FacialRecognitionPage.tsx`

Substituir a simulação por lógica real:

```tsx
import * as faceapi from 'face-api.js'

// Carregar modelos (uma vez, no useEffect inicial)
useEffect(() => {
  async function carregarModelos() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    setModelosCarregados(true)
  }
  carregarModelos()
}, [])

// Capturar descriptor do vídeo ao vivo
async function capturarDescriptor(): Promise<number[] | null> {
  if (!videoRef.current) return null
  const detection = await faceapi
    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  if (!detection) return null
  return Array.from(detection.descriptor) // Float32Array → number[]
}
```

Atualizar `prosseguir()` para capturar e enviar o descriptor na confirmação do check-in:
```tsx
async function prosseguir() {
  if (fluxo === 'checkin' && reserva?.id) {
    const descriptor = await capturarDescriptor()
    await checkinService.confirmar(reserva.id, {
      faceDescriptor: descriptor ? JSON.stringify(descriptor) : null,
      idioma
    })
  }
  navigate(fluxo === 'checkout' ? '/checkout' : '/emitir-chave')
}
```

**Arquivo:** `frontend-totem/src/services/api.ts`

Atualizar `checkinService.confirmar`:
```ts
confirmar: (reservaId: number, payload?: { faceDescriptor?: string | null, idioma?: string }): Promise<void> =>
  api.post(`/checkin/confirmar/${reservaId}`, payload ?? {}).then(r => r.data),
```

**Critério de conclusão:** Camera abre, face-api.js detecta rosto, borda muda de cor confirmando detecção, descriptor é enviado no check-in. Fallback por data de nascimento continua funcionando.

---

### TOTEM-02 — Criar página simulador de porta (`/porta/:quarto`) 🔴
**Por quê:** A banca ao vivo espera ver o funcionamento da "chave facial" — hóspede chega na porta, câmera verifica o rosto.

Criar `frontend-totem/src/pages/DoorPage.tsx`:

**Fluxo:**
1. Página recebe `quartoNumero` da URL (ex: `/porta/304`)
2. Busca o descriptor armazenado: `GET /api/quartos/304/validar-face` → retorna `{ descriptorArmazenado: "[...]", hospedeNome: "..." }`
3. Abre câmera e captura descriptor em tempo real com `face-api.js`
4. Compara os dois descriptors usando `faceapi.euclideanDistance(d1, d2)`
5. Se distância < 0.5 → porta "abre" (animação verde ✓, nome do hóspede exibido)
6. Se distância >= 0.5 → acesso negado (animação vermelha ✗)

```tsx
// Lógica de comparação (100% no browser, nada vai ao servidor)
const distancia = faceapi.euclideanDistance(
  new Float32Array(descriptorArmazenado),
  new Float32Array(descriptorCapturado)
)
const autorizado = distancia < 0.5
```

**Arquivo:** `frontend-totem/src/App.tsx`

Adicionar rota:
```tsx
import DoorPage from './pages/DoorPage'
// ...
<Route path="/porta/:quarto" element={<DoorPage />} />
```

**Arquivo:** `frontend-totem/src/services/api.ts`

Adicionar:
```ts
export const quartoService = {
  validarFace: (quartoNumero: string): Promise<ValidacaoFaceResponse> =>
    api.get(`/quartos/${quartoNumero}/validar-face`).then(r => r.data),
}
```

**Critério de conclusão:** Acessar `/porta/304` na demo mostra câmera ativa. Rosto do hóspede que fez check-in no 304 abre a porta. Rosto diferente é negado.

---

### TOTEM-03 — Corrigir fluxo de checkout (busca de reserva) 🟡
**Por quê:** `SearchReservationPage` usa `checkinService.buscarReserva()` para ambos os fluxos (check-in e checkout). Para checkout, o endpoint correto é `GET /api/checkout/reserva/{codigo}`.

**Arquivo:** `frontend-totem/src/pages/SearchReservationPage.tsx`

Usar o serviço correto conforme o fluxo:
```tsx
const { fluxo } = useTotem()

async function buscar() {
  const servico = fluxo === 'checkout'
    ? checkoutService.buscarReserva
    : checkinService.buscarReserva
  const reserva = await servico(codigo.trim())
  // ...
}
```

**Arquivo:** `frontend-totem/src/services/api.ts`

Adicionar `buscarReserva` ao `checkoutService`:
```ts
export const checkoutService = {
  buscarReserva: (codigoOuCpf: string): Promise<Reserva> =>
    api.get(`/checkout/reserva/${encodeURIComponent(codigoOuCpf)}`).then(r => r.data),

  confirmar: (reservaId: number): Promise<void> =>
    api.post(`/checkout/confirmar/${reservaId}`).then(r => r.data),
}
```

Remover o método `iniciar` que não existe no backend.

**Critério de conclusão:** Checkout busca reserva no endpoint correto. Reservas com status `CHECKIN_REALIZADO` são encontradas.

---

### TOTEM-04 — Adicionar reset por inatividade (kiosk mode) 🟢
**Por quê:** Se um hóspede abandonar o totem no meio do fluxo, ele deve voltar à tela inicial automaticamente após um período de inatividade.

**Arquivo:** `frontend-totem/src/context/TotemContext.tsx` ou novo `frontend-totem/src/hooks/useIdleReset.ts`

```ts
// Hook que reseta para / após X segundos de inatividade
export function useIdleReset(segundos = 90) {
  const navigate = useNavigate()
  const { resetar } = useTotem()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        resetar()
        navigate('/')
      }, segundos * 1000)
    }

    const eventos = ['touchstart', 'mousemove', 'keydown', 'click']
    eventos.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timer)
      eventos.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [])
}
```

Usar nas páginas do fluxo (não na idle page):
```tsx
// Em SearchReservationPage, ConfirmDataPage, FacialRecognitionPage, etc.
useIdleReset(90) // 90 segundos
```

**Critério de conclusão:** Sem tocar o totem por 90s em qualquer tela do fluxo, ele volta para `/` e limpa o estado.

---

## 🖥️ FRONT-ADMIN — Painel do Gestor / FlexMedia

### ADMIN-01 — Criar página de Gestão de Totens 🟡
**Dependência:** BACK-06

**Por quê:** Funcionalidade obrigatória do painel do hotel — adicionar, remover e ver status online/offline de totens.

Criar `frontend-admin/src/pages/TotemsPage.tsx`:

**Funcionalidades:**
- Tabela com: nome do totem, API key (oculta com botão "mostrar"), status online/offline (verde/cinza), último heartbeat em formato relativo ("há 2 min" / "há 3 dias")
- Badge colorido: verde "Online" (heartbeat < 2 min) ou cinza "Offline"
- Modal "Novo totem" com campo nome
- Botão "Remover" com confirmação
- Auto-refresh a cada 30 segundos para atualizar status online/offline

**Arquivo:** `frontend-admin/src/services/api.ts`

Adicionar:
```ts
export const totemService = {
  listar: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/totens`).then(r => r.data),
  criar: (hotelId: number, data: { nome: string }) =>
    api.post(`/hoteis/${hotelId}/totens`, data).then(r => r.data),
  remover: (id: number) =>
    api.delete(`/totens/${id}`),
}
```

**Arquivo:** `frontend-admin/src/App.tsx`

Adicionar rota:
```tsx
<Route path="/totens" element={<TotemsPage />} />
```

**Arquivo:** `frontend-admin/src/components/Layout.tsx`

Adicionar item de menu "Totens" com ícone, visível apenas para `OPERADOR` (gestor do hotel).

**Critério de conclusão:** Página lista totens com status correto. Novo totem é criado e aparece com API key. Remoção funciona.

---

### ADMIN-02 — Criar página de Customização do Totem 🟡
**Dependência:** BACK-07

**Por quê:** Funcionalidade obrigatória — gestor do hotel personaliza a aparência do totem.

Criar `frontend-admin/src/pages/ConfigPage.tsx`:

**Campos do formulário:**
- Nome exibido no totem (text input)
- URL do logo (text input + preview da imagem)
- Cor primária (color picker `<input type="color">`)
- Idiomas disponíveis (checkboxes: PT-BR, English, Español)
- Botão "Salvar configurações"

**Preview ao vivo:** painel lateral simula como o totem vai aparecer com as configurações escolhidas (fundo escuro, logo, cor dos botões, nome).

**Arquivo:** `frontend-admin/src/services/api.ts`

Adicionar:
```ts
export const configService = {
  buscar: (hotelId: number) =>
    api.get(`/hoteis/${hotelId}/config`).then(r => r.data),
  salvar: (hotelId: number, data: unknown) =>
    api.put(`/hoteis/${hotelId}/config`, data).then(r => r.data),
}
```

**Arquivo:** `frontend-admin/src/App.tsx`

Adicionar rota:
```tsx
<Route path="/configuracao" element={<ConfigPage />} />
```

**Critério de conclusão:** Gestor salva configurações e elas são persistidas no backend. Preview ao vivo atualiza em tempo real conforme campos são editados.

---

### ADMIN-03 — Separar visualmente Painel Hotel × Painel FlexMedia 🟡
**Por quê:** A spec define 2 painéis com propósitos diferentes. Hoje o menu é o mesmo para todos os usuários. Gestores de hotel não precisam ver "Hotéis" (função do FlexMedia admin). O FlexMedia admin não precisa ver "Reservas" (função do gestor de hotel).

**Arquivo:** `frontend-admin/src/components/Layout.tsx`

Renderizar menu condicionalmente pela role:
```tsx
const { usuario } = useAuth()
const isAdmin = usuario?.role === 'ADMIN'  // FLEXMEDIA_ADMIN
const isOperador = usuario?.role === 'OPERADOR'  // HOTEL_MANAGER

// Menu FLEXMEDIA_ADMIN:
// - Dashboard, Hotéis, Usuários

// Menu HOTEL_MANAGER:
// - Dashboard, Reservas, Totens, Conteúdo, Configuração
```

**Arquivo:** `frontend-admin/src/types/index.ts`

Atualizar comentários/labels para refletir o papel real:
```ts
// role 'ADMIN'    = FlexMedia Admin (acesso global)
// role 'OPERADOR' = Gestor do Hotel (acesso apenas ao seu hotel)
```

**Critério de conclusão:** Login como ADMIN mostra menu FlexMedia (Hotéis, Usuários). Login como OPERADOR mostra menu Hotel (Reservas, Totens, Conteúdo, Configuração).

---

### ADMIN-04 — Conectar gráfico de idiomas a dados reais 🟢
**Dependência:** BACK-08

**Por quê:** O gráfico de pizza "Idiomas utilizados" usa dados hardcoded. Precisa mostrar dados reais do backend.

**Arquivo:** `frontend-admin/src/pages/DashboardPage.tsx`

Substituir `IDIOMA_MOCK` por dados do endpoint:
```tsx
// Dentro do useEffect, após receber dados do dashboard:
const idiomaData = dados ? [
  { idioma: 'Português', valor: dados.idiomaPt ?? 0 },
  { idioma: 'English',   valor: dados.idiomaEn ?? 0 },
  { idioma: 'Español',   valor: dados.idiomaEs ?? 0 },
].filter(d => d.valor > 0) : IDIOMA_MOCK
```

**Critério de conclusão:** Após check-ins reais em diferentes idiomas, o gráfico reflete a distribuição real.

---

### ADMIN-05 — Corrigir `checkoutService.iniciar()` no frontend-admin (se usado) 🟢

Verificar se `frontend-admin/src/services/api.ts` ou qualquer página usa o endpoint `/checkout/iniciar`. Se sim, remover ou corrigir para `GET /checkout/reserva/{codigo}`.

**Critério de conclusão:** Nenhuma chamada para `/checkout/iniciar` no admin.

---

## 📊 Resumo de prioridades

### Para a demo funcionar (mínimo para banca):
1. `INFRA-01` — MySQL (infra base)
2. `BACK-01` — faceDescriptor na Reserva
3. `BACK-02` — check-in recebe faceDescriptor
4. `BACK-03` — endpoint validação facial porta
5. `TOTEM-01` — face-api.js real no totem
6. `TOTEM-02` — página simulador de porta
7. `TOTEM-03` — corrigir fluxo checkout

### Para nota máxima na implementação:
8. `INFRA-02` — remover Redis
9. `BACK-04` — JWT com hotelId+role
10. `BACK-05` — PMSAdapter integrado
11. `BACK-06` — entidade Totem + endpoints
12. `BACK-07` — HotelConfig + endpoints
13. `ADMIN-01` — página Gestão de Totens
14. `ADMIN-02` — página Customização do Totem
15. `ADMIN-03` — separar menus por role

### Polimento (diferencial de UX):
16. `BACK-08` — rastrear idiomas nas métricas
17. `TOTEM-04` — idle timeout kiosk mode
18. `ADMIN-04` — gráfico de idiomas com dados reais
19. `ADMIN-05` — limpar endpoint de checkout

---

## ⚡ Mapa de dependências

```
INFRA-01 (MySQL)
  └─ desbloqueia tudo

BACK-01 (faceDescriptor na Reserva)
  ├─ BACK-02 (check-in recebe descriptor)
  │    └─ TOTEM-01 (face-api.js envia descriptor)
  └─ BACK-03 (endpoint validação porta)
       └─ TOTEM-02 (página simulador de porta)

BACK-06 (Totem entity)
  └─ ADMIN-01 (página Gestão de Totens)

BACK-07 (HotelConfig)
  └─ ADMIN-02 (página Customização)

BACK-08 (métricas de idioma)
  └─ ADMIN-04 (gráfico idiomas real)

Independentes entre si:
  BACK-04, BACK-05, TOTEM-03, TOTEM-04, ADMIN-03, ADMIN-05
```
