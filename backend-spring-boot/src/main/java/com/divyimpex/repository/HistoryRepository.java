package com.divyimpex.repository;

import com.divyimpex.entity.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<History, String> {
    
    @Query("SELECT h FROM History h WHERE LOWER(h.barcode) = LOWER(:query) OR LOWER(h.diamondId) = LOWER(:query)")
    List<History> findByDiamondIdOrBarcode(@Param("query") String query);

    List<History> findByBarcodeIgnoreCase(String barcode);
    List<History> findByDiamondId(String diamondId);
}

