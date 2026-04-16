package br.com.flexmedia.checkinhub.modules.totem;

import java.time.LocalDateTime;

public record TotemResponseDTO(
        Long id,
        Long hotelId,
        String nome,
        String codigo,
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
                t.getUltimoHeartbeat(),
                t.isAtivo(),
                online
        );
    }
}
