package br.com.flexmedia.checkinhub.modules.room;

import br.com.flexmedia.checkinhub.modules.hotel.Reserva;
import br.com.flexmedia.checkinhub.modules.hotel.ReservaRepository;
import br.com.flexmedia.checkinhub.modules.hotel.StatusReserva;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/quartos")
@RequiredArgsConstructor
public class RoomController {

    private final ReservaRepository reservaRepository;
    @PostMapping("/{quartoNumero}/validar-face")
    public ResponseEntity<ValidacaoFaceResponseDTO> validarFace(
            @PathVariable String quartoNumero) {

        Optional<Reserva> reservaOpt = reservaRepository
                .findByQuartoNumeroAndStatus(quartoNumero, StatusReserva.CHECKIN_REALIZADO);

        if (reservaOpt.isEmpty()) {
            return ResponseEntity.ok(new ValidacaoFaceResponseDTO(false, "Sem check-in ativo para este quarto"));
        }

        Reserva reserva = reservaOpt.get();
        if (reserva.getFaceDescriptor() == null || reserva.getFaceDescriptor().isBlank()) {
            return ResponseEntity.ok(new ValidacaoFaceResponseDTO(false, "Sem imagem facial registrada para este hóspede"));
        }

        return ResponseEntity.ok(new ValidacaoFaceResponseDTO(
                true,
                "Descriptor facial encontrado",
                reserva.getFaceDescriptor(),
                reserva.getHospedeNome(),
                reserva.getQuartoNumero()
        ));
    }
}
