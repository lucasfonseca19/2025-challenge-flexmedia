package br.com.flexmedia.checkinhub.modules.totemdesign.dto;

import br.com.flexmedia.checkinhub.modules.totemdesign.TotemMediaAsset;

import java.time.LocalDateTime;

public record TotemMediaAssetDTO(
        Long id,
        Long hotelId,
        String originalName,
        String mimeType,
        long sizeBytes,
        String publicUrl,
        Integer width,
        Integer height,
        LocalDateTime createdAt
) {
    public static TotemMediaAssetDTO from(TotemMediaAsset asset) {
        return new TotemMediaAssetDTO(
                asset.getId(),
                asset.getHotel().getId(),
                asset.getOriginalName(),
                asset.getMimeType(),
                asset.getSizeBytes(),
                asset.getPublicUrl(),
                asset.getWidth(),
                asset.getHeight(),
                asset.getCreatedAt()
        );
    }
}
