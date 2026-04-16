package br.com.flexmedia.checkinhub.modules.hotel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HotelConfigRepository extends JpaRepository<HotelConfig, Long> {
    Optional<HotelConfig> findByHotelId(Long hotelId);
}
