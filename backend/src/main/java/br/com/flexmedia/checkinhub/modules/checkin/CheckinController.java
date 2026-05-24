package br.com.flexmedia.checkinhub.modules.checkin;

import br.com.flexmedia.checkinhub.modules.hotel.dto.ReservaResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

    @GetMapping("/reserva/{codigoOuCpf}")
    public ReservaResponseDTO buscar(@PathVariable String codigoOuCpf) {
        return checkinService.buscarParaCheckin(codigoOuCpf);
    }

    @PostMapping("/confirmar/{reservaId}")
    public ReservaResponseDTO confirmar(
            @PathVariable Long reservaId,
            @RequestBody(required = false) CheckinConfirmDTO dto) {
        return checkinService.confirmarCheckin(reservaId, dto);
    }
}
