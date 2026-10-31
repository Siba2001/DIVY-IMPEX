package com.divyimpex.service;

import com.divyimpex.entity.Company;
import com.divyimpex.repository.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @Transactional
    public Company addCompany(Company data) {
        String code = data.getCode() != null ? data.getCode().trim().toUpperCase() : "";
        String name = data.getName() != null ? data.getName().trim() : "";

        // Deduplication check: return existing company if code or name matches
        if (!code.isEmpty()) {
            Optional<Company> existingByCode = companyRepository.findByCodeIgnoreCase(code);
            if (existingByCode.isPresent()) {
                return existingByCode.get();
            }
        }
        if (!name.isEmpty()) {
            Optional<Company> existingByName = companyRepository.findByNameIgnoreCase(name);
            if (existingByName.isPresent()) {
                return existingByName.get();
            }
        }

        String rawPhone = data.getPhone() != null ? data.getPhone() : "";
        String cleanPhone = rawPhone.replaceAll("\\D", "");
        if (cleanPhone.length() > 10) {
            cleanPhone = cleanPhone.substring(0, 10);
        }

        String id = (data.getId() != null && !data.getId().trim().isEmpty())
                ? data.getId().trim()
                : "comp-" + System.currentTimeMillis();

        Company company = new Company(
                id,
                name,
                code,
                data.getContactPerson() != null ? data.getContactPerson().trim() : "",
                cleanPhone,
                data.getEmail() != null ? data.getEmail().trim() : "",
                data.getStatus() != null && !data.getStatus().trim().isEmpty() ? data.getStatus() : "ACTIVE",
                data.getAddress() != null ? data.getAddress().trim() : ""
        );

        return companyRepository.save(company);
    }

    @Transactional
    public Company updateCompany(String id, Map<String, Object> updates) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company with id " + id + " not found"));

        if (updates.containsKey("name") && updates.get("name") != null) {
            company.setName(String.valueOf(updates.get("name")).trim());
        }
        if (updates.containsKey("code") && updates.get("code") != null) {
            company.setCode(String.valueOf(updates.get("code")).trim().toUpperCase());
        }
        if (updates.containsKey("contactPerson")) {
            company.setContactPerson(updates.get("contactPerson") != null ? String.valueOf(updates.get("contactPerson")).trim() : "");
        }
        if (updates.containsKey("phone")) {
            String p = updates.get("phone") != null ? String.valueOf(updates.get("phone")).replaceAll("\\D", "") : "";
            if (p.length() > 10) p = p.substring(0, 10);
            company.setPhone(p);
        }
        if (updates.containsKey("email")) {
            company.setEmail(updates.get("email") != null ? String.valueOf(updates.get("email")).trim() : "");
        }
        if (updates.containsKey("status") && updates.get("status") != null) {
            company.setStatus(String.valueOf(updates.get("status")).trim());
        }
        if (updates.containsKey("address")) {
            company.setAddress(updates.get("address") != null ? String.valueOf(updates.get("address")).trim() : "");
        }

        return companyRepository.save(company);
    }

    @Transactional
    public Map<String, Object> deleteCompany(String id) {
        boolean exists = companyRepository.existsById(id);
        if (exists) {
            companyRepository.deleteById(id);
        }
        return Map.of("id", id, "deleted", exists);
    }
}

