package com.ocean.backend.controller;

import com.ocean.backend.dto.admin.AdminCommentResponse;
import com.ocean.backend.dto.admin.CommentActionRequest;
import com.ocean.backend.dto.admin.PageResponse;
import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.service.AdminCommentService;
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
@RequestMapping("/api/admin/comments")
@PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
public class AdminCommentController {

    private final AdminCommentService adminCommentService;
    private final AuditLogService auditLogService;

    public AdminCommentController(AdminCommentService adminCommentService, AuditLogService auditLogService) {
        this.adminCommentService = adminCommentService;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminCommentResponse>> list(@RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "10") int size,
                                                                   @RequestParam(required = false) String q,
                                                                   @RequestParam(required = false) Long storyId,
                                                                   @RequestParam(required = false) Long chapterId,
                                                                   @RequestParam(required = false) Boolean hidden,
                                                                   @RequestParam(required = false) Boolean locked) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(page, safeSize);
        Page<AdminCommentResponse> result = adminCommentService.search(q, storyId, chapterId, hidden, locked, pageable);
        return ResponseEntity.ok(new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminCommentResponse> getDetail(@PathVariable Long id) {
        AdminCommentResponse comment = adminCommentService.getDetail(id);
        return ResponseEntity.ok(comment);
    }

    @PutMapping("/{id}/hide")
    public ResponseEntity<AdminCommentResponse> hideComment(@PathVariable Long id,
                                                           @Valid @RequestBody CommentActionRequest request,
                                                           HttpServletRequest httpRequest,
                                                           Authentication authentication) {
        AdminCommentResponse comment = adminCommentService.hideComment(id, request);
        auditLogService.log(authentication, "HIDE_COMMENT", "COMMENT", id, 
                                "{\"reason\":\"" + request.getReason() + "\"}", httpRequest);
        return ResponseEntity.ok(comment);
    }

    @PutMapping("/{id}/unhide")
    public ResponseEntity<AdminCommentResponse> unhideComment(@PathVariable Long id,
                                                             HttpServletRequest httpRequest,
                                                             Authentication authentication) {
        AdminCommentResponse comment = adminCommentService.unhideComment(id);
        auditLogService.log(authentication, "UNHIDE_COMMENT", "COMMENT", id, 
                                "{}", httpRequest);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteComment(@PathVariable Long id,
                                                        HttpServletRequest httpRequest,
                                                        Authentication authentication) {
        adminCommentService.deleteComment(id);
        auditLogService.log(authentication, "DELETE_COMMENT", "COMMENT", id, 
                                "{}", httpRequest);
        return ResponseEntity.ok(new MessageResponse("Xóa bình luận thành công"));
    }

    @GetMapping("/story/{storyId}")
    public ResponseEntity<PageResponse<AdminCommentResponse>> getCommentsByStory(@PathVariable Long storyId,
                                                                               @RequestParam(defaultValue = "0") int page,
                                                                               @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(page, safeSize);
        Page<AdminCommentResponse> result = adminCommentService.getCommentsByStory(storyId, pageable);
        return ResponseEntity.ok(new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages()));
    }

    @GetMapping("/chapter/{chapterId}")
    public ResponseEntity<PageResponse<AdminCommentResponse>> getCommentsByChapter(@PathVariable Long chapterId,
                                                                                  @RequestParam(defaultValue = "0") int page,
                                                                                  @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(page, safeSize);
        Page<AdminCommentResponse> result = adminCommentService.getCommentsByChapter(chapterId, pageable);
        return ResponseEntity.ok(new PageResponse<>(result.getContent(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages()));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminCommentService.CommentStats> getStats() {
        AdminCommentService.CommentStats stats = adminCommentService.getStats();
        return ResponseEntity.ok(stats);
    }
}
