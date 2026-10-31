package com.divyimpex.controller;

import com.divyimpex.dto.ApiResponse;
import com.divyimpex.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody Map<String, Object> credentials) {
        String username = credentials.containsKey("username") ? String.valueOf(credentials.get("username")) : "";
        String password = credentials.containsKey("password") ? String.valueOf(credentials.get("password")) : "";
        return ResponseEntity.ok(ApiResponse.ok(userService.loginUser(username, password)));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUsers()));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createUser(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.ok(userService.createUser(data)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changePassword(@RequestBody Map<String, Object> data) {
        String username = data.containsKey("username") ? String.valueOf(data.get("username")) : "";
        String newPassword = data.containsKey("newPassword") ? String.valueOf(data.get("newPassword")) : "";
        return ResponseEntity.ok(ApiResponse.ok(userService.changeUserPassword(username, newPassword)));
    }

    @PostMapping("/change-username")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changeUsername(@RequestBody Map<String, Object> data) {
        String oldUsername = data.containsKey("oldUsername") ? String.valueOf(data.get("oldUsername")) : "";
        String newUsername = data.containsKey("newUsername") ? String.valueOf(data.get("newUsername")) : "";
        return ResponseEntity.ok(ApiResponse.ok(userService.changeUserId(oldUsername, newUsername)));
    }

    @DeleteMapping("/users/{username}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteUser(@PathVariable String username) {
        return ResponseEntity.ok(ApiResponse.ok(userService.deleteUser(username)));
    }

    @PostMapping("/verify-admin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyAdmin(@RequestBody Map<String, Object> data) {
        String key = data.containsKey("key") ? String.valueOf(data.get("key")) : "";
        return ResponseEntity.ok(ApiResponse.ok(userService.verifyAdminAccess(key)));
    }
}

