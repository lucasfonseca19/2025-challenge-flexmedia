package br.com.flexmedia.checkinhub.modules.totemdesign;

import br.com.flexmedia.checkinhub.modules.totemdesign.dto.TotemDesignDTO;
import br.com.flexmedia.checkinhub.modules.totemdesign.dto.TotemMediaAssetDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TotemDesignController {

    private final TotemDesignService service;

    @GetMapping("/api/hoteis/{hotelId}/totem-design/draft")
    public TotemDesignDTO buscarDraft(@PathVariable Long hotelId) {
        return service.buscarDraft(hotelId);
    }

    @PutMapping("/api/hoteis/{hotelId}/totem-design/draft")
    public TotemDesignDTO salvarDraft(@PathVariable Long hotelId, @Valid @RequestBody TotemDesignDTO dto) {
        return service.salvarDraft(hotelId, dto);
    }

    @PostMapping("/api/hoteis/{hotelId}/totem-design/publish")
    public TotemDesignDTO publicar(@PathVariable Long hotelId) {
        return service.publicar(hotelId);
    }

    @GetMapping("/api/hoteis/{hotelId}/totem-design/published")
    public TotemDesignDTO buscarPublicado(@PathVariable Long hotelId) {
        return service.buscarPublicado(hotelId);
    }

    @GetMapping("/api/hoteis/{hotelId}/totem-media")
    public List<TotemMediaAssetDTO> listarMidias(@PathVariable Long hotelId) {
        return service.listarMidias(hotelId);
    }

    @PostMapping("/api/hoteis/{hotelId}/totem-media")
    @ResponseStatus(HttpStatus.CREATED)
    public TotemMediaAssetDTO upload(@PathVariable Long hotelId, @RequestParam("file") MultipartFile file) {
        return service.upload(hotelId, file);
    }

    @DeleteMapping("/api/hoteis/{hotelId}/totem-media/{assetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerMidia(@PathVariable Long hotelId, @PathVariable Long assetId) {
        service.removerMidia(hotelId, assetId);
    }
}
