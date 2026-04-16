package br.com.flexmedia.checkinhub.modules.totem;

import br.com.flexmedia.checkinhub.common.exception.ResourceNotFoundException;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TotemService {

    private final TotemRepository totemRepository;
    private final HotelRepository hotelRepository;

    public List<TotemResponseDTO> listarPorHotel(Long hotelId) {
        return totemRepository.findByHotelId(hotelId).stream()
                .map(t -> TotemResponseDTO.from(t, isOnline(t)))
                .toList();
    }

    @Transactional
    public TotemResponseDTO criar(Long hotelId, String nome) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel não encontrado: " + hotelId));
        Totem totem = Totem.builder()
                .hotel(hotel)
                .nome(nome)
                .apiKey(UUID.randomUUID().toString())
                .build();
        totem = totemRepository.save(totem);
        return TotemResponseDTO.from(totem, isOnline(totem));
    }

    @Transactional
    public void remover(Long id) {
        Totem totem = totemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Totem não encontrado: " + id));
        totemRepository.delete(totem);
    }

    @Transactional
    public TotemResponseDTO heartbeat(Long id) {
        Totem totem = totemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Totem não encontrado: " + id));
        totem.setUltimoHeartbeat(LocalDateTime.now());
        totem = totemRepository.save(totem);
        return TotemResponseDTO.from(totem, true);
    }

    public boolean isOnline(Totem totem) {
        if (totem.getUltimoHeartbeat() == null) return false;
        return totem.getUltimoHeartbeat().isAfter(LocalDateTime.now().minusMinutes(2));
    }
}
