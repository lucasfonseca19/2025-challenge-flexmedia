package br.com.flexmedia.checkinhub.modules.totemdesign.dto;

import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesign;
import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesignStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record TotemDesignDTO(
        Long id,
        Long hotelId,
        TotemDesignStatus status,
        @NotNull JsonNode theme,
        @NotNull JsonNode layout,
        @NotNull JsonNode blocks,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TotemDesignDTO from(TotemDesign design, ObjectMapper objectMapper) {
        return new TotemDesignDTO(
                design.getId(),
                design.getHotel().getId(),
                design.getStatus(),
                readJson(objectMapper, design.getTheme()),
                readJson(objectMapper, design.getLayout()),
                readJson(objectMapper, design.getBlocks()),
                design.getCreatedAt(),
                design.getUpdatedAt()
        );
    }

    private static JsonNode readJson(ObjectMapper objectMapper, String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception e) {
            return objectMapper.createObjectNode();
        }
    }
}
