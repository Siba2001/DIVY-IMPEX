package com.divyimpex.controller;

import com.divyimpex.dto.ApiResponse;
import com.divyimpex.entity.Company;
import com.divyimpex.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Company>>> getAllCompanies() {
        return ResponseEntity.ok(ApiResponse.ok(companyService.getAllCompanies()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Company>> addCompany(@RequestBody Company company) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.addCompany(company)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Company>> updateCompany(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.updateCompany(id, updates)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteCompany(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(companyService.deleteCompany(id)));
    }
}

