package com.ocean.backend.controller;

import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.admin.AdminUserResponse;
import com.ocean.backend.dto.admin.LockUserRequest;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.dto.admin.ResetPasswordResponse;
import com.ocean.backend.dto.admin.UpdateUserRoleRequest;
import com.ocean.backend.dto.admin.VipExtendRequest;
import com.ocean.backend.entity.Role;
import com.ocean.backend.service.AdminUserService;
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
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final AuditLogService auditLogService;

    public AdminUserController(AdminUserService adminUserService, AuditLogService auditLogService) {
        this.adminUserService = adminUserService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "10") int size,
                                                               @RequestParam(required = false) String q,
                                                               @RequestParam(required = false) String role,
                                                               @RequestParam(required = false) Boolean locked,
                                                               @RequestParam(required = false) Boolean active) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize);

        Role roleEnum = null;
        if (role != null && !role.isBlank()) {
            try {
                roleEnum = Role.valueOf(role.trim().toUpperCase());
            } catch (Exception ignored) {
                throw new IllegalArgumentException("Role filter không hợp lệ");
            }
        }

        Page<AdminUserResponse> p = adminUserService.search(q, roleEnum, locked, active, pageable);
        return ResponseEntity.ok(new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserResponse> detail(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getDetail(id));
    }

    @PutMapping("/{id}/lock")
    public ResponseEntity<AdminUserResponse> lock(@PathVariable Long id,
                                                 @Valid @RequestBody LockUserRequest request,
                                                 Authentication authentication,
                                                 HttpServletRequest http) {
        AdminUserResponse res = adminUserService.lock(id, request.getReason());
        auditLogService.log(authentication, "USER_LOCK", "USER", id,
                "{\"reason\":\"" + escape(request.getReason()) + "\"}", http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/unlock")
    public ResponseEntity<AdminUserResponse> unlock(@PathVariable Long id,
                                                   Authentication authentication,
                                                   HttpServletRequest http) {
        AdminUserResponse res = adminUserService.unlock(id);
        auditLogService.log(authentication, "USER_UNLOCK", "USER", id, null, http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<AdminUserResponse> updateRole(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateUserRoleRequest request,
                                                        Authentication authentication,
                                                        HttpServletRequest http) {
        AdminUserResponse res = adminUserService.setRole(id, request.getRole());
        auditLogService.log(authentication, "USER_ROLE_SET", "USER", id,
                "{\"role\":\"" + escape(request.getRole()) + "\"}", http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(@PathVariable Long id,
                                                               Authentication authentication,
                                                               HttpServletRequest http) {
        String tempPassword = adminUserService.resetPassword(id);
        auditLogService.log(authentication, "USER_PASSWORD_RESET", "USER", id, null, http);
        return ResponseEntity.ok(new ResetPasswordResponse(tempPassword));
    }

    @PutMapping("/{id}/vip/extend")
    public ResponseEntity<AdminUserResponse> extendVip(@PathVariable Long id,
                                                       @Valid @RequestBody VipExtendRequest request,
                                                       Authentication authentication,
                                                       HttpServletRequest http) {
        AdminUserResponse res = adminUserService.extendVip(id, request.getDays());
        auditLogService.log(authentication, "VIP_EXTEND", "USER", id,
                "{\"days\":" + request.getDays() + "}", http);
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/vip/cancel")
    public ResponseEntity<AdminUserResponse> cancelVip(@PathVariable Long id,
                                                       Authentication authentication,
                                                       HttpServletRequest http) {
        AdminUserResponse res = adminUserService.cancelVip(id);
        auditLogService.log(authentication, "VIP_CANCEL", "USER", id, null, http);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id,
                                                  Authentication authentication,
                                                  HttpServletRequest http) {
        adminUserService.softDelete(id);
        auditLogService.log(authentication, "USER_DELETE", "USER", id, null, http);
        return ResponseEntity.ok(new MessageResponse("Đã xóa (soft delete) tài khoản"));
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
