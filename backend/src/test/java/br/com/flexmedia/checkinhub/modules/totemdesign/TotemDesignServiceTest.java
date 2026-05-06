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
    void buscarDraftCriaDesignPadraoQuandoNaoExiste() {
        Hotel hotel = hotel(1L);
        Usuario usuario = usuarioAdmin();
        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));
        when(designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(1L, TotemDesignStatus.DRAFT)).thenReturn(Optional.empty());
        when(designRepository.save(any(TotemDesign.class))).thenAnswer(invocation -> {
            TotemDesign design = invocation.getArgument(0);
            design.setId(10L);
            return design;
        });

        TotemDesignDTO dto = service.buscarDraft(1L);

        assertThat(dto.id()).isEqualTo(10L);
        assertThat(dto.status()).isEqualTo(TotemDesignStatus.DRAFT);
        assertThat(dto.theme().get("brandName").asText()).isEqualTo("CheckIn Hub");
        assertThat(dto.blocks()).isNotEmpty();
    }

    @Test
    void publicarCopiaRascunhoParaDesignPublicado() throws Exception {
        Hotel hotel = hotel(1L);
        Usuario usuario = usuarioAdmin();
        TotemDesign draft = TotemDesign.builder()
                .id(5L)
                .hotel(hotel)
                .status(TotemDesignStatus.DRAFT)
                .theme("{\"brandName\":\"Hotel Prado\"}")
                .layout("{\"template\":\"lobby-elegante\"}")
                .blocks("[{\"id\":\"hero\",\"type\":\"hero\",\"visible\":true,\"title\":\"Bem-vindo\"}]")
                .build();

        when(hotelRepository.findById(1L)).thenReturn(Optional.of(hotel));
        when(usuarioRepository.findByEmailAndAtivoTrue("admin@hotel.com")).thenReturn(Optional.of(usuario));
        when(designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(1L, TotemDesignStatus.DRAFT)).thenReturn(Optional.of(draft));
        when(designRepository.findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(1L, TotemDesignStatus.PUBLISHED)).thenReturn(Optional.empty());
        when(designRepository.save(any(TotemDesign.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.publicar(1L);

        ArgumentCaptor<TotemDesign> captor = ArgumentCaptor.forClass(TotemDesign.class);
        verify(designRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(TotemDesignStatus.PUBLISHED);
        assertThat(objectMapper.readTree(captor.getValue().getTheme()).get("brandName").asText()).isEqualTo("Hotel Prado");
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
