package com.ocean.backend.service;

import com.ocean.backend.dto.CreateStoryRequest;
import com.ocean.backend.dto.HomeStoryResponse;
import com.ocean.backend.dto.ModerationStoryResponse;
import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.ReviewStoryRequest;
import com.ocean.backend.dto.StoryResponse;
import com.ocean.backend.dto.UpdateStoryRequest;
import com.ocean.backend.entity.Story;
import com.ocean.backend.entity.StoryModerationStatus;
import com.ocean.backend.entity.SubmissionStatus;
import com.ocean.backend.entity.User;
import com.ocean.backend.exception.ForbiddenActionException;
import com.ocean.backend.exception.StoryNotFoundException;
import com.ocean.backend.repository.StoryRepository;
import com.ocean.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Service
public class StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;

    public StoryService(StoryRepository storyRepository, UserRepository userRepository) {
        this.storyRepository = storyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public StoryResponse createStory(CreateStoryRequest request, String username) {
        User user = findCurrentUser(username);

        Story story = new Story();
        story.setType(request.getType());
        story.setTitle(request.getTitle());
        story.setAuthorName(username); // Lấy từ account hiện tại
        story.setCoAuthor(request.getCoAuthor()); // Đồng tác giả (tuỳ chọn)
        story.setDescription(request.getDescription());
        story.setGenres(request.getGenres()); // Dropdown value
        story.setTopics(request.getTopics()); // Dropdown value
        story.setCoverImage(request.getCoverImage());
        // Default: tạo truyện để gửi duyệt ngay (có thể thay đổi nếu cần workflow DRAFT).
        story.setSubmissionStatus(SubmissionStatus.SUBMITTED);
        story.setStatus(StoryModerationStatus.PENDING);
        story.setUser(user);

        Story savedStory = storyRepository.save(story);
        return toStoryResponse(savedStory);
    }

    @Transactional
    public StoryResponse updateStory(Long storyId, UpdateStoryRequest request, String username) {
        Story story = findStoryById(storyId);
        verifyOwner(story, username);

        // Truyện đã duyệt thì không cho sửa nội dung.
        if (story.getStatus() == StoryModerationStatus.APPROVED) {
            throw new IllegalStateException("Truyện đã APPROVED, không được phép chỉnh sửa");
        }

        story.setTitle(request.getTitle());
        story.setDescription(request.getDescription());
        story.setCategory(request.getCategory());
        story.setStoryStatus(request.getStoryStatus());

        Story updatedStory = storyRepository.save(story);
        return toStoryResponse(updatedStory);
    }

    @Transactional
    public MessageResponse deleteStory(Long storyId, String username) {
        Story story = findStoryById(storyId);
        verifyOwner(story, username);

        story.setDeletedAt(LocalDateTime.now());
        story.setIsHidden(true);
        storyRepository.save(story);
        return new MessageResponse("Xóa truyện thành công (soft delete)");
    }

    @Transactional
    public StoryResponse submitStory(Long storyId, String username) {
        Story story = findStoryById(storyId);
        verifyOwner(story, username);

        // Chấp nhận cả 2 cột trạng thái (legacy) nhưng sẽ đồng bộ về 1 bộ quy tắc.
        if (story.getStatus() != StoryModerationStatus.DRAFT && story.getSubmissionStatus() != SubmissionStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể gửi kiểm duyệt khi truyện đang ở trạng thái DRAFT");
        }

        story.setSubmissionStatus(SubmissionStatus.SUBMITTED);
        story.setStatus(StoryModerationStatus.PENDING);
        Story saved = storyRepository.save(story);
        return toStoryResponse(saved);
    }

    public Story findStoryById(Long storyId) {
        return storyRepository.findById(storyId)
            .orElseThrow(() -> new StoryNotFoundException("Không tìm thấy truyện với id = " + storyId));
    }

    private User findCurrentUser(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy user đang đăng nhập"));
    }

    public void verifyOwner(Story story, String username) {
        if (!story.getUser().getUsername().equals(username)) {
            throw new ForbiddenActionException("Bạn không phải chủ truyện nên không có quyền thao tác");
        }
    }

    public StoryResponse toStoryResponse(Story story) {
        StoryResponse response = new StoryResponse();
        response.setId(story.getId());
        response.setType(story.getType());
        response.setTitle(story.getTitle());
        response.setDescription(story.getDescription());
        response.setAuthorName(story.getAuthorName());
        response.setCoAuthor(story.getCoAuthor());
        response.setGenres(story.getGenres());
        response.setTopics(story.getTopics());
        response.setCategory(story.getCategory());
        response.setCoverImage(story.getCoverImage());
        response.setSubmissionStatus(story.getSubmissionStatus());
        response.setStatus(story.getStatus());
        response.setStoryStatus(story.getStoryStatus());
        response.setAdminNotes(story.getAdminNotes());
        response.setCreatedAt(story.getCreatedAt());
        response.setUpdatedAt(story.getUpdatedAt());
        return response;
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getMyStories(String username) {
        return storyRepository.findByUserUsernameOrderByUpdatedAtDesc(username)
                .stream()
                .map(this::toStoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoryResponse getStoryDetailForUser(Long storyId, Authentication authentication) {
        Story story = findStoryById(storyId);
        ensureCanAccessStory(story, authentication);
        return toStoryResponse(story);
    }

    @Transactional(readOnly = true)
    public void ensureCanAccessStory(Long storyId, Authentication authentication) {
        Story story = findStoryById(storyId);
        ensureCanAccessStory(story, authentication);
    }

    private void ensureCanAccessStory(Story story, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ForbiddenActionException("Bạn cần đăng nhập để truy cập tài nguyên này");
        }

        String username = authentication.getName();
        boolean isOwner = story.getUser() != null
                && story.getUser().getUsername() != null
                && story.getUser().getUsername().equals(username);

        boolean isStaff = authentication.getAuthorities() != null
                && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_MODERATOR".equals(a));

        if (isOwner || isStaff) {
            return;
        }

        // Public access for authenticated users (only when approved + visible + not deleted)
        boolean isPublic = story.getDeletedAt() == null
                && Boolean.FALSE.equals(story.getIsHidden())
                && (story.getStatus() == StoryModerationStatus.APPROVED
                    || story.getSubmissionStatus() == SubmissionStatus.APPROVED);

        if (isPublic) {
            return;
        }

        throw new ForbiddenActionException("Bạn không có quyền truy cập truyện này");
    }

    @Transactional(readOnly = true)
    public List<HomeStoryResponse> getExploreStories(String tab, String category) {
        List<Story> stories;

        if (category != null && !category.isBlank()) {
            stories = storyRepository.findTop12ByDeletedAtIsNullAndIsHiddenFalseAndCategoryIgnoreCaseAndStatusOrderByUpdatedAtDesc(
                    category,
                    StoryModerationStatus.APPROVED
            );
        } else if ("new".equalsIgnoreCase(tab)) {
            stories = storyRepository.findTop12ByDeletedAtIsNullAndIsHiddenFalseAndStatusOrderByCreatedAtDesc(StoryModerationStatus.APPROVED);
        } else if ("recommended".equalsIgnoreCase(tab)) {
            stories = storyRepository.findTop12Recommended();
        } else {
            stories = storyRepository.findTop12ByDeletedAtIsNullAndIsHiddenFalseAndStatusOrderByUpdatedAtDesc(StoryModerationStatus.APPROVED);
        }

        return stories.stream().map(this::toHomeStoryResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<HomeStoryResponse> searchStories(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        return storyRepository.searchByKeyword(keyword).stream().map(this::toHomeStoryResponse).toList();
    }

    private HomeStoryResponse toHomeStoryResponse(Story story) {
        HomeStoryResponse response = new HomeStoryResponse();
        response.setId(story.getId());
        response.setTitle(story.getTitle());
        response.setAuthor(story.getAuthorName());
        response.setCategory(story.getCategory());
        response.setCoverImage(story.getCoverImage());
        return response;
    }

    // ===== ADMIN ENDPOINTS =====
    
    @Transactional(readOnly = true)
    public List<StoryResponse> getPendingStories() {
        // Lấy tất cả stories chờ duyệt (submissionStatus = SUBMITTED)
        return storyRepository.findBySubmissionStatus(SubmissionStatus.SUBMITTED)
            .stream().map(this::toStoryResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<StoryResponse> getPendingStoriesForModeration(String keyword) {
        List<Story> stories = storyRepository.findBySubmissionStatus(SubmissionStatus.SUBMITTED);
        String q = keyword == null ? "" : keyword.trim().toLowerCase();

        return stories.stream()
                .filter(s -> {
                    if (q.isEmpty()) return true;
                    String title = s.getTitle() == null ? "" : s.getTitle().toLowerCase();
                    String author = s.getAuthorName() == null ? "" : s.getAuthorName().toLowerCase();
                    return title.contains(q) || author.contains(q);
                })
                .sorted((a, b) -> {
                    if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                    if (a.getUpdatedAt() == null) return 1;
                    if (b.getUpdatedAt() == null) return -1;
                    return b.getUpdatedAt().compareTo(a.getUpdatedAt());
                })
                .map(this::toStoryResponse)
                .toList();
    }

    @Transactional
    public StoryResponse reviewStory(Long storyId, ReviewStoryRequest request) {
        Story story = findStoryById(storyId);
        

        return reviewStoryInternal(story, request);
    }

    @Transactional
    public StoryResponse reviewStoryForModeration(Long storyId, ReviewStoryRequest request) {
        Story story = findStoryById(storyId);
        return reviewStoryInternal(story, request);
    }

    private StoryResponse reviewStoryInternal(Story story, ReviewStoryRequest request) {
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
        return toStoryResponse(reviewed);
    }

    // ===== MODERATOR ENDPOINTS =====

    @Transactional(readOnly = true)
    public List<ModerationStoryResponse> getApprovedStoriesForModeration(String keyword) {
        // Moderator dashboard needs to reflect current DB state.
        // Some datasets may not yet have submissionStatus=APPROVED but still need to be selectable.
        List<Story> stories = storyRepository.findAll();
        if (stories == null) {
            stories = new ArrayList<>();
        }

        String q = keyword == null ? "" : keyword.trim().toLowerCase();
        return stories.stream()
                .filter(s -> {
                    if (q.isEmpty()) return true;
                    String title = s.getTitle() == null ? "" : s.getTitle().toLowerCase();
                    String author = s.getAuthorName() == null ? "" : s.getAuthorName().toLowerCase();
                    return title.contains(q) || author.contains(q);
                })
                .sorted((a, b) -> {
                    if (a.getUpdatedAt() == null && b.getUpdatedAt() == null) return 0;
                    if (a.getUpdatedAt() == null) return 1;
                    if (b.getUpdatedAt() == null) return -1;
                    return b.getUpdatedAt().compareTo(a.getUpdatedAt());
                })
                .map(this::toModerationStoryResponse)
                .toList();
    }

    private ModerationStoryResponse toModerationStoryResponse(Story story) {
        ModerationStoryResponse response = new ModerationStoryResponse();
        response.setId(story.getId());
        response.setTitle(story.getTitle());
        response.setAuthorName(story.getAuthorName());
        response.setCategory(story.getCategory());
        response.setUpdatedAt(story.getUpdatedAt());
        response.setCoverImage(story.getCoverImage());
        return response;
    }
}
