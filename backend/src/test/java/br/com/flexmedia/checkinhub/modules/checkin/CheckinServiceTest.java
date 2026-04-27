package br.com.flexmedia.checkinhub.modules.checkin;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.modules.hotel.Hotel;
import br.com.flexmedia.checkinhub.modules.hotel.Reserva;
import br.com.flexmedia.checkinhub.modules.hotel.ReservaRepository;
import br.com.flexmedia.checkinhub.modules.hotel.ReservaService;
import br.com.flexmedia.checkinhub.modules.hotel.StatusReserva;
import br.com.flexmedia.checkinhub.modules.metrics.MetricasService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckinServiceTest {

    @Mock private ReservaService reservaService;
    @Mock private ReservaRepository reservaRepository;
    @Mock private MetricasService metricasService;

    @InjectMocks
    private CheckinService checkinService;

    private Hotel hotelFixture() {
        return Hotel.builder().id(1L).nome("Hotel Test").cnpj("11.111.111/0001-11")
                .cidade("SP").estado("SP").build();
    }

    private Reserva reservaFixture(StatusReserva status) {
        return Reserva.builder()
                .id(10L)
                .codigoReserva("RES-001")
                .hospedeNome("João Silva")
                .hospedeCpf("111.222.333-44")
                .hospedeEmail("joao@email.com")
                .quartoNumero("101")
                .hotel(hotelFixture())
                .dataCheckin(LocalDate.now())
                .dataCheckout(LocalDate.now().plusDays(3))
                .hospedeDataNascimento(LocalDate.of(1990, 5, 15))
                .status(status)
                .build();
    }

    @Test
    void confirmarCheckin_quandoStatusConfirmada_realizaCheckinComSucesso() {
        Reserva reserva = reservaFixture(StatusReserva.CONFIRMADA);
        when(reservaService.findOrThrow(10L)).thenReturn(reserva);

        var result = checkinService.confirmarCheckin(
                10L,
                new CheckinConfirmDTO(null, LocalDate.of(1990, 5, 15), "pt")
        );

        assertThat(result.status()).isEqualTo(StatusReserva.CHECKIN_REALIZADO);
        verify(reservaRepository).save(reserva);
        verify(metricasService).registrarCheckin(1L);
    }

    @Test
    void confirmarCheckin_quandoStatusNaoConfirmada_lancaBusinessException() {
        Reserva reserva = reservaFixture(StatusReserva.CHECKIN_REALIZADO);
        when(reservaService.findOrThrow(10L)).thenReturn(reserva);

        assertThatThrownBy(() -> checkinService.confirmarCheckin(10L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Check-in não permitido");

        verify(reservaRepository, never()).save(any());
    }

    @Test
    void buscarParaCheckin_quandoCodigoValido_retornaReserva() {
        Reserva reserva = reservaFixture(StatusReserva.CONFIRMADA);
        var dto = br.com.flexmedia.checkinhub.modules.hotel.dto.ReservaResponseDTO.from(reserva);
        when(reservaService.buscarPorCodigo("RES-001")).thenReturn(dto);

        var result = checkinService.buscarParaCheckin("RES-001");

        assertThat(result.codigoReserva()).isEqualTo("RES-001");
    }

    @Test
    void buscarParaCheckin_quandoCpfSemMascara_retornaReserva() {
        Reserva reserva = reservaFixture(StatusReserva.CONFIRMADA);
        when(reservaService.buscarPorCodigo(anyString())).thenThrow(new RuntimeException("nao encontrado"));
        when(reservaRepository.findFirstByCpfAndStatusIn(eq("12345678900"), anyList()))
                .thenReturn(java.util.Optional.of(reserva));

        var result = checkinService.buscarParaCheckin("12345678900");

        assertThat(result.codigoReserva()).isEqualTo("RES-001");
    }

    @Test
    void buscarParaCheckin_quandoEntradaVazia_lancaBusinessException() {
        assertThatThrownBy(() -> checkinService.buscarParaCheckin("   "))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Código/CPF não informado");
    }
}
