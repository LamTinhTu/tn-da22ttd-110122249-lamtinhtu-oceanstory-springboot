package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AdminCommentResponse;
import com.ocean.backend.dto.admin.CommentActionRequest;
import com.ocean.backend.entity.Comment;
import com.ocean.backend.repository.CommentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AdminCommentService {

    private final CommentRepository commentRepository;

    public AdminCommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminCommentResponse> search(String q, Long storyId, Long chapterId, Boolean hidden, Boolean locked, Pageable pageable) {
        return commentRepository.adminSearch(normalize(q), storyId, chapterId, hidden, locked, pageable)
                .map(this::toAdminComment);
    }

    @Transactional(readOnly = true)
    public AdminCommentResponse getDetail(Long id) {
        Comment comment = commentRepository.findActiveById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận với id = " + id));
        return toAdminComment(comment);
    }

    @Transactional
    public AdminCommentResponse hideComment(Long id, CommentActionRequest request) {
        Comment comment = requireComment(id);
        comment.setIsHidden(true);
        comment.setIsLocked(true);
        comment.setLockReason(request.getReason());
        return toAdminComment(commentRepository.save(comment));
    }

    @Transactional
    public AdminCommentResponse unhideComment(Long id) {
        Comment comment = requireComment(id);
        comment.setIsHidden(false);
        comment.setIsLocked(false);
        comment.setLockReason(null);
        return toAdminComment(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long id) {
        Comment comment = requireComment(id);
        int updated = commentRepository.softDelete(id);
        if (updated == 0) {
            throw new IllegalStateException("Không thể xóa bình luận với id = " + id);
        }
    }

    @Transactional(readOnly = true)
    public Page<AdminCommentResponse> getCommentsByStory(Long storyId, Pageable pageable) {
        return commentRepository.findByStoryId(storyId, pageable)
                .map(this::toAdminComment);
    }

    @Transactional(readOnly = true)
    public Page<AdminCommentResponse> getCommentsByChapter(Long chapterId, Pageable pageable) {
        return commentRepository.findByChapterId(chapterId, pageable)
                .map(this::toAdminComment);
    }

    @Transactional(readOnly = true)
    public CommentStats getStats() {
        CommentStats stats = new CommentStats();
        stats.setTotal(commentRepository.countActive());
        stats.setHidden(commentRepository.countHidden());
        stats.setLocked(commentRepository.countLocked());
        return stats;
    }

    private Comment requireComment(Long id) {
        return commentRepository.findActiveById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bình luận với id = " + id));
    }

    private String normalize(String q) {
        return (q == null || q.trim().isEmpty()) ? null : q.trim();
    }

    private AdminCommentResponse toAdminComment(Comment comment) {
        AdminCommentResponse response = new AdminCommentResponse();
        response.setId(comment.getId());
        response.setContent(comment.getContent());
        response.setIsHidden(comment.getIsHidden());
        response.setIsLocked(comment.getIsLocked());
        response.setLockReason(comment.getLockReason());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());

        if (comment.getUser() != null) {
            response.setUser(toAdminUser(comment.getUser()));
        }

        if (comment.getStory() != null) {
            response.setStory(toAdminStory(comment.getStory()));
        }

        if (comment.getChapter() != null) {
            response.setChapter(toChapterResponse(comment.getChapter()));
        }

        return response;
    }

    private com.ocean.backend.dto.admin.AdminUserResponse toAdminUser(com.ocean.backend.entity.User user) {
        com.ocean.backend.dto.admin.AdminUserResponse response = new com.ocean.backend.dto.admin.AdminUserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().name());
        response.setVipExpiryDate(user.getVipExpiryDate());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }

    private com.ocean.backend.dto.admin.AdminStoryResponse toAdminStory(com.ocean.backend.entity.Story story) {
        com.ocean.backend.dto.admin.AdminStoryResponse response = new com.ocean.backend.dto.admin.AdminStoryResponse();
        response.setId(story.getId());
        response.setTitle(story.getTitle());
        response.setAuthorName(story.getAuthorName());
        response.setCreatedAt(story.getCreatedAt());
        response.setUpdatedAt(story.getUpdatedAt());
        return response;
    }

    private com.ocean.backend.dto.ChapterResponse toChapterResponse(com.ocean.backend.entity.Chapter chapter) {
        com.ocean.backend.dto.ChapterResponse response = new com.ocean.backend.dto.ChapterResponse();
        response.setId(chapter.getId());
        response.setTitle(chapter.getTitle());
        response.setContent(chapter.getContent());
        response.setChapterNumber(chapter.getChapterNumber());
        response.setImageUrl(chapter.getImageUrl());
        response.setCreatedAt(chapter.getCreatedAt());
        response.setModerationStatus(chapter.getModerationStatus());
        response.setViews(chapter.getViews());
        return response;
    }

    public static class CommentStats {
        private long total;
        private long hidden;
        private long locked;

        public long getTotal() {
            return total;
        }

        public void setTotal(long total) {
            this.total = total;
        }

        public long getHidden() {
            return hidden;
        }

        public void setHidden(long hidden) {
            this.hidden = hidden;
        }

        public long getLocked() {
            return locked;
        }

        public void setLocked(long locked) {
            this.locked = locked;
        }
    }
}
