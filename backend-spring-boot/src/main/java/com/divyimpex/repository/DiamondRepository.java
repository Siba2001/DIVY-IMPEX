package com.divyimpex.repository;

import com.divyimpex.entity.Diamond;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiamondRepository extends JpaRepository<Diamond, String> {
    Optional<Diamond> findByBarcodeIgnoreCase(String barcode);
    boolean existsByBarcodeIgnoreCase(String barcode);
    List<Diamond> findByCompanyId(String companyId);
    List<Diamond> findByAssignedWorkerId(String assignedWorkerId);
}

