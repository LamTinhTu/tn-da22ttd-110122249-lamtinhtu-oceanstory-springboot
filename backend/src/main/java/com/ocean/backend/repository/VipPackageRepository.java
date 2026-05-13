package com.ocean.backend.repository;

import com.ocean.backend.entity.VipPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VipPackageRepository extends JpaRepository<VipPackage, Long> {

    Page<VipPackage> findByIsActive(Boolean isActive, Pageable pageable);
}
