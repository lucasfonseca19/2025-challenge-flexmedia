package br.com.flexmedia.checkinhub.modules.checkout;

import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.modules.hotel.Reserva;
import br.com.flexmedia.checkinhub.modules.hotel.ReservaRepository;
import br.com.flexmedia.checkinhub.modules.hotel.ReservaService;
import br.com.flexmedia.checkinhub.modules.hotel.StatusReserva;
import br.com.flexmedia.checkinhub.modules.hotel.dto.ReservaResponseDTO;
import br.com.flexmedia.checkinhub.modules.keys.ChaveDigitalRepository;
import br.com.flexmedia.checkinhub.modules.metrics.MetricasService;
import br.com.flexmedia.checkinhub.pms.PMSAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CheckoutService {

    private final ReservaService reservaService;
    private final ReservaRepository reservaRepository;
    private final ChaveDigitalRepository chaveDigitalRepository;
    private final MetricasService metricasService;
    private final PMSAdapter pmsAdapter;

    public ReservaResponseDTO buscarParaCheckout(String codigoOuCpf) {
        try {
            return reservaService.buscarPorCodigo(codigoOuCpf);
        } catch (Exception e) {
            Reserva r = reservaRepository
                    .findByHospedeCpfAndStatus(codigoOuCpf, StatusReserva.CHECKIN_REALIZADO)
                    .orElseThrow(() -> new BusinessException("Reserva não encontrada para: " + codigoOuCpf));
            return ReservaResponseDTO.from(r);
        }
    }

    @Transactional
    public ReservaResponseDTO confirmarCheckout(Long reservaId) {
        Reserva reserva = reservaService.findOrThrow(reservaId);

        if (reserva.getStatus() != StatusReserva.CHECKIN_REALIZADO) {
            throw new BusinessException("Check-out não permitido. Status atual: " + reserva.getStatus());
        }

        // Invalida chaves digitais
        chaveDigitalRepository.findByReservaIdAndAtivaTrue(reservaId)
                .forEach(chave -> {
                    chave.setAtiva(false);
                    chaveDigitalRepository.save(chave);
                });

        reserva.setStatus(StatusReserva.CHECKOUT_REALIZADO);
        reservaRepository.save(reserva);

        try {
            pmsAdapter.confirmarCheckout(String.valueOf(reserva.getId()));
        } catch (Exception e) {
            log.warn("PMS não confirmou check-out {}: {}", reserva.getId(), e.getMessage());
        }

        metricasService.registrarCheckout(reserva.getHotel().getId());

        return ReservaResponseDTO.from(reserva);
    }
}
