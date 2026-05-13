package com.ocean.backend.controller;

import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.ReviewStoryRequest;
import com.ocean.backend.dto.admin.AdminStoryResponse;
import com.ocean.backend.dto.admin.AdminUpdateStoryRequest;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.entity.StoryModerationStatus;
import com.ocean.backend.entity.SubmissionStatus;
import com.ocean.backend.service.AdminStoryService;
import com.ocean.backend.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/stories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStoryController {

    private final AdminStoryService adminStoryService;
    private final AuditLogService auditLogService;

    public AdminStoryController(AdminStoryService adminStoryService, AuditLogService auditLogService) {
        this.adminStoryService = adminStoryService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminStoryResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "10") int size,
                                                                 @RequestParam(required = false) String q,
                                                                 @RequestParam(required = false) String submissionStatus,
                                                                 @RequestParam(required = false) String status,
                                                                 @RequestParam(required = false) String category,
                                                                 @RequestParam(required = false) String author,
                                                                 @RequestParam(required = false) Boolean hidden,
                                                                 @RequestParam(defaultValue = "false") boolean includeDeleted) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);

        SubmissionStatus sub = parseEnum(submissionStatus, SubmissionStatus.class);
        StoryModerationStatus st = parseEnum(status, StoryModerationStatus.class);

        Page<AdminStoryResponse> p = adminStoryService.search(q, sub, st, category, author, hidden, includeDeleted, pageable);
        return ResponseEntity.ok(new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminStoryResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(adminStoryService.getDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminStoryResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody AdminUpdateStoryRequest request,
                                                     Authentication authentication,
                                                     HttpServletRequest http) {
        AdminStoryResponse res = adminStoryService.update(id, request);
        auditLogService.log(authentication, "STORY_UPDATE", "STORY", id, null, http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/hide")
    public ResponseEntity<AdminStoryResponse> hide(@PathVariable Long id,
                                                   Authentication authentication,
                                                   HttpServletRequest http) {
        AdminStoryResponse res = adminStoryService.hide(id, true);
        auditLogService.log(authentication, "STORY_HIDE", "STORY", id, null, http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/unhide")
    public ResponseEntity<AdminStoryResponse> unhide(@PathVariable Long id,
                                                     Authentication authentication,
                                                     HttpServletRequest http) {
        AdminStoryResponse res = adminStoryService.hide(id, false);
        auditLogService.log(authentication, "STORY_UNHIDE", "STORY", id, null, http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<AdminStoryResponse> review(@PathVariable Long id,
                                                     @Valid @RequestBody ReviewStoryRequest request,
                                                     Authentication authentication,
                                                     HttpServletRequest http) {
        AdminStoryResponse res = adminStoryService.review(id, request, authentication);
        auditLogService.log(authentication, "STORY_REVIEW", "STORY", id,
                "{\"approvalStatus\":\"" + escape(request.getApprovalStatus()) + "\"}", http);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id,
                                                  Authentication authentication,
                                                  HttpServletRequest http) {
        adminStoryService.softDelete(id);
        auditLogService.log(authentication, "STORY_DELETE", "STORY", id, null, http);
        return ResponseEntity.ok(new MessageResponse("Đã xóa truyện (soft delete)"));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<AdminStoryResponse> restore(@PathVariable Long id,
                                                      Authentication authentication,
                                                      HttpServletRequest http) {
        AdminStoryResponse res = adminStoryService.restore(id);
        auditLogService.log(authentication, "STORY_RESTORE", "STORY", id, null, http);
        return ResponseEntity.ok(res);
    }

    private <T extends Enum<T>> T parseEnum(String raw, Class<T> type) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Filter không hợp lệ: " + raw);
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
