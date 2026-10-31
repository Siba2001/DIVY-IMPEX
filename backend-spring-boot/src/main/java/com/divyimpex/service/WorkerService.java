package com.divyimpex.service;

import com.divyimpex.entity.Worker;
import com.divyimpex.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class WorkerService {

    @Autowired
    private WorkerRepository workerRepository;

    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    @Transactional
    public Worker addWorker(Worker data) {
        String employeeId = data.getEmployeeId() != null ? data.getEmployeeId().trim() : "";
        String name = data.getName() != null ? data.getName().trim() : "";
        String rawPhone = data.getPhone() != null ? data.getPhone() : "";
        String cleanPhone = rawPhone.replaceAll("\\D", "");
        if (cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(0, 10);
        }

        // Deduplication check: return existing worker if employeeId or (phone + name) matches
        if (!employeeId.isEmpty()) {
            Optional<Worker> existingByEmpId = workerRepository.findByEmployeeIdIgnoreCase(employeeId);
            if (existingByEmpId.isPresent()) {
                return existingByEmpId.get();
            }
        }
        if (!cleanPhone.isEmpty() && !name.isEmpty()) {
            Optional<Worker> existingByPhoneAndName = workerRepository.findByPhoneAndNameIgnoreCase(cleanPhone, name);
            if (existingByPhoneAndName.isPresent()) {
                return existingByPhoneAndName.get();
            }
        }

        String id = (data.getId() != null && !data.getId().trim().isEmpty())
                ? data.getId().trim()
                : "w-" + System.currentTimeMillis();

        if (employeeId.isEmpty()) {
            employeeId = "EMP-" + String.valueOf(System.currentTimeMillis()).substring(10);
        }

        Worker worker = new Worker(
                id,
                employeeId,
                name,
                data.getDepartment() != null && !data.getDepartment().trim().isEmpty() ? data.getDepartment().trim() : "General",
                cleanPhone,
                data.getStatus() != null && !data.getStatus().trim().isEmpty() ? data.getStatus().trim() : "ACTIVE"
        );

        return workerRepository.save(worker);
    }

    @Transactional
    public Worker updateWorker(String id, Map<String, Object> updates) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Worker with id " + id + " not found"));

        if (updates.containsKey("name") && updates.get("name") != null) {
            worker.setName(String.valueOf(updates.get("name")).trim());
        }
        if (updates.containsKey("employeeId") && updates.get("employeeId") != null) {
            worker.setEmployeeId(String.valueOf(updates.get("employeeId")).trim());
        }
        if (updates.containsKey("department") && updates.get("department") != null) {
            worker.setDepartment(String.valueOf(updates.get("department")).trim());
        }
        if (updates.containsKey("phone")) {
            String p = updates.get("phone") != null ? String.valueOf(updates.get("phone")).replaceAll("\\D", "") : "";
            if (p.length() > 10) p = p.substring(0, 10);
            worker.setPhone(p);
        }
        if (updates.containsKey("status") && updates.get("status") != null) {
            worker.setStatus(String.valueOf(updates.get("status")).trim());
        }

        return workerRepository.save(worker);
    }

    @Transactional
    public Map<String, Object> deleteWorker(String id) {
        boolean exists = workerRepository.existsById(id);
        if (exists) {
            workerRepository.deleteById(id);
        }
        return Map.of("id", id, "deleted", exists);
    }
}

