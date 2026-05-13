package com.ocean.backend.repository;

import com.ocean.backend.entity.ModerationAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ModerationActionRepository extends JpaRepository<ModerationAction, Long> {

    Page<ModerationAction> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId, Pageable pageable);

    @EntityGraph(attributePaths = {"moderator"})
    @Query("""
        select m from ModerationAction m
        left join m.moderator moderator
        where (:action is null or m.action = :action)
          and (:moderatorId is null or moderator.id = :moderatorId)
          and (:moderatorUsername is null or lower(moderator.username) like lower(concat('%', :moderatorUsername, '%')))
          and (:fromTs is null or m.createdAt >= :fromTs)
          and (:toTs is null or m.createdAt < :toTs)
        order by m.createdAt desc
        """)
    Page<ModerationAction> adminSearch(
        @Param("action") String action,
        @Param("moderatorId") Long moderatorId,
        @Param("moderatorUsername") String moderatorUsername,
        @Param("fromTs") LocalDateTime fromTs,
        @Param("toTs") LocalDateTime toTs,
        Pageable pageable);

    @Query("""
        select distinct m.action from ModerationAction m
        where m.action is not null
        order by m.action
        """)
    List<String> listDistinctActions();

    @EntityGraph(attributePaths = {"moderator"})
    @Query("select m from ModerationAction m left join m.moderator where m.id = :id")
    Optional<ModerationAction> findWithModeratorById(@Param("id") Long id);
}
