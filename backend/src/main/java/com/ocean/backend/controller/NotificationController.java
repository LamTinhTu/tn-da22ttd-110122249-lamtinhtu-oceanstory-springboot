package com.ocean.backend.controller;

import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.dto.notification.NotificationResponse;
import com.ocean.backend.dto.notification.UnreadCountResponse;
import com.ocean.backend.dto.notification.UpdateReadStateRequest;
import com.ocean.backend.entity.Notification;
import com.ocean.backend.entity.NotificationType;
import com.ocean.backend.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** GET /api/notifications?type=SYSTEM&isRead=false&page=0&size=10 */
    @GetMapping
    public ResponseEntity<PageResponse<NotificationResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean isRead,
            Authentication authentication
    ) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);
        String username = authentication.getName();

        Page<Notification> p = notificationService.searchForUser(username, type, isRead, pageable);
        return ResponseEntity.ok(new PageResponse<>(
                p.getContent().stream().map(NotificationResponse::from).collect(Collectors.toList()),
                p.getNumber(),
                p.getSize(),
                p.getTotalElements(),
                p.getTotalPages()
        ));
    }

    /** GET /api/notifications/unread-count */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(username)));
    }

    /** GET /api/notifications/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> detail(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(NotificationResponse.from(notificationService.getDetailForUser(id, username)));
    }

    /** PUT /api/notifications/{id}/read-state  body: {"isRead": true|false} */
    @PutMapping("/{id}/read-state")
    public ResponseEntity<NotificationResponse> setReadState(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReadStateRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        Notification updated = notificationService.setReadState(id, username, Boolean.TRUE.equals(request.getIsRead()));
        return ResponseEntity.ok(NotificationResponse.from(updated));
    }
}
