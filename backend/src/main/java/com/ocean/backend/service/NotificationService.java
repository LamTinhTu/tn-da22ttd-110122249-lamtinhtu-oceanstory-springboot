package com.ocean.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocean.backend.entity.Notification;
import com.ocean.backend.entity.NotificationType;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.NotificationRepository;
import com.ocean.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void notifyUser(Long userId, NotificationType type, String title, String message, String metaJson) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getDeletedAt() != null) {
            return;
        }
        Notification n = new Notification();
        n.setUser(user);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setMeta(metaJson);
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public Page<Notification> listForUser(String username, Pageable pageable) {
        return notificationRepository.findByUserUsernameOrderByCreatedAtDesc(username, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Notification> searchForUser(String username, NotificationType type, Boolean isRead, Pageable pageable) {
        return notificationRepository.searchForUser(username, type, isRead, pageable);
    }

    @Transactional(readOnly = true)
    public long unreadCount(String username) {
        return notificationRepository.countByUserUsernameAndIsReadFalse(username);
    }

    @Transactional
    public void markRead(Long notificationId, String username) {
        setReadState(notificationId, username, true);
    }

    @Transactional(readOnly = true)
    public Notification getDetailForUser(Long notificationId, String username) {
        return notificationRepository.findByIdAndUserUsername(notificationId, username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy notification"));
    }

    @Transactional
    public Notification setReadState(Long notificationId, String username, boolean isRead) {
        Notification n = notificationRepository.findByIdAndUserUsername(notificationId, username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy notification"));
        n.setIsRead(isRead);
        n.setReadAt(isRead ? LocalDateTime.now() : null);
        return notificationRepository.save(n);
    }

    @Transactional
    public long sendSystemNotificationToAllActiveUsers(NotificationType type, String title, String message, Object meta) {
        NotificationType finalType = (type == null) ? NotificationType.SYSTEM : type;
        String metaJson = null;
        if (meta != null) {
            try {
                metaJson = objectMapper.writeValueAsString(meta);
            } catch (JsonProcessingException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Meta không phải JSON hợp lệ");
            }
        }

        List<Long> userIds = userRepository.findActiveUserIds();
        if (userIds.isEmpty()) {
            return 0;
        }

        final int chunkSize = 500;
        long created = 0;

        for (int i = 0; i < userIds.size(); i += chunkSize) {
            List<Long> chunk = userIds.subList(i, Math.min(userIds.size(), i + chunkSize));
            List<Notification> batch = new ArrayList<>(chunk.size());
            for (Long userId : chunk) {
                User userRef = userRepository.getReferenceById(userId);
                Notification n = new Notification();
                n.setUser(userRef);
                n.setType(finalType);
                n.setTitle(title);
                n.setMessage(message);
                n.setMeta(metaJson);
                batch.add(n);
            }
            notificationRepository.saveAll(batch);
            created += batch.size();
        }

        return created;
    }
}
