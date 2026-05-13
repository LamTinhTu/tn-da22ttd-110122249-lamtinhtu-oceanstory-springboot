package com.ocean.backend.repository;

import com.ocean.backend.entity.Notification;
import com.ocean.backend.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    long countByUserUsernameAndIsReadFalse(String username);

        @Query("""
                        select n from Notification n
                        where n.user.username = :username
                            and (:type is null or n.type = :type)
                            and (:isRead is null or n.isRead = :isRead)
                        order by n.createdAt desc
                        """)
        Page<Notification> searchForUser(
                        @Param("username") String username,
                        @Param("type") NotificationType type,
                        @Param("isRead") Boolean isRead,
                        Pageable pageable
        );

        Optional<Notification> findByIdAndUserUsername(Long id, String username);
}
