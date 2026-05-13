package com.ocean.backend.service;

import com.ocean.backend.dto.ReviewStoryRequest;
import com.ocean.backend.dto.admin.AdminStoryResponse;
import com.ocean.backend.dto.admin.AdminUpdateStoryRequest;
import com.ocean.backend.entity.NotificationType;
import com.ocean.backend.entity.Story;
import com.ocean.backend.entity.StoryModerationStatus;
import com.ocean.backend.entity.SubmissionStatus;
import com.ocean.backend.repository.StoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AdminStoryService {

    private final StoryRepository storyRepository;
    private final ModerationActionService moderationActionService;
    private final NotificationService notificationService;

    public AdminStoryService(StoryRepository storyRepository,
                             ModerationActionService moderationActionService,
                             NotificationService notificationService) {
        this.storyRepository = storyRepository;
        this.moderationActionService = moderationActionService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public Page<AdminStoryResponse> search(String q,
                                          SubmissionStatus submissionStatus,
                                          StoryModerationStatus status,
                                          String category,
                                          String author,
                                          Boolean hidden,
                                          boolean includeDeleted,
                                          Pageable pageable) {
        return storyRepository.adminSearch(normalizeLike(q), submissionStatus, status,
            normalize(category), normalizeLike(author), hidden, includeDeleted, pageable).map(this::toAdminStory);
    }

    @Transactional(readOnly = true)
    public AdminStoryResponse getDetail(Long id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy truyện với id = " + id));
        return toAdminStory(story);
    }

    @Transactional
    public AdminStoryResponse update(Long id, AdminUpdateStoryRequest request) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy truyện"));
        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        story.setCategory(request.getCategory());
        story.setGenres(request.getGenres());
        story.setTopics(request.getTopics());
        story.setCoverImage(request.getCoverImage());
        return toAdminStory(storyRepository.save(story));
    }

    @Transactional
    public AdminStoryResponse hide(Long id, boolean hidden) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy truyện"));
        story.setIsHidden(hidden);
        return toAdminStory(storyRepository.save(story));
    }

    @Transactional
    public void softDelete(Long id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy truyện"));
        story.setDeletedAt(LocalDateTime.now());
        story.setIsHidden(true);
        storyRepository.save(story);
    }

    @Transactional
    public AdminStoryResponse restore(Long id) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy truyện"));
        story.setDeletedAt(null);
        return toAdminStory(storyRepository.save(story));
    }

    @Transactional
    public AdminStoryResponse review(Long id, ReviewStoryRequest request, Authentication authentication) {
        Story story = storyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy truyện"));

        String fromStatus = story.getStatus() == null ? null : story.getStatus().name();

        if (story.getSubmissionStatus() != SubmissionStatus.SUBMITTED && story.getStatus() != StoryModerationStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể duyệt truyện khi đang ở trạng thái chờ duyệt");
        }

        String approvalStatus = request.getApprovalStatus();
        if ("APPROVED".equalsIgnoreCase(approvalStatus)) {
            story.setSubmissionStatus(SubmissionStatus.APPROVED);
            story.setStatus(StoryModerationStatus.APPROVED);
        } else if ("REJECTED".equalsIgnoreCase(approvalStatus)) {
            story.setSubmissionStatus(SubmissionStatus.REJECTED);
            story.setStatus(StoryModerationStatus.REJECTED);
        } else {
            throw new IllegalArgumentException("Trạng thái phê duyệt phải là APPROVED hoặc REJECTED");
        }

        story.setAdminNotes(request.getAdminNotes());
        Story reviewed = storyRepository.save(story);

        moderationActionService.record(authentication, "STORY", reviewed.getId(), fromStatus,
                reviewed.getStatus() == null ? null : reviewed.getStatus().name(),
                reviewed.getStatus() == StoryModerationStatus.APPROVED ? "APPROVE" : "REJECT",
                request.getAdminNotes());

        if (reviewed.getUser() != null) {
            if (reviewed.getStatus() == StoryModerationStatus.APPROVED) {
                notificationService.notifyUser(reviewed.getUser().getId(), NotificationType.STORY_APPROVED,
                        "Truyện đã được duyệt",
                        "Truyện \"" + safe(reviewed.getTitle()) + "\" đã được duyệt.",
                        "{\"storyId\":" + reviewed.getId() + "}");
            } else {
                notificationService.notifyUser(reviewed.getUser().getId(), NotificationType.STORY_REJECTED,
                        "Truyện bị từ chối",
                        "Truyện \"" + safe(reviewed.getTitle()) + "\" bị từ chối. Lý do: " + safe(request.getAdminNotes()),
                        "{\"storyId\":" + reviewed.getId() + "}");
            }
        }

        return toAdminStory(reviewed);
    }

    private AdminStoryResponse toAdminStory(Story story) {
        AdminStoryResponse dto = new AdminStoryResponse();
        dto.setId(story.getId());
        dto.setTitle(story.getTitle());
        dto.setAuthorName(story.getAuthorName());
        dto.setCategory(story.getCategory());
        dto.setGenres(story.getGenres());
        dto.setTopics(story.getTopics());
        dto.setSubmissionStatus(story.getSubmissionStatus() == null ? null : story.getSubmissionStatus().name());
        dto.setStatus(story.getStatus() == null ? null : story.getStatus().name());
        dto.setStoryStatus(story.getStoryStatus() == null ? null : story.getStoryStatus().name());
        dto.setIsHidden(story.getIsHidden());
        dto.setAdminNotes(story.getAdminNotes());
        dto.setCreatedAt(story.getCreatedAt());
        dto.setUpdatedAt(story.getUpdatedAt());
        dto.setDeletedAt(story.getDeletedAt());
        return dto;
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t.toLowerCase(Locale.ROOT);
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    private String normalizeLike(String s) {
        String n = normalize(s);
        return n == null ? null : "%" + n + "%";
    }
}
