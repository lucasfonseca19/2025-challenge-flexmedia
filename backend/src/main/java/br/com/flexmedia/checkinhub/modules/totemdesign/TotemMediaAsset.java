package br.com.flexmedia.checkinhub.modules.totemdesign;

import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "totem_media_assets", indexes = {
        @Index(name = "idx_totem_media_hotel", columnList = "hotel_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TotemMediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "stored_name", nullable = false, length = 255)
    private String storedName;

    @Column(name = "mime_type", nullable = false, length = 80)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "public_url", nullable = false, length = 500)
    private String publicUrl;

    private Integer width;

    private Integer height;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
