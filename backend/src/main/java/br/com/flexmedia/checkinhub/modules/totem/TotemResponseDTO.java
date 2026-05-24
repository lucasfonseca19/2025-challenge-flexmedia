package br.com.flexmedia.checkinhub.modules.totem;

import java.time.LocalDateTime;

public record TotemResponseDTO(
        Long id,
        Long hotelId,
        String nome,
        String codigo,
        Long designId,
        String designName,
        LocalDateTime ultimoHeartbeat,
        boolean ativo,
        boolean online
) {
    public static TotemResponseDTO from(Totem t, boolean online) {
        return new TotemResponseDTO(
                t.getId(),
                t.getHotel().getId(),
                t.getNome(),
                t.getCodigo(),
                t.getDesign() != null ? t.getDesign().getId() : null,
                t.getDesign() != null ? t.getDesign().getNome() : null,
                t.getUltimoHeartbeat(),
                t.isAtivo(),
                online
        );
    }
}
