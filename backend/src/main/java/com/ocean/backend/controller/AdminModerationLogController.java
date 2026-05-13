package com.ocean.backend.controller;

import com.ocean.backend.dto.admin.AuditLogResponse;
import com.ocean.backend.dto.admin.ModerationActionResponse;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.service.AdminModerationLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/moderation-logs")
@PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
public class AdminModerationLogController {

    private final AdminModerationLogService adminModerationLogService;

    public AdminModerationLogController(AdminModerationLogService adminModerationLogService) {
        this.adminModerationLogService = adminModerationLogService;
    }

    /** GET /api/admin/moderation-logs/audit-logs?action=&admin=&fromDate=2026-05-01&toDate=2026-05-12&page=0&size=20 */
    @GetMapping("/audit-logs")
    public ResponseEntity<PageResponse<AuditLogResponse>> listAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String admin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);

        Page<AuditLogResponse> p = adminModerationLogService.searchAuditLogs(action, admin, fromDate, toDate, pageable);
        return ResponseEntity.ok(new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()));
    }

    /** GET /api/admin/moderation-logs/audit-logs/{id} */
    @GetMapping("/audit-logs/{id}")
    public ResponseEntity<AuditLogResponse> auditDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminModerationLogService.getAuditLog(id));
    }

    /** GET /api/admin/moderation-logs/moderation-actions?action=&admin=&fromDate=2026-05-01&toDate=2026-05-12&page=0&size=20 */
    @GetMapping("/moderation-actions")
    public ResponseEntity<PageResponse<ModerationActionResponse>> listModerationActions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String admin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);

        Page<ModerationActionResponse> p = adminModerationLogService.searchModerationActions(action, admin, fromDate, toDate, pageable);
        return ResponseEntity.ok(new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()));
    }

    /** GET /api/admin/moderation-logs/moderation-actions/{id} */
    @GetMapping("/moderation-actions/{id}")
    public ResponseEntity<ModerationActionResponse> moderationDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminModerationLogService.getModerationAction(id));
    }
}
