package com.ocean.backend.controller;

import com.ocean.backend.dto.AuthResponse;
import com.ocean.backend.dto.ConnectionStatusResponse;
import com.ocean.backend.dto.GoogleLoginRequest;
import com.ocean.backend.dto.LoginRequest;
import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.RegisterRequest;
import com.ocean.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        MessageResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout() {
        MessageResponse response = authService.logout();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/connection-status")
    public ResponseEntity<ConnectionStatusResponse> connectionStatus() {
        ConnectionStatusResponse response = authService.connectionStatus();
        return ResponseEntity.ok(response);
    }
}
