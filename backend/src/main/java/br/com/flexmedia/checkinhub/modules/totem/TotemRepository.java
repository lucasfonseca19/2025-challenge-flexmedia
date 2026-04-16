package br.com.flexmedia.checkinhub.modules.totem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TotemRepository extends JpaRepository<Totem, Long> {
    List<Totem> findByHotelId(Long hotelId);
    Optional<Totem> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
