package com.ocean.backend.repository;

import com.ocean.backend.entity.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TagRepository extends JpaRepository<Tag, Long> {

    boolean existsByNameIgnoreCaseAndDeletedAtIsNull(String name);

    boolean existsBySlugIgnoreCaseAndDeletedAtIsNull(String slug);

    boolean existsByNameIgnoreCaseAndDeletedAtIsNullAndIdNot(String name, Long id);

    boolean existsBySlugIgnoreCaseAndDeletedAtIsNullAndIdNot(String slug, Long id);

    /**
     * Native query to avoid Hibernate 6 + PostgreSQL typing issues with nullable string params.
     */
    @Query(
        value = """
            SELECT * FROM tags t
            WHERE (:active IS NULL OR t.is_active = :active)
              AND (
                    :deleted IS NULL
                    OR (:deleted = true  AND t.deleted_at IS NOT NULL)
                    OR (:deleted = false AND t.deleted_at IS NULL)
                  )
              AND (
                    CAST(NULLIF(:q, '') AS varchar) IS NULL
                    OR lower(t.name) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                    OR lower(t.slug) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                  )
            ORDER BY t.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*) FROM tags t
            WHERE (:active IS NULL OR t.is_active = :active)
              AND (
                    :deleted IS NULL
                    OR (:deleted = true  AND t.deleted_at IS NOT NULL)
                    OR (:deleted = false AND t.deleted_at IS NULL)
                  )
              AND (
                    CAST(NULLIF(:q, '') AS varchar) IS NULL
                    OR lower(t.name) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                    OR lower(t.slug) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                  )
            """,
        nativeQuery = true
    )
    Page<Tag> adminSearch(
            @Param("q") String q,
            @Param("active") Boolean active,
            @Param("deleted") Boolean deleted,
            Pageable pageable
    );
}
