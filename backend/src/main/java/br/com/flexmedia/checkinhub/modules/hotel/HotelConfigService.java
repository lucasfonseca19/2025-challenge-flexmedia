package br.com.flexmedia.checkinhub.modules.hotel;

import br.com.flexmedia.checkinhub.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HotelConfigService {

    private final HotelConfigRepository hotelConfigRepository;
    private final HotelRepository hotelRepository;

    public HotelConfigDTO buscar(Long hotelId) {
        HotelConfig config = hotelConfigRepository.findByHotelId(hotelId)
                .orElseGet(() -> criarPadrao(hotelId));
        return HotelConfigDTO.from(config);
    }

    @Transactional
    public HotelConfig buscarOuCriarPadrao(Long hotelId) {
        return hotelConfigRepository.findByHotelId(hotelId)
                .orElseGet(() -> {
                    Hotel hotel = hotelRepository.getReferenceById(hotelId);
                    HotelConfig config = HotelConfig.builder()
                            .hotel(hotel)
                            .nomeExibido(hotel.getNome())
                            .logoUrl("")
                            .corPrimaria("#1e40af")
                            .idiomasAtivos("pt,en")
                            .build();
                    return hotelConfigRepository.save(config);
                });
    }

    @Transactional
    public HotelConfigDTO atualizar(Long hotelId, HotelConfigDTO dto) {
        HotelConfig config = hotelConfigRepository.findByHotelId(hotelId)
                .orElseGet(() -> criarPadrao(hotelId));

        if (dto.nomeExibido() != null) config.setNomeExibido(dto.nomeExibido());
        if (dto.logoUrl() != null) config.setLogoUrl(dto.logoUrl());
        if (dto.corPrimaria() != null) config.setCorPrimaria(dto.corPrimaria());
        if (dto.idiomasAtivos() != null) config.setIdiomasAtivos(dto.idiomasAtivos());

        config = hotelConfigRepository.save(config);
        return HotelConfigDTO.from(config);
    }

    private HotelConfig criarPadrao(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel não encontrado: " + hotelId));
        HotelConfig nova = HotelConfig.builder().hotel(hotel).build();
        return hotelConfigRepository.save(nova);
    }
}
