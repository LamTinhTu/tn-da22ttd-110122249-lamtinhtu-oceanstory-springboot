package com.ocean.backend.repository;

import com.ocean.backend.entity.SubscriptionStatus;
import com.ocean.backend.entity.VipSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VipSubscriptionRepository extends JpaRepository<VipSubscription, Long> {

    Page<VipSubscription> findByStatus(SubscriptionStatus status, Pageable pageable);

    Optional<VipSubscription> findTop1ByUserIdAndStatusOrderByEndDateDesc(Long userId, SubscriptionStatus status);

    long countByStatusAndEndDateAfter(SubscriptionStatus status, LocalDateTime now);
}
