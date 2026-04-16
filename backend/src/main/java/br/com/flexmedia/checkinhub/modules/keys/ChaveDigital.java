package br.com.flexmedia.checkinhub.modules.keys;

import br.com.flexmedia.checkinhub.modules.hotel.Reserva;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chaves_digitais")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChaveDigital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reserva_id", nullable = false)
    private Reserva reserva;

    @Column(nullable = false, unique = true, length = 100)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private TipoChave tipo = TipoChave.DIGITAL;

    @Column(name = "data_expiracao")
    private LocalDateTime dataExpiracao;

    @Column(nullable = false)
    @Builder.Default
    private boolean ativa = true;

    @CreationTimestamp
    @Column(name = "data_emissao", updatable = false)
    private LocalDateTime dataEmissao;
}
