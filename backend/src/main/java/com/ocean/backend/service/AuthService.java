package com.ocean.backend.service;

import com.ocean.backend.dto.AuthResponse;
import com.ocean.backend.dto.ConnectionStatusResponse;
import com.ocean.backend.dto.GoogleLoginRequest;
import com.ocean.backend.dto.LoginRequest;
import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.RegisterRequest;
import com.ocean.backend.entity.AuthProvider;
import com.ocean.backend.entity.Role;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.UserRepository;
import com.ocean.backend.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    public MessageResponse register(RegisterRequest request) {
        // Kiểm tra trùng tên đăng nhập/email trước khi tạo user mới.
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setAuthProvider(AuthProvider.LOCAL);

        userRepository.save(user);
        return new MessageResponse("Đăng ký thành công");
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getUsername());
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.getToken());

        if (payload == null) {
            throw new IllegalArgumentException("Không đọc được thông tin từ Google token");
        }

        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google token không chứa email");
        }

        String name = (String) payload.get("name");
        String defaultUsername = buildDefaultUsername(email, name);

        User user = userRepository.findByEmail(email)
            .orElseGet(() -> createGoogleUser(email, defaultUsername));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getUsername());
    }

    public MessageResponse logout() {
        // JWT stateless nên logout ở server chỉ cần trả thông báo thành công.
        // Việc vô hiệu hóa token sẽ do frontend xử lý bằng cách xóa localStorage.
        return new MessageResponse("Đăng xuất thành công");
    }

    public ConnectionStatusResponse connectionStatus() {
        long totalUsers = userRepository.count();
        return new ConnectionStatusResponse("UP", "UP", totalUsers);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String googleToken) {
        try {
            if (googleClientId == null || googleClientId.isBlank()) {
                throw new IllegalArgumentException("Chưa cấu hình GOOGLE_CLIENT_ID ở backend");
            }

            GoogleIdTokenVerifier.Builder builder = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance()
            );

            // Bắt buộc verify audience bằng đúng Google Client ID.
            builder.setAudience(Collections.singletonList(googleClientId));

            GoogleIdTokenVerifier verifier = builder.build();
            GoogleIdToken idToken = verifier.verify(googleToken);
            if (idToken == null) {
                throw new IllegalArgumentException("Google token không hợp lệ");
            }
            return idToken.getPayload();
        } catch (GeneralSecurityException | java.io.IOException ex) {
            throw new IllegalArgumentException("Không thể xác minh Google token");
        }
    }

    private User createGoogleUser(String email, String defaultUsername) {
        String username = ensureUniqueUsername(defaultUsername);
        String generatedPassword = passwordEncoder.encode(UUID.randomUUID().toString());

        User newUser = new User();
        newUser.setUsername(username);
        newUser.setEmail(email);
        // Để tránh lỗi schema cũ còn ràng buộc NOT NULL, lưu mật khẩu ngẫu nhiên đã mã hóa.
        newUser.setPassword(generatedPassword);
        newUser.setRole(Role.USER);
        newUser.setAuthProvider(AuthProvider.GOOGLE);

        return userRepository.save(newUser);
    }

    private String buildDefaultUsername(String email, String name) {
        if (name != null && !name.isBlank()) {
            return name.trim().replaceAll("\\s+", "_").toLowerCase();
        }

        String[] parts = email.split("@");
        if (parts.length == 0 || parts[0].isBlank()) {
            return "google_user";
        }
        return parts[0].toLowerCase();
    }

    private String ensureUniqueUsername(String baseUsername) {
        String candidate = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = baseUsername + suffix;
            suffix++;
        }
        return candidate;
    }
}
