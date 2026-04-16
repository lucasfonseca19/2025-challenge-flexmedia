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
            @PathVariable String quartoNumero,
            @RequestBody ValidacaoFaceRequestDTO dto) {

        // Busca reserva ativa (CHECKIN_REALIZADO) para o quarto
        Optional<Reserva> reservaOpt = reservaRepository
            .findByQuartoNumeroAndStatus(quartoNumero, StatusReserva.CHECKIN_REALIZADO);

        if (reservaOpt.isEmpty() || reservaOpt.get().getFaceDescriptor() == null) {
            return ResponseEntity.ok(new ValidacaoFaceResponseDTO(false, "Sem check-in ativo para este quarto"));
        }

        // Retorna o descriptor armazenado para comparação no frontend
        // A comparação real é feita pelo face-api.js no browser
        Reserva reserva = reservaOpt.get();
        return ResponseEntity.ok(new ValidacaoFaceResponseDTO(
            true,
            "Descriptor encontrado",
            reserva.getFaceDescriptor(),
            reserva.getHospedeNome(),
            reserva.getQuartoNumero()
        ));
    }
}
