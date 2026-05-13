package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AuditLogResponse;
import com.ocean.backend.dto.admin.ModerationActionResponse;
import com.ocean.backend.entity.AuditLog;
import com.ocean.backend.entity.ModerationAction;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.AuditLogRepository;
import com.ocean.backend.repository.ModerationActionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AdminModerationLogService {

    private final AuditLogRepository auditLogRepository;
    private final ModerationActionRepository moderationActionRepository;

    public AdminModerationLogService(AuditLogRepository auditLogRepository,
                                     ModerationActionRepository moderationActionRepository) {
        this.auditLogRepository = auditLogRepository;
        this.moderationActionRepository = moderationActionRepository;
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> searchAuditLogs(String action,
                                                  String admin,
                                                  LocalDate fromDate,
                                                  LocalDate toDate,
                                                  Pageable pageable) {
        String normalizedAction = normalizeEquals(action);
        AdminFilter adminFilter = parseAdmin(admin);
        LocalDateTime fromTs = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toTs = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;

        return auditLogRepository
            .adminSearch(normalizedAction, adminFilter.id(), adminFilter.usernameLike(), fromTs, toTs, pageable)
            .map(this::toAuditDto);
    }

    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLog(Long id) {
        AuditLog log = auditLogRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy audit log"));
        return toAuditDto(log);
    }

    @Transactional(readOnly = true)
    public Page<ModerationActionResponse> searchModerationActions(String action,
                                                                  String admin,
                                                                  LocalDate fromDate,
                                                                  LocalDate toDate,
                                                                  Pageable pageable) {
        String normalizedAction = normalizeEquals(action);
        AdminFilter adminFilter = parseAdmin(admin);
        LocalDateTime fromTs = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime toTs = toDate != null ? toDate.plusDays(1).atStartOfDay() : null;

        return moderationActionRepository
            .adminSearch(normalizedAction, adminFilter.id(), adminFilter.usernameLike(), fromTs, toTs, pageable)
            .map(this::toModerationDto);
    }

    @Transactional(readOnly = true)
    public ModerationActionResponse getModerationAction(Long id) {
        Optional<ModerationAction> found = moderationActionRepository.findWithModeratorById(id);
        ModerationAction action = found.orElseThrow(() -> new IllegalArgumentException("Không tìm thấy moderation action"));
        return toModerationDto(action);
    }

    private AuditLogResponse toAuditDto(AuditLog a) {
        Long actorId = null;
        User actor = a.getActor();
        if (actor != null) {
            actorId = actor.getId();
        }
        return new AuditLogResponse(
            a.getId(),
            actorId,
            a.getActorUsername(),
            a.getActorRole(),
            a.getAction(),
            a.getEntityType(),
            a.getEntityId(),
            a.getDetail(),
            a.getIpAddress(),
            a.getCreatedAt()
        );
    }

    private ModerationActionResponse toModerationDto(ModerationAction m) {
        Long moderatorId = null;
        String moderatorUsername = null;
        User moderator = m.getModerator();
        if (moderator != null) {
            moderatorId = moderator.getId();
            moderatorUsername = moderator.getUsername();
        }

        return new ModerationActionResponse(
            m.getId(),
            m.getTargetType(),
            m.getTargetId(),
            m.getFromStatus(),
            m.getToStatus(),
            m.getAction(),
            m.getReason(),
            moderatorId,
            moderatorUsername,
            m.getCreatedAt()
        );
    }

    private String normalizeEquals(String value) {
        String s = String.valueOf(value == null ? "" : value).trim();
        return s.isBlank() ? null : s;
    }

    private AdminFilter parseAdmin(String admin) {
        String raw = String.valueOf(admin == null ? "" : admin).trim();
        if (raw.isBlank()) return new AdminFilter(null, null);

        Long id = null;
        try {
            id = Long.parseLong(raw);
        } catch (NumberFormatException ignored) {
        }

        if (id != null) {
            return new AdminFilter(id, null);
        }

        // username contains filter (case-insensitive)
        return new AdminFilter(null, raw);
    }

    private record AdminFilter(Long id, String usernameLike) {
    }
}
