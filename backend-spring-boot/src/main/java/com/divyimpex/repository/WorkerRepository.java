package com.divyimpex.repository;

import com.divyimpex.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, String> {
    Optional<Worker> findByEmployeeIdIgnoreCase(String employeeId);
    Optional<Worker> findByPhoneAndNameIgnoreCase(String phone, String name);
}

