package br.com.flexmedia.checkinhub.modules.totemdesign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TotemDesignRepository extends JpaRepository<TotemDesign, Long> {
    Optional<TotemDesign> findFirstByHotelIdAndStatusOrderByUpdatedAtDesc(Long hotelId, TotemDesignStatus status);
}
