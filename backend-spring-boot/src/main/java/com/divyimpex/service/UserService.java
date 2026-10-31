package com.divyimpex.service;

import com.divyimpex.entity.User;
import com.divyimpex.repository.UserRepository;
import com.divyimpex.util.DateTimeUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Value("${divy.api.secret:DIVY_SECURE_TOKEN_2026}")
    private String apiSecret;

    public static String hashPassword(String plainPassword) {
        if (plainPassword == null || plainPassword.trim().isEmpty()) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(plainPassword.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm error", e);
        }
    }

    @PostConstruct
    public void ensureAdminUser() {
        if (userRepository.count() == 0) {
            DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
            User admin = new User(
                    "usr-admin",
                    "admin",
                    hashPassword("admin123"),
                    "admin",
                    "Admin Manager",
                    "admin@divyimpex.com",
                    "ACTIVE",
                    timeInfo.getDateStr()
            );
            userRepository.save(admin);
        }
    }

    public List<Map<String, Object>> getUsers() {
        return userRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("name", u.getName());
            map.put("role", u.getRole() != null ? u.getRole() : "worker");
            map.put("email", u.getEmail() != null ? u.getEmail() : "");
            map.put("status", u.getStatus() != null ? u.getStatus() : "ACTIVE");
            map.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt() : "");
            return map;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> loginUser(String username, String password) {
        String cleanUser = username != null ? username.trim().toLowerCase() : "";
        String cleanPass = password != null ? password.trim() : "";

        if (cleanUser.isEmpty() || cleanPass.isEmpty()) {
            return Map.of("success", false, "message", "Username and password are required.");
        }

        String hash = hashPassword(cleanPass);
        Optional<User> found = userRepository.findByUsernameIgnoreCase(cleanUser);

        if (found.isEmpty() || !found.get().getPasswordHash().equals(hash)) {
            return Map.of("success", false, "message", "Invalid username or password!");
        }

        User u = found.get();
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", u.getId());
        userMap.put("username", u.getUsername());
        userMap.put("name", u.getName());
        userMap.put("role", u.getRole() != null ? u.getRole() : "worker");
        userMap.put("email", u.getEmail() != null ? u.getEmail() : "");
        userMap.put("status", u.getStatus() != null ? u.getStatus() : "ACTIVE");

        return Map.of("success", true, "user", userMap);
    }

    @Transactional
    public Map<String, Object> createUser(Map<String, Object> data) {
        String username = data.get("username") != null ? String.valueOf(data.get("username")).trim() : "";
        String password = data.get("password") != null ? String.valueOf(data.get("password")).trim() : "";
        String name = data.get("name") != null ? String.valueOf(data.get("name")).trim() : "";
        String role = data.get("role") != null ? String.valueOf(data.get("role")).trim().toLowerCase() : "worker";
        String email = data.get("email") != null ? String.valueOf(data.get("email")).trim() : "";

        if (username.isEmpty()) return Map.of("success", false, "message", "User ID is required.");
        if (password.length() < 4) return Map.of("success", false, "message", "Password must be at least 4 characters.");
        if (name.isEmpty()) return Map.of("success", false, "message", "Full Name is required.");

        if (userRepository.findByUsernameIgnoreCase(username).isPresent()) {
            return Map.of("success", false, "message", "User ID \"" + username + "\" already exists in database!");
        }

        DateTimeUtil.FormattedTime timeInfo = DateTimeUtil.getFormattedTime();
        User newUser = new User(
                "usr-" + System.currentTimeMillis(),
                username,
                hashPassword(password),
                role,
                name,
                email,
                "ACTIVE",
                timeInfo.getDateStr()
        );

        User saved = userRepository.save(newUser);
        Map<String, Object> userMap = Map.of(
                "id", saved.getId(),
                "username", saved.getUsername(),
                "role", saved.getRole(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "createdAt", saved.getCreatedAt()
        );

        return Map.of(
                "success", true,
                "message", "User account \"" + username + "\" created securely in database!",
                "user", userMap
        );
    }

    @Transactional
    public Map<String, Object> changeUserPassword(String username, String newPassword) {
        String cleanUser = username != null ? username.trim().toLowerCase() : "";
        String cleanPass = newPassword != null ? newPassword.trim() : "";

        if (cleanUser.isEmpty()) return Map.of("success", false, "message", "User ID is required.");
        if (cleanPass.length() < 4) return Map.of("success", false, "message", "New password must be at least 4 characters.");

        Optional<User> found = userRepository.findByUsernameIgnoreCase(cleanUser);
        if (found.isEmpty()) return Map.of("success", false, "message", "User not found.");

        User user = found.get();
        user.setPasswordHash(hashPassword(cleanPass));
        userRepository.save(user);

        return Map.of("success", true, "message", "Password for \"" + cleanUser + "\" successfully updated in database!");
    }

    @Transactional
    public Map<String, Object> changeUserId(String oldUsername, String newUsername) {
        String cleanOld = oldUsername != null ? oldUsername.trim() : "";
        String cleanNew = newUsername != null ? newUsername.trim() : "";

        if (cleanNew.isEmpty()) return Map.of("success", false, "message", "New User ID cannot be empty.");

        if (userRepository.findByUsernameIgnoreCase(cleanNew).isPresent()) {
            return Map.of("success", false, "message", "User ID \"" + cleanNew + "\" is already taken in database!");
        }

        Optional<User> found = userRepository.findByUsernameIgnoreCase(cleanOld);
        if (found.isEmpty()) return Map.of("success", false, "message", "User not found.");

        User user = found.get();
        user.setUsername(cleanNew);
        userRepository.save(user);

        return Map.of("success", true, "message", "User ID changed to \"" + cleanNew + "\" in database!");
    }

    @Transactional
    public Map<String, Object> deleteUser(String username) {
        String cleanUser = username != null ? username.trim().toLowerCase() : "";
        Optional<User> found = userRepository.findByUsernameIgnoreCase(cleanUser);
        if (found.isEmpty()) return Map.of("success", false, "message", "User not found in database.");

        User target = found.get();
        if ("admin".equalsIgnoreCase(target.getRole())) {
            long adminCount = userRepository.countByRole("admin");
            if (adminCount <= 1) {
                return Map.of("success", false, "message", "Cannot delete the only remaining Admin account in database!");
            }
        }

        userRepository.delete(target);
        return Map.of("success", true, "message", "User \"" + cleanUser + "\" deleted from database.");
    }

    public Map<String, Object> verifyAdminAccess(String inputKey) {
        String cleanKey = inputKey != null ? inputKey.trim() : "";
        if (cleanKey.isEmpty()) {
            return Map.of("success", false, "message", "Security key or password is required.");
        }

        if (apiSecret != null && !apiSecret.isEmpty() && apiSecret.equals(cleanKey)) {
            return Map.of("success", true);
        }

        String inputHash = hashPassword(cleanKey);
        List<User> users = userRepository.findAll();
        for (User u : users) {
            if ("admin".equalsIgnoreCase(u.getRole()) && inputHash.equals(u.getPasswordHash())) {
                return Map.of("success", true);
            }
        }

        return Map.of("success", false, "message", "Invalid security key or admin password!");
    }
}

