package br.com.flexmedia.checkinhub.modules.conteudo;

import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "conteudo_totem")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConteudoTotem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoConteudo tipo;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(name = "url_midia", nullable = false, length = 500)
    private String urlMidia;

    @Column(name = "ordem_exibicao", nullable = false)
    @Builder.Default
    private int ordemExibicao = 1;

    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;
}
