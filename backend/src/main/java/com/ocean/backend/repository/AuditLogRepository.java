package com.ocean.backend.repository;

import com.ocean.backend.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByActorUsernameOrderByCreatedAtDesc(String actorUsername, Pageable pageable);

    @Query("""
        select a from AuditLog a
        left join a.actor actor
        where (:action is null or a.action = :action)
          and (:actorId is null or actor.id = :actorId)
                    and (:actorUsername is null or lower(a.actorUsername) like lower(concat('%', :actorUsername, '%')))
          and (:fromTs is null or a.createdAt >= :fromTs)
          and (:toTs is null or a.createdAt < :toTs)
        order by a.createdAt desc
        """)
    Page<AuditLog> adminSearch(
        @Param("action") String action,
        @Param("actorId") Long actorId,
                @Param("actorUsername") String actorUsername,
        @Param("fromTs") LocalDateTime fromTs,
        @Param("toTs") LocalDateTime toTs,
        Pageable pageable);

    @Query("""
        select distinct a.action from AuditLog a
        where a.action is not null
        order by a.action
        """)
    List<String> listDistinctActions();
}
