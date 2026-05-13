package com.ocean.backend.repository;

import com.ocean.backend.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCaseAndDeletedAtIsNull(String name);

    boolean existsBySlugIgnoreCaseAndDeletedAtIsNull(String slug);

    boolean existsByNameIgnoreCaseAndDeletedAtIsNullAndIdNot(String name, Long id);

    boolean existsBySlugIgnoreCaseAndDeletedAtIsNullAndIdNot(String slug, Long id);

    /**
     * Native query to avoid Hibernate 6 + PostgreSQL typing issues with nullable string params.
     * Filters:
     * - q: search by name/slug
     * - active: is_active
     * - deleted: true => only deleted, false => only not deleted
     */
    @Query(
        value = """
            SELECT * FROM categories c
            WHERE (:active IS NULL OR c.is_active = :active)
              AND (
                    :deleted IS NULL
                    OR (:deleted = true  AND c.deleted_at IS NOT NULL)
                    OR (:deleted = false AND c.deleted_at IS NULL)
                  )
              AND (
                    CAST(NULLIF(:q, '') AS varchar) IS NULL
                    OR lower(c.name) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                    OR lower(c.slug) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                  )
            ORDER BY c.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*) FROM categories c
            WHERE (:active IS NULL OR c.is_active = :active)
              AND (
                    :deleted IS NULL
                    OR (:deleted = true  AND c.deleted_at IS NOT NULL)
                    OR (:deleted = false AND c.deleted_at IS NULL)
                  )
              AND (
                    CAST(NULLIF(:q, '') AS varchar) IS NULL
                    OR lower(c.name) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                    OR lower(c.slug) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                  )
            """,
        nativeQuery = true
    )
    Page<Category> adminSearch(
            @Param("q") String q,
            @Param("active") Boolean active,
            @Param("deleted") Boolean deleted,
            Pageable pageable
    );
}
