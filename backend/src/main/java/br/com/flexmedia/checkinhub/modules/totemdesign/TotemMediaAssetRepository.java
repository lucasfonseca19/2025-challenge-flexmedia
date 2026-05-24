package br.com.flexmedia.checkinhub.modules.totemdesign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TotemMediaAssetRepository extends JpaRepository<TotemMediaAsset, Long> {
    List<TotemMediaAsset> findByHotelIdOrderByCreatedAtDesc(Long hotelId);
}
