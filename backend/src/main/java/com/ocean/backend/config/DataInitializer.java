package com.ocean.backend.config;

import com.ocean.backend.entity.AuthProvider;
import com.ocean.backend.entity.Role;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(prefix = "app.bootstrap", name = "enabled", havingValue = "true")
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.reset-password:false}")
    private boolean resetPasswordOnStartup;

    @Value("${app.bootstrap.admin.username:}")
    private String adminUsername;

    @Value("${app.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap.moderator.username:}")
    private String moderatorUsername;

    @Value("${app.bootstrap.moderator.email:}")
    private String moderatorEmail;

    @Value("${app.bootstrap.moderator.password:}")
    private String moderatorPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        bootstrapUser(adminUsername, adminEmail, adminPassword, Role.ADMIN);
        bootstrapUser(moderatorUsername, moderatorEmail, moderatorPassword, Role.MODERATOR);
    }

    private void bootstrapUser(String username, String email, String rawPassword, Role role) {
        String safeUsername = username == null ? "" : username.trim();
        if (safeUsername.isEmpty()) {
            log.info("Bootstrap user skipped: missing username for role {}", role);
            return;
        }

        String safeEmail = email == null ? "" : email.trim();
        String safePassword = rawPassword == null ? "" : rawPassword.trim();

        User user = userRepository.findByUsername(safeUsername).orElseGet(User::new);
        boolean isNew = user.getId() == null;

        user.setUsername(safeUsername);
        if (!safeEmail.isEmpty()) {
            user.setEmail(safeEmail);
        }
        user.setRole(role);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setIsActive(true);
        user.setIsLocked(false);
        user.setDeletedAt(null);

        if (isNew) {
            if (safePassword.isEmpty()) {
                log.warn("Bootstrap user '{}' not created: missing password (set BOOTSTRAP_*_PASSWORD)", safeUsername);
                return;
            }
            user.setPassword(passwordEncoder.encode(safePassword));
            userRepository.save(user);
            log.info("Bootstrap user created: username='{}', role={}", safeUsername, role);
            return;
        }

        if (resetPasswordOnStartup) {
            if (safePassword.isEmpty()) {
                log.warn("Bootstrap user '{}' password not reset: missing password", safeUsername);
            } else {
                user.setPassword(passwordEncoder.encode(safePassword));
            }
        }

        userRepository.save(user);
        log.info("Bootstrap user updated: username='{}', role={}", safeUsername, role);
    }
}
