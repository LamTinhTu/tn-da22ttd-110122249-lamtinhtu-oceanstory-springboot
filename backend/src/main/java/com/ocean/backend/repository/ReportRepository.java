package com.ocean.backend.repository;

import com.ocean.backend.entity.Report;
import com.ocean.backend.entity.ReportStatus;
import com.ocean.backend.entity.ReportTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {

    @Query("""
        select r from Report r
        join fetch r.reporter
        left join fetch r.handledBy
        where (:status is null or r.status = :status)
          and (:targetType is null or r.targetType = :targetType)
          and (:q is null or lower(r.reason) like lower(concat('%', cast(:q as string), '%')))
        order by r.createdAt desc
        """)
    Page<Report> adminSearch(
            @Param("status") ReportStatus status,
            @Param("targetType") ReportTargetType targetType,
            @Param("q") String q,
            Pageable pageable);

    long countByStatus(ReportStatus status);
}
