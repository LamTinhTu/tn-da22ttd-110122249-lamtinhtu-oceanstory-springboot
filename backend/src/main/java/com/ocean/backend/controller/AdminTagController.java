package com.ocean.backend.controller;

import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.admin.AdminTagResponse;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.dto.admin.UpsertTagRequest;
import com.ocean.backend.service.AdminTagService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/tags")
@PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
public class AdminTagController {

    private final AdminTagService adminTagService;
    private final AuditLogService auditLogService;

    public AdminTagController(AdminTagService adminTagService, AuditLogService auditLogService) {
        this.adminTagService = adminTagService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminTagResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean deleted
    ) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);
        Page<AdminTagResponse> p = adminTagService.search(q, active, deleted, pageable);
        return ResponseEntity.ok(new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()));
    }

    @PostMapping
    public ResponseEntity<AdminTagResponse> create(
            @Valid @RequestBody UpsertTagRequest request,
            Authentication authentication,
            HttpServletRequest http
    ) {
        AdminTagResponse created = adminTagService.create(request);
        auditLogService.log(authentication, "TAG_CREATE", "TAG", created.getId(),
                "{\"name\":\"" + escape(created.getName()) + "\"}", http);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminTagResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpsertTagRequest request,
            Authentication authentication,
            HttpServletRequest http
    ) {
        AdminTagResponse updated = adminTagService.update(id, request);
        auditLogService.log(authentication, "TAG_UPDATE", "TAG", id,
                "{\"name\":\"" + escape(updated.getName()) + "\"}", http);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest http
    ) {
        adminTagService.delete(id);
        auditLogService.log(authentication, "TAG_DELETE", "TAG", id, "{}", http);
        return ResponseEntity.ok(new MessageResponse("Đã xóa tag"));
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
