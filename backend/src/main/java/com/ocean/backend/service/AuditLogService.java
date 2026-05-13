package com.ocean.backend.service;

import com.ocean.backend.entity.AuditLog;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.AuditLogRepository;
import com.ocean.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void log(Authentication authentication,
                    String action,
                    String entityType,
                    Long entityId,
                    String detailJson,
                    HttpServletRequest request) {
        AuditLog log = new AuditLog();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            log.setActorUsername(username);
            log.setActorRole(authentication.getAuthorities() == null || authentication.getAuthorities().isEmpty()
                    ? null
                    : authentication.getAuthorities().iterator().next().getAuthority());

            User actor = userRepository.findByUsername(username).orElse(null);
            log.setActor(actor);
        }
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDetail(detailJson);
        if (request != null) {
            log.setIpAddress(extractIp(request));
        }
        auditLogRepository.save(log);
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
