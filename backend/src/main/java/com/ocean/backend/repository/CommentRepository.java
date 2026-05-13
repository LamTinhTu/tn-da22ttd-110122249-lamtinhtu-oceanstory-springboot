package com.ocean.backend.repository;

import com.ocean.backend.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    /**
     * Native SQL query to avoid Hibernate 6 + PostgreSQL parameter typing issues when using
     * `:q is null` together with string functions (lower/concat). We also allow searching across
     * comment content + user/story/chapter fields for admin/moderation use-cases.
     */
    @Query(
        value = """
            SELECT c.*
            FROM comments c
            LEFT JOIN users u ON u.id = c.user_id
            LEFT JOIN stories s ON s.id = c.story_id
            LEFT JOIN chapters ch ON ch.id = c.chapter_id
            WHERE c.deleted_at IS NULL
              AND (CAST(NULLIF(:q, '') AS varchar) IS NULL
                   OR lower(c.content)             LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(u.username,'')) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(u.email,''))    LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(s.title,''))    LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(ch.title,''))   LIKE lower(concat('%', CAST(:q AS varchar), '%')))
              AND (:storyId IS NULL OR c.story_id = :storyId)
              AND (:chapterId IS NULL OR c.chapter_id = :chapterId)
              AND (:hidden IS NULL OR c.is_hidden = :hidden)
              AND (:locked IS NULL OR c.is_locked = :locked)
            ORDER BY c.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*)
            FROM comments c
            LEFT JOIN users u ON u.id = c.user_id
            LEFT JOIN stories s ON s.id = c.story_id
            LEFT JOIN chapters ch ON ch.id = c.chapter_id
            WHERE c.deleted_at IS NULL
              AND (CAST(NULLIF(:q, '') AS varchar) IS NULL
                   OR lower(c.content)             LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(u.username,'')) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(u.email,''))    LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(s.title,''))    LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(coalesce(ch.title,''))   LIKE lower(concat('%', CAST(:q AS varchar), '%')))
              AND (:storyId IS NULL OR c.story_id = :storyId)
              AND (:chapterId IS NULL OR c.chapter_id = :chapterId)
              AND (:hidden IS NULL OR c.is_hidden = :hidden)
              AND (:locked IS NULL OR c.is_locked = :locked)
            """,
        nativeQuery = true
    )
    Page<Comment> adminSearch(
            @Param("q") String q,
            @Param("storyId") Long storyId,
            @Param("chapterId") Long chapterId,
            @Param("hidden") Boolean hidden,
            @Param("locked") Boolean locked,
            Pageable pageable
    );

    @Query("select c from Comment c where c.id = :id and c.deletedAt is null")
    Optional<Comment> findActiveById(@Param("id") Long id);

    @Query("select count(c) from Comment c where c.deletedAt is null")
    long countActive();

    @Query("select count(c) from Comment c where c.isHidden = true and c.deletedAt is null")
    long countHidden();

    @Query("select count(c) from Comment c where c.isLocked = true and c.deletedAt is null")
    long countLocked();

    @Modifying
    @Query("update Comment c set c.deletedAt = current_timestamp where c.id = :id and c.deletedAt is null")
    int softDelete(@Param("id") Long id);

    @Query("select c from Comment c where c.story.id = :storyId and c.deletedAt is null order by c.createdAt desc")
    Page<Comment> findByStoryId(@Param("storyId") Long storyId, Pageable pageable);

    @Query("select c from Comment c where c.chapter.id = :chapterId and c.deletedAt is null order by c.createdAt desc")
    Page<Comment> findByChapterId(@Param("chapterId") Long chapterId, Pageable pageable);
}
