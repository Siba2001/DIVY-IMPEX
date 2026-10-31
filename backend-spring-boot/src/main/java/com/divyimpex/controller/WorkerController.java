package com.divyimpex.controller;

import com.divyimpex.dto.ApiResponse;
import com.divyimpex.entity.Worker;
import com.divyimpex.service.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/workers")
public class WorkerController {

    @Autowired
    private WorkerService workerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Worker>>> getAllWorkers() {
        return ResponseEntity.ok(ApiResponse.ok(workerService.getAllWorkers()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Worker>> addWorker(@RequestBody Worker worker) {
        return ResponseEntity.ok(ApiResponse.ok(workerService.addWorker(worker)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Worker>> updateWorker(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(ApiResponse.ok(workerService.updateWorker(id, updates)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteWorker(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(workerService.deleteWorker(id)));
    }
}

