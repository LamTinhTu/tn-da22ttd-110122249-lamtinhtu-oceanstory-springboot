package com.ocean.backend.controller;

import com.ocean.backend.dto.admin.AdminReportResponse;
import com.ocean.backend.dto.admin.HandleReportRequest;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.service.AdminReportService;
import com.ocean.backend.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
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

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final AdminReportService adminReportService;
    private final AuditLogService auditLogService;

    public AdminReportController(AdminReportService adminReportService, AuditLogService auditLogService) {
        this.adminReportService = adminReportService;
        this.auditLogService = auditLogService;
    }

    /** GET /api/admin/reports?status=PENDING&targetType=STORY&q=&page=0&size=10 */
    @GetMapping
    public ResponseEntity<PageResponse<AdminReportResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String q) {

        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);
        Page<AdminReportResponse> p = adminReportService.list(status, targetType, q, pageable);
        return ResponseEntity.ok(new PageResponse<>(
                p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()
        ));
    }

    /** GET /api/admin/reports/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<AdminReportResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(adminReportService.getById(id));
    }

    /** PUT /api/admin/reports/{id}/handle  –  mark as RESOLVED or REJECTED */
    @PutMapping("/{id}/handle")
    public ResponseEntity<AdminReportResponse> handle(
            @PathVariable Long id,
            @Valid @RequestBody HandleReportRequest request,
            Authentication authentication,
            HttpServletRequest http) {

        AdminReportResponse result = adminReportService.handle(id, request.getResolution(), request.getHandledNote(), authentication);
        auditLogService.log(authentication, "REPORT_HANDLE", "REPORT", id,
                "{\"resolution\":\"" + escape(request.getResolution()) + "\",\"note\":\"" + escape(request.getHandledNote()) + "\"}",
                http);
        return ResponseEntity.ok(result);
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
