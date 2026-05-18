package br.com.flexmedia.checkinhub.modules.totem;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.modules.conteudo.ConteudoTotemRepository;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelConfig;
import br.com.flexmedia.checkinhub.modules.hotel.HotelConfigService;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesign;
import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesignRepository;
import br.com.flexmedia.checkinhub.modules.totemdesign.TotemDesignStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TotemServiceTest {

    @Mock TotemRepository totemRepository;
    @Mock HotelRepository hotelRepository;
    @Mock HotelConfigService hotelConfigService;
    @Mock ConteudoTotemRepository conteudoTotemRepository;
    @Mock TotemDesignRepository designRepository;

    private TotemService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new TotemService(totemRepository, hotelRepository, hotelConfigService, conteudoTotemRepository, designRepository, objectMapper);
    }

    @Test
    void criarTotemComDesignOpcionalAssociaPresetDoMesmoHotel() {
        Hotel hotel = hotel(1L);
        TotemDesign design = design(7L, hotel, "Design Saguão");

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(designRepository.findById(7L)).thenReturn(Optional.of(design));
        when(totemRepository.existsByCodigo(any())).thenReturn(false);
        when(totemRepository.save(any(Totem.class))).thenAnswer(invocation -> {
            Totem totem = invocation.getArgument(0);
            totem.setId(20L);
            return totem;
        });

        TotemResponseDTO response = service.criar(1L, new TotemRequestDTO("Lobby", 7L));

        assertThat(response.designId()).isEqualTo(7L);
        assertThat(response.designName()).isEqualTo("Design Saguão");
    }

    @Test
    void criarTotemRejeitaDesignDeOutroHotel() {
        Hotel hotel = hotel(1L);
        TotemDesign design = design(7L, hotel(2L), "Design Outro Hotel");

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(designRepository.findById(7L)).thenReturn(Optional.of(design));

        assertThatThrownBy(() -> service.criar(1L, new TotemRequestDTO("Lobby", 7L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("design");
    }

    @Test
    void atualizarTotemAlteraNomeEDesignOpcional() {
        Hotel hotel = hotel(1L);
        TotemDesign design = design(7L, hotel, "Design Saguão");
        Totem totem = Totem.builder()
                .id(20L)
                .hotel(hotel)
                .nome("Antigo")
                .codigo("ABC123")
                .build();

        when(totemRepository.findById(20L)).thenReturn(Optional.of(totem));
        when(designRepository.findById(7L)).thenReturn(Optional.of(design));
        when(totemRepository.save(any(Totem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TotemResponseDTO response = service.atualizar(20L, new TotemRequestDTO("Lobby", 7L));

        assertThat(response.nome()).isEqualTo("Lobby");
        assertThat(response.designId()).isEqualTo(7L);
    }

    @Test
    void buscarConfigPorCodigoRetornaDesignAtribuidoAoTotem() {
        Hotel hotel = hotel(1L);
        TotemDesign design = design(7L, hotel, "Design Saguão");
        Totem totem = Totem.builder()
                .id(20L)
                .hotel(hotel)
                .nome("Lobby")
                .codigo("ABC123")
                .design(design)
                .build();

        when(totemRepository.findByCodigo("ABC123")).thenReturn(Optional.of(totem));
        when(hotelConfigService.buscarOuCriarPadrao(1L)).thenReturn(HotelConfig.builder()
                .hotel(hotel)
                .nomeExibido("Hotel Prado")
                .logoUrl("")
                .corPrimaria("#0f766e")
                .idiomasAtivos("pt,en")
                .build());
        when(conteudoTotemRepository.findByHotelIdAndAtivoTrueOrderByOrdemExibicaoAsc(1L)).thenReturn(List.of());
        when(totemRepository.save(any(Totem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TotemConfigDTO config = service.buscarConfigPorCodigo("abc123");

        assertThat(config.getDesign()).isNotNull();
        assertThat(config.getDesign().nome()).isEqualTo("Design Saguão");
    }

    @Test
    void buscarConfigPorCodigoSemDesignRetornaFallbackNulo() {
        Hotel hotel = hotel(1L);
        Totem totem = Totem.builder()
                .id(20L)
                .hotel(hotel)
                .nome("Lobby")
                .codigo("ABC123")
                .build();

        when(totemRepository.findByCodigo("ABC123")).thenReturn(Optional.of(totem));
        when(hotelConfigService.buscarOuCriarPadrao(1L)).thenReturn(HotelConfig.builder()
                .hotel(hotel)
                .nomeExibido("Hotel Prado")
                .logoUrl("")
                .corPrimaria("#0f766e")
                .idiomasAtivos("pt,en")
                .build());
        when(conteudoTotemRepository.findByHotelIdAndAtivoTrueOrderByOrdemExibicaoAsc(1L)).thenReturn(List.of());
        when(totemRepository.save(any(Totem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TotemConfigDTO config = service.buscarConfigPorCodigo("abc123");

        assertThat(config.getDesign()).isNull();
    }

    private Hotel hotel(Long id) {
        return Hotel.builder()
                .id(id)
                .nome("Hotel Prado")
                .cnpj("12.345.678/0001-90")
                .cidade("São Paulo")
                .estado("SP")
                .ativo(true)
                .build();
    }

    private TotemDesign design(Long id, Hotel hotel, String nome) {
        return TotemDesign.builder()
                .id(id)
                .hotel(hotel)
                .nome(nome)
                .status(TotemDesignStatus.PUBLISHED)
                .theme("{\"brandName\":\"Hotel Prado\"}")
                .layout("{\"template\":\"premium-utilitario\"}")
                .blocks("[{\"id\":\"hero\",\"type\":\"hero\",\"visible\":true,\"title\":\"Bem-vindo\"}]")
                .build();
    }
}
