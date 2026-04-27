package br.com.flexmedia.checkinhub.modules.checkin;

import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.HotelRepository;
import br.com.flexmedia.checkinhub.modules.hotel.Reserva;
import br.com.flexmedia.checkinhub.modules.hotel.ReservaRepository;
import br.com.flexmedia.checkinhub.modules.hotel.StatusReserva;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CheckinControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired HotelRepository hotelRepository;
    @Autowired ReservaRepository reservaRepository;

    private Hotel hotel;

    @BeforeEach
    void setUp() {
        hotel = hotelRepository.save(Hotel.builder()
                .nome("Hotel Teste IT")
                .cnpj("12.345.678/0001-00")
                .cidade("São Paulo").estado("SP")
                .build());
    }

    private Reserva salvarReserva(String codigo, String cpf, StatusReserva status) {
        return reservaRepository.save(Reserva.builder()
                .codigoReserva(codigo)
                .hospedeNome("Hóspede " + codigo)
                .hospedeCpf(cpf)
                .hospedeEmail("hospede@test.com")
                .quartoNumero("101")
                .hotel(hotel)
                .dataCheckin(LocalDate.now())
                .dataCheckout(LocalDate.now().plusDays(2))
                .hospedeDataNascimento(LocalDate.of(1990, 5, 15))
                .status(status)
                .build());
    }

    // ── Busca de reserva ──────────────────────────────────────────────────────

    @Test
    void buscar_porCodigoValido_retorna200ComDadosDaReserva() throws Exception {
        salvarReserva("RES-IT-001", "111.222.333-44", StatusReserva.CONFIRMADA);

        mockMvc.perform(get("/api/checkin/reserva/RES-IT-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoReserva").value("RES-IT-001"))
                .andExpect(jsonPath("$.status").value("CONFIRMADA"));
    }

    @Test
    void buscar_codigoInexistente_retorna422() throws Exception {
        mockMvc.perform(get("/api/checkin/reserva/RES-NAO-EXISTE"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void buscar_porCpfComMascara_retorna200ComDadosDaReserva() throws Exception {
        salvarReserva("RES-IT-CPF-001", "123.456.789-00", StatusReserva.CONFIRMADA);

        mockMvc.perform(get("/api/checkin/reserva/123.456.789-00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoReserva").value("RES-IT-CPF-001"));
    }

    @Test
    void buscar_porCpfSemMascara_retorna200ComDadosDaReserva() throws Exception {
        salvarReserva("RES-IT-CPF-002", "123.456.789-01", StatusReserva.CONFIRMADA);

        mockMvc.perform(get("/api/checkin/reserva/12345678901"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigoReserva").value("RES-IT-CPF-002"));
    }

    // ── Confirmação de check-in ───────────────────────────────────────────────

    @Test
    void confirmarCheckin_reservaConfirmada_retorna200EStatusCheckinRealizado() throws Exception {
        Reserva reserva = salvarReserva("RES-IT-002", "222.333.444-55", StatusReserva.CONFIRMADA);

        mockMvc.perform(post("/api/checkin/confirmar/" + reserva.getId())
                        .contentType("application/json")
                        .content("{\"dataNascimento\":\"1990-05-15\",\"idioma\":\"pt\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKIN_REALIZADO"));
    }

    @Test
    void confirmarCheckin_reservaInexistente_retorna404() throws Exception {
        mockMvc.perform(post("/api/checkin/confirmar/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void confirmarCheckin_checkinDuplicado_retorna422() throws Exception {
        // Reserva já está com CHECKIN_REALIZADO (check-in duplicado)
        Reserva reserva = salvarReserva("RES-IT-003", "333.444.555-66", StatusReserva.CHECKIN_REALIZADO);

        mockMvc.perform(post("/api/checkin/confirmar/" + reserva.getId()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Check-in não permitido")));
    }

    @Test
    void confirmarCheckin_reservaCancelada_retorna422() throws Exception {
        Reserva reserva = salvarReserva("RES-IT-004", "444.555.666-77", StatusReserva.CANCELADA);

        mockMvc.perform(post("/api/checkin/confirmar/" + reserva.getId()))
                .andExpect(status().isUnprocessableEntity());
    }
}
