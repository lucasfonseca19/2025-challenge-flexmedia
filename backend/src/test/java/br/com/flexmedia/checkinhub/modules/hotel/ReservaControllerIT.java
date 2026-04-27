package br.com.flexmedia.checkinhub.modules.hotel;

import br.com.flexmedia.checkinhub.security.RoleUsuario;
import br.com.flexmedia.checkinhub.security.Usuario;
import br.com.flexmedia.checkinhub.security.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReservaControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired HotelRepository hotelRepository;
    @Autowired ReservaRepository reservaRepository;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Hotel hotelA;
    private Hotel hotelB;
    private Reserva reservaHotelA;
    private Reserva reservaHotelB;

    @BeforeEach
    void setUp() {
        hotelA = hotelRepository.save(Hotel.builder()
                .nome("Hotel A")
                .cnpj("10.000.000/0001-01")
                .cidade("São Paulo")
                .estado("SP")
                .build());
        hotelB = hotelRepository.save(Hotel.builder()
                .nome("Hotel B")
                .cnpj("20.000.000/0001-02")
                .cidade("Rio")
                .estado("RJ")
                .build());

        usuarioRepository.save(Usuario.builder()
                .nome("Admin Teste")
                .email("admin-reserva@test.com")
                .senha(passwordEncoder.encode("senha123"))
                .role(RoleUsuario.ADMIN)
                .ativo(true)
                .build());
        usuarioRepository.save(Usuario.builder()
                .nome("Operador Hotel A")
                .email("op-a@test.com")
                .senha(passwordEncoder.encode("senha123"))
                .role(RoleUsuario.OPERADOR)
                .hotel(hotelA)
                .ativo(true)
                .build());

        reservaHotelA = salvarReserva("RES-A", hotelA);
        reservaHotelB = salvarReserva("RES-B", hotelB);
    }

    @Test
    @WithMockUser(username = "admin-reserva@test.com", roles = "ADMIN")
    void listarReservas_comAdminSemHotelId_retornaTodosOsHoteis() throws Exception {
        mockMvc.perform(get("/api/reservas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    @WithMockUser(username = "op-a@test.com", roles = "OPERADOR")
    void listarReservas_comOperadorIgnoraHotelIdDaQuery() throws Exception {
        mockMvc.perform(get("/api/reservas")
                        .param("hotelId", hotelB.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].codigoReserva").value("RES-A"))
                .andExpect(jsonPath("$.content[0].hotelId").value(hotelA.getId()));
    }

    @Test
    @WithMockUser(username = "op-a@test.com", roles = "OPERADOR")
    void buscarReservaDeOutroHotel_comOperador_retorna403() throws Exception {
        mockMvc.perform(get("/api/reservas/" + reservaHotelB.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "op-a@test.com", roles = "OPERADOR")
    void editarReservaDeOutroHotel_comOperador_retorna403() throws Exception {
        mockMvc.perform(put("/api/reservas/" + reservaHotelB.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bodyReserva("RES-B-EDIT", hotelB.getId()))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "op-a@test.com", roles = "OPERADOR")
    void deletarReservaDeOutroHotel_comOperador_retorna403() throws Exception {
        mockMvc.perform(delete("/api/reservas/" + reservaHotelB.getId()))
                .andExpect(status().isForbidden());
    }

    private Reserva salvarReserva(String codigo, Hotel hotel) {
        return reservaRepository.save(Reserva.builder()
                .codigoReserva(codigo)
                .hospedeNome("Hóspede " + codigo)
                .hospedeCpf("123.456.789-00")
                .hospedeEmail("hospede@test.com")
                .quartoNumero("101")
                .hotel(hotel)
                .dataCheckin(LocalDate.of(2026, 5, 1))
                .dataCheckout(LocalDate.of(2026, 5, 3))
                .status(StatusReserva.CONFIRMADA)
                .build());
    }

    private Map<String, Object> bodyReserva(String codigo, Long hotelId) {
        return Map.of(
                "codigoReserva", codigo,
                "hospedeNome", "Hóspede Editado",
                "hospedeCpf", "123.456.789-00",
                "hospedeEmail", "editado@test.com",
                "quartoNumero", "202",
                "hotelId", hotelId,
                "dataCheckin", "2026-05-02",
                "dataCheckout", "2026-05-04"
        );
    }
}
