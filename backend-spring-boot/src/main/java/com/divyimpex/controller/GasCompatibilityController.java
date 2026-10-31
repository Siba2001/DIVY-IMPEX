package com.divyimpex.controller;

import com.divyimpex.dto.ApiResponse;
import com.divyimpex.entity.Company;
import com.divyimpex.entity.Worker;
import com.divyimpex.service.CompanyService;
import com.divyimpex.service.DiamondService;
import com.divyimpex.service.UserService;
import com.divyimpex.service.WorkerService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping(value = {"/exec", "/api/exec"})
public class GasCompatibilityController {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private WorkerService workerService;

    @Autowired
    private DiamondService diamondService;

    @Autowired
    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Exact 1:1 replacement for Google Apps Script doGet(e)
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Object>> handleGet(
            @RequestParam(value = "action", defaultValue = "getInitialData") String action,
            @RequestParam(value = "key", required = false) String key,
            @RequestParam(value = "diamondIdOrBarcode", required = false) String diamondIdOrBarcode
    ) {
        try {
            Object result;
            switch (action) {
                case "getInitialData":
                    result = diamondService.getInitialData();
                    break;
                case "getCompanies":
                    result = companyService.getAllCompanies();
                    break;
                case "getWorkers":
                    result = workerService.getAllWorkers();
                    break;
                case "getDiamonds":
                    result = diamondService.getAllDiamonds();
                    break;
                case "getHistory":
                    result = diamondService.getDiamondHistory(diamondIdOrBarcode);
                    break;
                case "getUsers":
                    result = userService.getUsers();
                    break;
                default:
                    return ResponseEntity.ok(ApiResponse.error("Unknown GET action: " + action));
            }
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception err) {
            return ResponseEntity.ok(ApiResponse.error(err.getMessage()));
        }
    }

    /**
     * Exact 1:1 replacement for Google Apps Script doPost(e)
     * Consumes text/plain;charset=utf-8, application/json, and all media types
     */
    @PostMapping(consumes = MediaType.ALL_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Object>> handlePost(@RequestBody String rawBody) {
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String action = root.has("action") ? root.get("action").asText() : "";
            JsonNode dataNode = root.has("data") ? root.get("data") : root;

            Map<String, Object> data = new HashMap<>();
            if (dataNode != null && dataNode.isObject()) {
                data = objectMapper.convertValue(dataNode, new TypeReference<Map<String, Object>>() {});
            }

            Object result;
            switch (action) {
                case "addCompany":
                    Company company = objectMapper.convertValue(dataNode, Company.class);
                    result = companyService.addCompany(company);
                    break;

                case "updateCompany":
                    String compId = data.containsKey("id") ? String.valueOf(data.get("id")) : "";
                    result = companyService.updateCompany(compId, data);
                    break;

                case "deleteCompany":
                    String delCompId = data.containsKey("id") ? String.valueOf(data.get("id")) : dataNode.asText();
                    result = companyService.deleteCompany(delCompId);
                    break;

                case "addWorker":
                    Worker worker = objectMapper.convertValue(dataNode, Worker.class);
                    result = workerService.addWorker(worker);
                    break;

                case "updateWorker":
                    String workerId = data.containsKey("id") ? String.valueOf(data.get("id")) : "";
                    result = workerService.updateWorker(workerId, data);
                    break;

                case "deleteWorker":
                    String delWorkerId = data.containsKey("id") ? String.valueOf(data.get("id")) : dataNode.asText();
                    result = workerService.deleteWorker(delWorkerId);
                    break;

                case "receiveDiamondsBatch":
                    result = diamondService.receiveDiamondsBatch(data);
                    break;

                case "updateDiamond":
                    result = diamondService.updateDiamond(data);
                    break;

                case "assignDiamond":
                case "assignDiamondsBatch":
                    result = diamondService.assignDiamondsBatch(data);
                    break;

                case "startWork":
                    result = diamondService.startWork(data);
                    break;

                case "markWorkCompleted":
                    result = diamondService.markWorkCompleted(data);
                    break;

                case "depositDiamond":
                    result = diamondService.depositDiamond(data);
                    break;

                case "verifyDiamond":
                    result = diamondService.verifyDiamond(data);
                    break;

                case "submitDiamondsToCompany":
                    result = diamondService.submitDiamondsToCompany(data);
                    break;

                case "login":
                case "loginUser":
                    String username = data.containsKey("username") ? String.valueOf(data.get("username")) : "";
                    String password = data.containsKey("password") ? String.valueOf(data.get("password")) : "";
                    result = userService.loginUser(username, password);
                    break;

                case "createUser":
                    result = userService.createUser(data);
                    break;

                case "changeUserPassword":
                    String chUser = data.containsKey("username") ? String.valueOf(data.get("username")) : "";
                    String newPass = data.containsKey("newPassword") ? String.valueOf(data.get("newPassword")) : "";
                    result = userService.changeUserPassword(chUser, newPass);
                    break;

                case "changeUserId":
                    String oldUser = data.containsKey("oldUsername") ? String.valueOf(data.get("oldUsername")) : "";
                    String newUser = data.containsKey("newUsername") ? String.valueOf(data.get("newUsername")) : "";
                    result = userService.changeUserId(oldUser, newUser);
                    break;

                case "deleteUser":
                    String delUser = data.containsKey("username") ? String.valueOf(data.get("username")) : "";
                    result = userService.deleteUser(delUser);
                    break;

                case "verifyAdminAccess":
                    String key = data.containsKey("key") ? String.valueOf(data.get("key")) : "";
                    result = userService.verifyAdminAccess(key);
                    break;

                default:
                    throw new RuntimeException("Unsupported POST action: " + action);
            }

            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception err) {
            return ResponseEntity.ok(ApiResponse.error(err.getMessage()));
        }
    }
}

