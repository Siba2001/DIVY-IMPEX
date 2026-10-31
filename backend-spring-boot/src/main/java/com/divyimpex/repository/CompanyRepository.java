package com.divyimpex.repository;

import com.divyimpex.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, String> {
    Optional<Company> findByCodeIgnoreCase(String code);
    Optional<Company> findByNameIgnoreCase(String name);
}

