package com.ocean.backend.config;

import com.ocean.backend.entity.AuthProvider;
import com.ocean.backend.entity.Role;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        // Tạo account kiểm duyệt nếu chưa tồn tại
        createModeratorAccount();
    }

    private void createModeratorAccount() {
        String username = "kiemduyet";
        String email = "kiemduyet@ocean.local";
        String rawPassword = "Kiemduyet@12345678";

        // Kiểm tra xem account kiểm duyệt đã tồn tại chưa
        var existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent()) {
            User moderator = existingUser.get();
            moderator.setEmail(email);
            moderator.setPassword(passwordEncoder.encode(rawPassword));
            moderator.setRole(Role.MODERATOR);
            moderator.setAuthProvider(AuthProvider.LOCAL);

            userRepository.save(moderator);
            System.out.println("✅ Tài khoản kiểm duyệt đã được cập nhật:");
            System.out.println("   Username: " + username);
            System.out.println("   Email: " + email);
            System.out.println("   Role: MODERATOR");
            System.out.println("   Password: [updated]");
            return;
        }

        // Tạo moderator user mới
        User moderator = new User();
        moderator.setUsername(username);
        moderator.setEmail(email);
        moderator.setPassword(passwordEncoder.encode(rawPassword)); // Hash password
        moderator.setRole(Role.MODERATOR);
        moderator.setAuthProvider(AuthProvider.LOCAL);

        userRepository.save(moderator);
        System.out.println("✅ Tài khoản kiểm duyệt mới được tạo:");
        System.out.println("   Username: " + username);
        System.out.println("   Email: " + email);
        System.out.println("   Role: MODERATOR");
        System.out.println("   Password: [hashed]");
    }
}
