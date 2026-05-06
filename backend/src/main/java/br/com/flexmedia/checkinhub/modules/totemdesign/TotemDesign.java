package br.com.flexmedia.checkinhub.modules.totemdesign;

import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "totem_designs", indexes = {
        @Index(name = "idx_totem_design_hotel_status", columnList = "hotel_id,status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TotemDesign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TotemDesignStatus status;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String theme;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String layout;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String blocks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
