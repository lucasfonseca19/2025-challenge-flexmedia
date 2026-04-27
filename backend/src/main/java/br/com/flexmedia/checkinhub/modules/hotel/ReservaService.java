package br.com.flexmedia.checkinhub.modules.hotel;

import br.com.flexmedia.checkinhub.common.exception.ResourceNotFoundException;
import br.com.flexmedia.checkinhub.common.exception.BusinessException;
import br.com.flexmedia.checkinhub.modules.hotel.dto.ReservaRequestDTO;
import br.com.flexmedia.checkinhub.modules.hotel.dto.ReservaResponseDTO;
import br.com.flexmedia.checkinhub.security.CurrentUserService;
import br.com.flexmedia.checkinhub.security.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final HotelRepository hotelRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public ReservaResponseDTO criar(ReservaRequestDTO dto) {
        if (reservaRepository.findByCodigoReserva(dto.codigoReserva()).isPresent()) {
            throw new BusinessException("Código de reserva já cadastrado: " + dto.codigoReserva());
        }

        if (dto.dataCheckout().isBefore(dto.dataCheckin())) {
            throw new BusinessException("Data de checkout deve ser maior ou igual ao check-in.");
        }

        Long hotelId = resolveHotelIdForRequest(dto.hotelId());
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel não encontrado: " + hotelId));

        Reserva reserva = Reserva.builder()
                .codigoReserva(dto.codigoReserva())
                .hospedeNome(dto.hospedeNome())
                .hospedeCpf(dto.hospedeCpf())
                .hospedeEmail(dto.hospedeEmail())
                .quartoNumero(dto.quartoNumero())
                .hotel(hotel)
                .dataCheckin(dto.dataCheckin())
                .dataCheckout(dto.dataCheckout())
                .hospedeDataNascimento(dto.hospedeDataNascimento())
                .status(StatusReserva.CONFIRMADA)
                .build();

        return ReservaResponseDTO.from(reservaRepository.save(reserva));
    }

    public Page<ReservaResponseDTO> listar(Long hotelId, String busca, Pageable pageable) {
        Usuario usuario = currentUserService.getCurrentUser();
        Long effectiveHotelId = currentUserService.isAdmin(usuario)
                ? hotelId
                : currentUserService.getOperatorHotelId(usuario);

        if (effectiveHotelId != null) {
            return reservaRepository.findByHotelAndBusca(effectiveHotelId, busca, pageable)
                    .map(ReservaResponseDTO::from);
        }
        return reservaRepository.findAll(pageable).map(ReservaResponseDTO::from);
    }

    public ReservaResponseDTO buscarPorId(Long id) {
        Reserva reserva = findOrThrow(id);
        assertCanAccess(reserva);
        return ReservaResponseDTO.from(reserva);
    }

    public ReservaResponseDTO buscarPorCodigo(String codigo) {
        return ReservaResponseDTO.from(
                reservaRepository.findByCodigoReserva(codigo)
                        .orElseThrow(() -> new ResourceNotFoundException("Reserva não encontrada: " + codigo))
        );
    }

    public ReservaResponseDTO buscarPorCodigoAdministrativo(String codigo) {
        Reserva reserva = reservaRepository.findByCodigoReserva(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva não encontrada: " + codigo));
        assertCanAccess(reserva);
        return ReservaResponseDTO.from(reserva);
    }

    public Reserva findOrThrow(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva não encontrada: " + id));
    }

    public Reserva findByCodigoOrThrow(String codigo) {
        return reservaRepository.findByCodigoReserva(codigo)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva não encontrada: " + codigo));
    }

    @Transactional
    public ReservaResponseDTO atualizar(Long id, ReservaRequestDTO dto) {
        Reserva reserva = findOrThrow(id);
        assertCanAccess(reserva);

        if (!reserva.getCodigoReserva().equals(dto.codigoReserva())) {
            if (reservaRepository.findByCodigoReserva(dto.codigoReserva()).isPresent()) {
                throw new BusinessException("Código de reserva já cadastrado: " + dto.codigoReserva());
            }
        }

        if (dto.dataCheckout().isBefore(dto.dataCheckin())) {
            throw new BusinessException("Data de checkout deve ser maior ou igual ao check-in.");
        }

        Long hotelId = resolveHotelIdForRequest(dto.hotelId());
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel não encontrado: " + hotelId));

        reserva.setCodigoReserva(dto.codigoReserva());
        reserva.setHospedeNome(dto.hospedeNome());
        reserva.setHospedeCpf(dto.hospedeCpf());
        reserva.setHospedeEmail(dto.hospedeEmail());
        reserva.setQuartoNumero(dto.quartoNumero());
        reserva.setHotel(hotel);
        reserva.setDataCheckin(dto.dataCheckin());
        reserva.setDataCheckout(dto.dataCheckout());
        reserva.setHospedeDataNascimento(dto.hospedeDataNascimento());

        return ReservaResponseDTO.from(reservaRepository.save(reserva));
    }

    @Transactional
    public void deletar(Long id) {
        Reserva reserva = findOrThrow(id);
        assertCanAccess(reserva);
        reservaRepository.delete(reserva);
    }

    private Long resolveHotelIdForRequest(Long requestedHotelId) {
        Usuario usuario = currentUserService.getCurrentUser();
        if (currentUserService.isAdmin(usuario)) {
            return requestedHotelId;
        }
        return currentUserService.getOperatorHotelId(usuario);
    }

    private void assertCanAccess(Reserva reserva) {
        Usuario usuario = currentUserService.getCurrentUser();
        if (currentUserService.isAdmin(usuario)) {
            return;
        }

        Long operatorHotelId = currentUserService.getOperatorHotelId(usuario);
        if (!operatorHotelId.equals(reserva.getHotel().getId())) {
            throw new AccessDeniedException("Reserva não pertence ao hotel do operador.");
        }
    }
}
