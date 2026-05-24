package br.com.flexmedia.checkinhub.modules.hotel.dto;

import br.com.flexmedia.checkinhub.modules.hotel.Reserva;
import br.com.flexmedia.checkinhub.modules.hotel.StatusReserva;

import java.time.LocalDate;

public record ReservaResponseDTO(
        Long id,
        String codigoReserva,
        String hospedeNome,
        String hospedeCpf,
        String hospedeEmail,
        String quartoNumero,
        Long hotelId,
        String hotelNome,
        LocalDate dataCheckin,
        LocalDate dataCheckout,
        StatusReserva status,
        LocalDate hospedeDataNascimento,
        String faceDescriptor
) {
    public static ReservaResponseDTO from(Reserva r) {
        return new ReservaResponseDTO(
                r.getId(), r.getCodigoReserva(), r.getHospedeNome(), r.getHospedeCpf(),
                r.getHospedeEmail(), r.getQuartoNumero(),
                r.getHotel().getId(), r.getHotel().getNome(),
                r.getDataCheckin(), r.getDataCheckout(), r.getStatus(),
                r.getHospedeDataNascimento(), r.getFaceDescriptor()
        );
    }
}
