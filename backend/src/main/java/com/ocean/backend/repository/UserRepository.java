package com.ocean.backend.repository;

import com.ocean.backend.entity.User;
import com.ocean.backend.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

        @Query("""
                        select u.id from User u
                        where u.deletedAt is null
                            and u.isActive = true
                        """)
        List<Long> findActiveUserIds();

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    /**
     * Native SQL query to avoid Hibernate 6 + PostgreSQL bug where
     * `:q is null` causes the parameter to be bound as `bytea`,
     * making `lower(bytea)` fail with "function does not exist".
     * Using CAST(NULLIF(:q,'') AS varchar) makes the type explicit.
     */
    @Query(
        value = """
            SELECT * FROM users u
            WHERE u.deleted_at IS NULL
              AND (CAST(NULLIF(:q, '') AS varchar) IS NULL
                   OR lower(u.username) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(u.email)    LIKE lower(concat('%', CAST(:q AS varchar), '%')))
              AND (CAST(NULLIF(:role, '') AS varchar) IS NULL OR u.role = CAST(:role AS varchar))
              AND (:locked IS NULL OR u.is_locked = :locked)
              AND (:active IS NULL OR u.is_active = :active)
            ORDER BY u.created_at DESC
            """,
        countQuery = """
            SELECT COUNT(*) FROM users u
            WHERE u.deleted_at IS NULL
              AND (CAST(NULLIF(:q, '') AS varchar) IS NULL
                   OR lower(u.username) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(u.email)    LIKE lower(concat('%', CAST(:q AS varchar), '%')))
              AND (CAST(NULLIF(:role, '') AS varchar) IS NULL OR u.role = CAST(:role AS varchar))
              AND (:locked IS NULL OR u.is_locked = :locked)
              AND (:active IS NULL OR u.is_active = :active)
            """,
        nativeQuery = true
    )
    Page<User> adminSearch(
        @Param("q") String q,
        @Param("role") String role,
        @Param("locked") Boolean locked,
        @Param("active") Boolean active,
        Pageable pageable
    );

    long countByDeletedAtIsNull();

    long countByRoleAndDeletedAtIsNull(Role role);

    @Query("""
            select cast(u.createdAt as date), count(u)
            from User u
            where u.deletedAt is null
                and u.createdAt >= :from
            group by cast(u.createdAt as date)
            order by cast(u.createdAt as date)
            """)
    java.util.List<Object[]> countUserGrowthPerDay(java.time.LocalDateTime from);

    @Query("""
            select count(u) from User u
            where u.deletedAt is null
                and u.role = com.ocean.backend.entity.Role.VIP
                and u.vipExpiryDate is not null
                and u.vipExpiryDate > :now
            """)
    long countActiveVip(java.time.LocalDateTime now);

    @Query("""
            select u from User u
            where u.deletedAt is null
                and u.role = com.ocean.backend.entity.Role.VIP
                and u.vipExpiryDate is not null
                and u.vipExpiryDate > :now
            order by u.vipExpiryDate desc
            """)
    Page<User> findActiveVipUsers(@Param("now") java.time.LocalDateTime now, Pageable pageable);

    @Query(
        value = """
            SELECT * FROM users u
            WHERE u.deleted_at IS NULL
              AND u.role = 'VIP'
              AND u.vip_expiry_date IS NOT NULL
              AND u.vip_expiry_date > :now
              AND (CAST(NULLIF(:q, '') AS varchar) IS NULL
                   OR lower(u.username) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(u.email) LIKE lower(concat('%', CAST(:q AS varchar), '%')))
            ORDER BY u.vip_expiry_date DESC
            """,
        countQuery = """
            SELECT COUNT(*) FROM users u
            WHERE u.deleted_at IS NULL
              AND u.role = 'VIP'
              AND u.vip_expiry_date IS NOT NULL
              AND u.vip_expiry_date > :now
              AND (CAST(NULLIF(:q, '') AS varchar) IS NULL
                   OR lower(u.username) LIKE lower(concat('%', CAST(:q AS varchar), '%'))
                   OR lower(u.email) LIKE lower(concat('%', CAST(:q AS varchar), '%')))
            """,
        nativeQuery = true
    )
    Page<User> searchActiveVipUsers(@Param("q") String q,
                                    @Param("now") java.time.LocalDateTime now,
                                    Pageable pageable);
}
