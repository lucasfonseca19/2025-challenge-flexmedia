package br.com.flexmedia.checkinhub.modules.totem;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TotemController {

    private final TotemService totemService;

    @GetMapping("/api/hoteis/{hotelId}/totens")
    public List<TotemResponseDTO> listar(@PathVariable Long hotelId) {
        return totemService.listarPorHotel(hotelId);
    }

    @PostMapping("/api/hoteis/{hotelId}/totens")
    public ResponseEntity<TotemResponseDTO> criar(
            @PathVariable Long hotelId,
            @RequestBody Map<String, String> body) {
        String nome = body.get("nome");
        TotemResponseDTO dto = totemService.criar(hotelId, nome);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/api/totens/codigo/{codigo}")
    public ResponseEntity<TotemConfigDTO> buscarPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(totemService.buscarConfigPorCodigo(codigo));
    }

    @DeleteMapping("/api/totens/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        totemService.remover(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/totens/{id}/heartbeat")
    public TotemResponseDTO heartbeat(@PathVariable Long id) {
        return totemService.heartbeat(id);
    }
}
