package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AdminUserResponse;
import com.ocean.backend.entity.Role;
import com.ocean.backend.entity.SubscriptionStatus;
import com.ocean.backend.entity.User;
import com.ocean.backend.entity.VipSubscription;
import com.ocean.backend.repository.UserRepository;
import com.ocean.backend.repository.VipSubscriptionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class VipManagementService {

    private final UserRepository userRepository;
    private final VipSubscriptionRepository vipSubscriptionRepository;

    public VipManagementService(UserRepository userRepository,
                                VipSubscriptionRepository vipSubscriptionRepository) {
        this.userRepository = userRepository;
        this.vipSubscriptionRepository = vipSubscriptionRepository;
    }

    @Transactional
    public VipSubscription upgradeVip(Long userId, int days) {
        if (days < 1) {
            throw new IllegalArgumentException("So ngay VIP phai >= 1");
        }

        User user = requireUser(userId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = user.getVipExpiryDate() != null && user.getVipExpiryDate().isAfter(now)
                ? user.getVipExpiryDate()
                : now;
        LocalDateTime endDate = startDate.plusDays(days);

        VipSubscription subscription = new VipSubscription();
        subscription.setUser(user);
        subscription.setStartDate(startDate);
        subscription.setEndDate(endDate);
        subscription.setStatus(SubscriptionStatus.ACTIVE);

        user.setRole(Role.VIP);
        user.setVipExpiryDate(endDate);
        userRepository.save(user);

        return vipSubscriptionRepository.save(subscription);
    }

    @Transactional
    public VipSubscription cancelVip(Long userId) {
        User user = requireUser(userId);
        LocalDateTime now = LocalDateTime.now();

        VipSubscription subscription = vipSubscriptionRepository
                .findTop1ByUserIdAndStatusOrderByEndDateDesc(userId, SubscriptionStatus.ACTIVE)
                .orElse(null);

        if (subscription != null) {
            subscription.setStatus(SubscriptionStatus.CANCELED);
            subscription.setEndDate(now);
        }

        user.setVipExpiryDate(null);
        if (user.getRole() == Role.VIP) {
            user.setRole(Role.USER);
        }
        userRepository.save(user);

        return subscription == null ? null : vipSubscriptionRepository.save(subscription);
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listVipUsers(Pageable pageable) {
        return userRepository.findActiveVipUsers(LocalDateTime.now(), pageable).map(this::toAdminUser);
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listVipUsers(String q, Pageable pageable) {
        return userRepository.searchActiveVipUsers(normalize(q), LocalDateTime.now(), pageable).map(this::toAdminUser);
    }

    @Transactional(readOnly = true)
    public boolean isVipActive(Long userId) {
        User user = requireUser(userId);
        return user.isVipActive();
    }

    private User requireUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay user voi id = " + id));
        if (user.getDeletedAt() != null) {
            throw new IllegalStateException("Tai khoan da bi xoa");
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
            return "";
        }
        return s.trim();
    }
}
