package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AdminUserResponse;
import com.ocean.backend.entity.Role;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    public AdminUserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> search(String q, Role role, Boolean locked, Boolean active, Pageable pageable) {
        String roleStr = (role == null) ? null : role.name();
        return userRepository.adminSearch(normalize(q), roleStr, locked, active, pageable).map(this::toAdminUser);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user với id = " + id));
        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("Tài khoản đã bị xóa");
        }
        return toAdminUser(user);
    }

    @Transactional
    public AdminUserResponse lock(Long id, String reason) {
        User user = requireUser(id);
        user.setIsLocked(true);
        user.setLockReason(reason);
        return toAdminUser(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse unlock(Long id) {
        User user = requireUser(id);
        user.setIsLocked(false);
        user.setLockReason(null);
        return toAdminUser(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse setRole(Long id, String roleRaw) {
        User user = requireUser(id);
        Role role;
        try {
            role = Role.valueOf(String.valueOf(roleRaw).trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Role không hợp lệ");
        }
        user.setRole(role);
        return toAdminUser(userRepository.save(user));
    }

    @Transactional
    public String resetPassword(Long id) {
        User user = requireUser(id);
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
        return tempPassword;
    }

    @Transactional
    public void softDelete(Long id) {
        User user = requireUser(id);
        user.setDeletedAt(LocalDateTime.now());
        user.setIsActive(false);
        user.setIsLocked(true);
        userRepository.save(user);
    }

    @Transactional
    public AdminUserResponse extendVip(Long id, int days) {
        if (days < 1) {
            throw new IllegalArgumentException("Số ngày gia hạn phải >= 1");
        }
        User user = requireUser(id);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime base = user.getVipExpiryDate() != null && user.getVipExpiryDate().isAfter(now)
                ? user.getVipExpiryDate()
                : now;
        user.setVipExpiryDate(base.plusDays(days));
        user.setRole(Role.VIP);
        return toAdminUser(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse cancelVip(Long id) {
        User user = requireUser(id);
        user.setVipExpiryDate(null);
        if (user.getRole() == Role.VIP) {
            user.setRole(Role.USER);
        }
        return toAdminUser(userRepository.save(user));
    }

    private User requireUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user với id = " + id));
        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("Tài khoản đã bị xóa");
        }
        return user;
    }

    private AdminUserResponse toAdminUser(User user) {
        AdminUserResponse dto = new AdminUserResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() == null ? null : user.getRole().name());
        dto.setIsLocked(user.getIsLocked());
        dto.setIsActive(user.getIsActive());
        dto.setVipExpiryDate(user.getVipExpiryDate());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setLastLoginAt(user.getLastLoginAt());
        return dto;
    }

    private String normalize(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String generateTempPassword() {
        // 12 chars: upper/lower/digits
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        sb.append("!");
        return sb.toString();
    }
}
