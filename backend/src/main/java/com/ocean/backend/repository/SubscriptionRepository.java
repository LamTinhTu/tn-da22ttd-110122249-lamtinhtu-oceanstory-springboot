package com.ocean.backend.repository;

import com.ocean.backend.entity.Subscription;
import com.ocean.backend.entity.SubscriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    Page<Subscription> findByStatus(SubscriptionStatus status, Pageable pageable);

    Optional<Subscription> findTop1ByUserIdAndStatusOrderByEndAtDesc(Long userId, SubscriptionStatus status);

    long countByStatusAndEndAtAfter(SubscriptionStatus status, LocalDateTime now);
}
