package br.com.flexmedia.checkinhub.modules.totemdesign;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.common.exception.ResourceNotFoundException;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import br.com.flexmedia.checkinhub.modules.totemdesign.dto.TotemDesignDTO;
import br.com.flexmedia.checkinhub.security.RoleUsuario;
import br.com.flexmedia.checkinhub.security.Usuario;
import br.com.flexmedia.checkinhub.security.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TotemDesignServiceTest {

    @Mock TotemDesignRepository designRepository;
    @Mock TotemMediaAssetRepository mediaRepository;
    @Mock HotelRepository hotelRepository;
    @Mock UsuarioRepository usuarioRepository;

    private TotemDesignService service;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws Exception {
        service = new TotemDesignService(designRepository, mediaRepository, hotelRepository, usuarioRepository, objectMapper);
        ReflectionTestUtils.setField(service, "uploadsDir", Files.createTempDirectory("totem-upload-test").toString());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin@hotel.com", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listarPresetsRetornaDesignsNomeadosDoHotel() {
        Hotel hotel = hotel(1L);
        Usuario usuario = usuarioAdmin();
        TotemDesign design = TotemDesign.builder()
                .id(10L)
                .hotel(hotel)
                .nome("Design Saguão")
                .status(TotemDesignStatus.PUBLISHED)
                .theme("{\"brandName\":\"Hotel Prado\"}")
                .layout("{\"template\":\"premium-utilitario\"}")
                .blocks("[{\"id\":\"hero\",\"type\":\"hero\",\"visible\":true,\"title\":\"Bem-vindo\"}]")
                .build();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));
        when(designRepository.findByHotelIdOrderByUpdatedAtDesc(1L)).thenReturn(java.util.List.of(design));

        var designs = service.listarPresets(1L);

        assertThat(designs).hasSize(1);
        assertThat(designs.get(0).nome()).isEqualTo("Design Saguão");
        assertThat(designs.get(0).theme().get("brandName").asText()).isEqualTo("Hotel Prado");
    }

    @Test
    void salvarPresetCriaDesignNomeado() throws Exception {
        Hotel hotel = hotel(1L);
        Usuario usuario = usuarioAdmin();
        TotemDesignDTO request = new TotemDesignDTO(
                null,
                1L,
                "Design Saguão",
                TotemDesignStatus.PUBLISHED,
                objectMapper.createObjectNode().put("brandName", "Hotel Prado"),
                objectMapper.createObjectNode().put("template", "premium-utilitario"),
                objectMapper.readTree("[{\"id\":\"hero\",\"type\":\"hero\",\"visible\":true,\"title\":\"Bem-vindo\"}]"),
                null,
                null
        );

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));
        when(designRepository.save(any(TotemDesign.class))).thenAnswer(invocation -> {
            TotemDesign design = invocation.getArgument(0);
            design.setId(10L);
            return design;
        });

        TotemDesignDTO saved = service.salvarPreset(1L, request);

        ArgumentCaptor<TotemDesign> captor = ArgumentCaptor.forClass(TotemDesign.class);
        verify(designRepository).save(captor.capture());
        assertThat(saved.id()).isEqualTo(10L);
        assertThat(saved.nome()).isEqualTo("Design Saguão");
        assertThat(captor.getValue().getStatus()).isEqualTo(TotemDesignStatus.PUBLISHED);
        assertThat(captor.getValue().getNome()).isEqualTo("Design Saguão");
    }

    @Test
    void operadorNaoPodeEditarOutroHotel() {
        Hotel hotel = hotel(2L);
        Usuario usuario = Usuario.builder()
                .id(7L)
                .email("admin@hotel.com")
                .role(RoleUsuario.OPERADOR)
                .hotel(hotel(1L))
                .ativo(true)
                .build();

        when(hotelRepository.findById(2L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.buscarDraft(2L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("não autorizado");
    }

    @Test
    void uploadRecusaTipoNaoPermitido() {
        Hotel hotel = hotel(1L);
        Usuario usuario = usuarioAdmin();
        MockMultipartFile file = new MockMultipartFile("file", "script.svg", "image/svg+xml", "<svg />".getBytes());

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> service.upload(1L, file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tipo de mídia");
    }

    @Test
    void buscarPublicadoRetornaNullQuandoNaoHaDesignPublicado() {
        when(designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(1L, TotemDesignStatus.PUBLISHED)).thenReturn(Optional.empty());

        assertThat(service.buscarPublicado(1L)).isNull();
    }

    @Test
    void publicarFalhaQuandoRascunhoNaoExiste() {
        Hotel hotel = hotel(1L);
        Usuario usuario = usuarioAdmin();
        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));
        when(designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(1L, TotemDesignStatus.DRAFT)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.publicar(1L))
                .isInstanceOf(ResourceNotFoundException.class);
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

    private Usuario usuarioAdmin() {
        return Usuario.builder()
                .id(1L)
                .email("admin@hotel.com")
                .role(RoleUsuario.ADMIN)
                .ativo(true)
                .build();
    }
}
