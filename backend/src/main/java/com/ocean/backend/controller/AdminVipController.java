package com.ocean.backend.controller;

import com.ocean.backend.dto.admin.AdminUserResponse;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.dto.admin.VipExtendRequest;
import com.ocean.backend.service.AdminUserService;
import com.ocean.backend.service.AuditLogService;
import com.ocean.backend.service.VipManagementService;
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
@RequestMapping("/api/admin/vip")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVipController {

    private final VipManagementService vipManagementService;
    private final AdminUserService adminUserService;
    private final AuditLogService auditLogService;

    public AdminVipController(VipManagementService vipManagementService,
                              AdminUserService adminUserService,
                              AuditLogService auditLogService) {
        this.vipManagementService = vipManagementService;
        this.adminUserService = adminUserService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<AdminUserResponse>> listVipUsers(@RequestParam(defaultValue = "0") int page,
                                                                        @RequestParam(defaultValue = "10") int size,
                                                                        @RequestParam(required = false) String q) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);
        Page<AdminUserResponse> p = vipManagementService.listVipUsers(q, pageable);
        return ResponseEntity.ok(new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()));
    }

    @PutMapping("/{userId}/upgrade")
    public ResponseEntity<AdminUserResponse> upgradeVip(@PathVariable Long userId,
                                                        @Valid @RequestBody VipExtendRequest request,
                                                        Authentication authentication,
                                                        HttpServletRequest http) {
        vipManagementService.upgradeVip(userId, request.getDays());
        auditLogService.log(authentication, "VIP_UPGRADE", "USER", userId,
                "{\"days\":" + request.getDays() + "}", http);
        return ResponseEntity.ok(adminUserService.getDetail(userId));
    }

    @PutMapping("/{userId}/cancel")
    public ResponseEntity<AdminUserResponse> cancelVip(@PathVariable Long userId,
                                                       Authentication authentication,
                                                       HttpServletRequest http) {
        vipManagementService.cancelVip(userId);
        auditLogService.log(authentication, "VIP_CANCEL", "USER", userId, null, http);
        return ResponseEntity.ok(adminUserService.getDetail(userId));
    }
}
