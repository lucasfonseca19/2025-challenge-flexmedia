package br.com.flexmedia.checkinhub.modules.hotel;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas", indexes = {
        @Index(name = "idx_reserva_codigo", columnList = "codigo_reserva"),
        @Index(name = "idx_reserva_cpf", columnList = "hospede_cpf")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "codigo_reserva", nullable = false, unique = true, length = 50)
    private String codigoReserva;

    @NotBlank
    @Column(name = "hospede_nome", nullable = false, length = 150)
    private String hospedeNome;

    @NotBlank
    @Column(name = "hospede_cpf", nullable = false, length = 14)
    private String hospedeCpf;

    @Column(name = "hospede_email", length = 150)
    private String hospedeEmail;

    @NotBlank
    @Column(name = "quarto_numero", nullable = false, length = 10)
    private String quartoNumero;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(name = "hospede_data_nascimento")
    private LocalDate hospedeDataNascimento;

    @Column(name = "face_descriptor", columnDefinition = "TEXT")
    private String faceDescriptor;

    @NotNull
    @Column(name = "data_checkin", nullable = false)
    private LocalDate dataCheckin;

    @NotNull
    @Column(name = "data_checkout", nullable = false)
    private LocalDate dataCheckout;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private StatusReserva status = StatusReserva.CONFIRMADA;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
