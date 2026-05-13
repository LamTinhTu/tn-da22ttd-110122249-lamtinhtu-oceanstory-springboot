package com.ocean.backend.repository;

import com.ocean.backend.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Page<Payment> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
