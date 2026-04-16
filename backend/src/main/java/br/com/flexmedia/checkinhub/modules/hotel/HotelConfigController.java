package br.com.flexmedia.checkinhub.modules.hotel;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hoteis/{hotelId}/config")
@RequiredArgsConstructor
public class HotelConfigController {

    private final HotelConfigService hotelConfigService;

    @GetMapping
    public HotelConfigDTO buscar(@PathVariable Long hotelId) {
        return hotelConfigService.buscar(hotelId);
    }

    @PutMapping
    public HotelConfigDTO atualizar(@PathVariable Long hotelId, @RequestBody HotelConfigDTO dto) {
        return hotelConfigService.atualizar(hotelId, dto);
    }
}
