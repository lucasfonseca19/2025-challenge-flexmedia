package br.com.flexmedia.checkinhub.modules.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ReservaRequestDTO(
        String codigoReserva,
        @NotBlank String hospedeNome,
        @NotBlank String hospedeCpf,
        @Email String hospedeEmail,
        @NotBlank String quartoNumero,
        @NotNull Long hotelId,
        @NotNull LocalDate dataCheckin,
        @NotNull LocalDate dataCheckout,
        LocalDate hospedeDataNascimento,
        String faceDescriptor
) {
}
