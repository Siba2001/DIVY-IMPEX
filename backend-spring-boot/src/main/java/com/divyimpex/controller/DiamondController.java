package com.divyimpex.controller;

import com.divyimpex.dto.ApiResponse;
import com.divyimpex.dto.InitialDataResponse;
import com.divyimpex.entity.Diamond;
import com.divyimpex.entity.History;
import com.divyimpex.service.DiamondService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/diamonds")
public class DiamondController {

    @Autowired
    private DiamondService diamondService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Diamond>>> getAllDiamonds() {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.getAllDiamonds()));
    }

    @GetMapping("/initial-data")
    public ResponseEntity<ApiResponse<InitialDataResponse>> getInitialData() {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.getInitialData()));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<History>>> getDiamondHistory(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.getDiamondHistory(query)));
    }

    @PostMapping("/batch-receive")
    public ResponseEntity<ApiResponse<List<Diamond>>> receiveBatch(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.receiveDiamondsBatch(data)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Diamond>> updateDiamond(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.updateDiamond(data)));
    }

    @PostMapping("/batch-assign")
    public ResponseEntity<ApiResponse<Map<String, Object>>> assignBatch(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.assignDiamondsBatch(data)));
    }

    @PostMapping("/start-work")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startWork(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.startWork(data)));
    }

    @PostMapping("/complete-work")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeWork(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.markWorkCompleted(data)));
    }

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deposit(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.depositDiamond(data)));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verify(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.verifyDiamond(data)));
    }

    @PostMapping("/submit-to-company")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitToCompany(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(diamondService.submitDiamondsToCompany(data)));
    }
}

