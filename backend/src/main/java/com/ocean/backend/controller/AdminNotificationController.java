package com.ocean.backend.controller;

import com.ocean.backend.dto.notification.SendSystemNotificationRequest;
import com.ocean.backend.dto.notification.SendSystemNotificationResponse;
import com.ocean.backend.service.AuditLogService;
import com.ocean.backend.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AdminNotificationController(NotificationService notificationService, AuditLogService auditLogService) {
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    /** POST /api/admin/notifications/system  – broadcast to all active users (DB: notifications) */
    @PostMapping("/system")
    public ResponseEntity<SendSystemNotificationResponse> sendSystem(
            @Valid @RequestBody SendSystemNotificationRequest request,
            Authentication authentication,
            HttpServletRequest http
    ) {
        long created = notificationService.sendSystemNotificationToAllActiveUsers(
                request.getType(),
                request.getTitle(),
                request.getMessage(),
                request.getMeta()
        );
        auditLogService.log(authentication, "NOTIFICATION_SYSTEM_SEND", "NOTIFICATION", null,
                "{\"type\":\"" + String.valueOf(request.getType()) + "\",\"created\":" + created + "}", http);
        return ResponseEntity.ok(new SendSystemNotificationResponse(created));
    }
}
