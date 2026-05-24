package br.com.flexmedia.checkinhub.modules.hotel;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hotel_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HotelConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "hotel_id", nullable = false, unique = true)
    private Hotel hotel;

    @Column(name = "nome_exibido", length = 100)
    private String nomeExibido;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "cor_primaria", length = 7)
    @Builder.Default
    private String corPrimaria = "#1e40af";

    @Column(name = "idiomas_ativos", length = 20)
    @Builder.Default
    private String idiomasAtivos = "pt,en";
}
