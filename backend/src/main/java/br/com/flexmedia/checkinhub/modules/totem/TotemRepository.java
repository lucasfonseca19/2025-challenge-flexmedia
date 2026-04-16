package br.com.flexmedia.checkinhub.modules.totem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TotemRepository extends JpaRepository<Totem, Long> {
    List<Totem> findByHotelId(Long hotelId);
}
