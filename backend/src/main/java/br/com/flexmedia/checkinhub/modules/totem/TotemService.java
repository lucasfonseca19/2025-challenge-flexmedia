package br.com.flexmedia.checkinhub.modules.totem;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.common.exception.ResourceNotFoundException;
import br.com.flexmedia.checkinhub.modules.conteudo.ConteudoTotem;
import br.com.flexmedia.checkinhub.modules.conteudo.ConteudoTotemRepository;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelConfig;
import br.com.flexmedia.checkinhub.modules.hotel.HotelConfigService;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesign;
import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesignRepository;
import br.com.flexmedia.checkinhub.modules.totemdesign.dto.TotemDesignDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class TotemService {

    private final TotemRepository totemRepository;
    private final HotelRepository hotelRepository;
    private final HotelConfigService hotelConfigService;
    private final ConteudoTotemRepository conteudoTotemRepository;
    private final TotemDesignRepository designRepository;
    private final ObjectMapper objectMapper;

    public List<TotemResponseDTO> listarPorHotel(Long hotelId) {
        return totemRepository.findByHotelId(hotelId).stream()
                .map(t -> TotemResponseDTO.from(t, isOnline(t)))
                .toList();
    }

    @Transactional
    public TotemResponseDTO criar(Long hotelId, String nome) {
        return criar(hotelId, new TotemRequestDTO(nome, null));
    }

    @Transactional
    public TotemResponseDTO criar(Long hotelId, TotemRequestDTO request) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel não encontrado: " + hotelId));
        TotemDesign design = buscarDesignDoHotel(hotel, request.designId());
        Totem totem = Totem.builder()
                .hotel(hotel)
                .nome(request.nome())
                .codigo(gerarCodigoUnico())
                .design(design)
                .build();
        totem = totemRepository.save(totem);
        return TotemResponseDTO.from(totem, isOnline(totem));
    }

    @Transactional
    public TotemResponseDTO atualizar(Long id, TotemRequestDTO request) {
        Totem totem = totemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Totem não encontrado: " + id));
        TotemDesign design = buscarDesignDoHotel(totem.getHotel(), request.designId());
        totem.setNome(request.nome());
        totem.setDesign(design);
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

    @Transactional
    public TotemConfigDTO buscarConfigPorCodigo(String codigo) {
        Totem totem = totemRepository.findByCodigo(codigo.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Totem não encontrado: " + codigo));

        HotelConfig hotelConfig = hotelConfigService.buscarOuCriarPadrao(totem.getHotel().getId());
        List<ConteudoTotem> conteudos = conteudoTotemRepository
                .findByHotelIdAndAtivoTrueOrderByOrdemExibicaoAsc(totem.getHotel().getId());

        totem.setUltimoHeartbeat(LocalDateTime.now());
        totemRepository.save(totem);

        return TotemConfigDTO.builder()
                .id(totem.getId())
                .codigo(totem.getCodigo())
                .nome(totem.getNome())
                .hotelId(totem.getHotel().getId())
                .config(TotemConfigDTO.ConfigDTO.builder()
                        .nomeExibido(hotelConfig.getNomeExibido())
                        .logoUrl(hotelConfig.getLogoUrl())
                        .corPrimaria(hotelConfig.getCorPrimaria())
                        .idiomasAtivos(hotelConfig.getIdiomasAtivos())
                        .build())
                .conteudo(conteudos.stream().map(c -> TotemConfigDTO.ConteudoDTO.builder()
                        .id(c.getId())
                        .tipo(c.getTipo().name())
                        .titulo(c.getTitulo())
                        .urlMidia(c.getUrlMidia())
                        .ordemExibicao(c.getOrdemExibicao())
                        .build()).toList())
                .design(totem.getDesign() != null ? TotemDesignDTO.from(totem.getDesign(), objectMapper) : null)
                .build();
    }

    public boolean isOnline(Totem totem) {
        if (totem.getUltimoHeartbeat() == null) return false;
        return totem.getUltimoHeartbeat().isAfter(LocalDateTime.now().minusMinutes(2));
    }

    private String gerarCodigoUnico() {
        String codigo;
        do {
            codigo = gerarCodigo();
        } while (totemRepository.existsByCodigo(codigo));
        return codigo;
    }

    private String gerarCodigo() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private TotemDesign buscarDesignDoHotel(Hotel hotel, Long designId) {
        if (designId == null) {
            return null;
        }
        TotemDesign design = designRepository.findById(designId)
                .orElseThrow(() -> new ResourceNotFoundException("Design não encontrado: " + designId));
        if (!design.getHotel().getId().equals(hotel.getId())) {
            throw new BusinessException("design não pertence ao hotel do totem.");
        }
        return design;
    }
}
