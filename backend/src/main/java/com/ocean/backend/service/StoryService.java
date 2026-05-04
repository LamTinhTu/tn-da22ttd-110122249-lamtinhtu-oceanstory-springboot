package com.ocean.backend.service;

import com.ocean.backend.dto.CreateStoryRequest;
import com.ocean.backend.dto.HomeStoryResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        story.setSubmissionStatus(SubmissionStatus.SUBMITTED); // Gửi duyệt ngay
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

        storyRepository.delete(story);
        return new MessageResponse("Xóa truyện thành công");
    }

    @Transactional
    public StoryResponse submitStory(Long storyId, String username) {
        Story story = findStoryById(storyId);
        verifyOwner(story, username);

        if (story.getStatus() != StoryModerationStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể gửi kiểm duyệt khi truyện đang ở trạng thái DRAFT");
        }

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
        response.setSubmissionStatus(story.getSubmissionStatus());
        response.setStatus(story.getStatus());
        response.setStoryStatus(story.getStoryStatus());
        response.setAdminNotes(story.getAdminNotes());
        response.setCreatedAt(story.getCreatedAt());
        response.setUpdatedAt(story.getUpdatedAt());
        return response;
    }

    @Transactional(readOnly = true)
    public List<HomeStoryResponse> getExploreStories(String tab, String category) {
        List<Story> stories;

        if (category != null && !category.isBlank()) {
            stories = storyRepository.findTop12ByCategoryIgnoreCaseOrderByUpdatedAtDesc(category);
        } else if ("new".equalsIgnoreCase(tab)) {
            stories = storyRepository.findTop12ByOrderByCreatedAtDesc();
        } else if ("recommended".equalsIgnoreCase(tab)) {
            stories = storyRepository.findTop12Recommended();
        } else {
            stories = storyRepository.findTop12ByOrderByUpdatedAtDesc();
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
        // Fallback cover de frontend luon co anh hien thi.
        response.setCoverImage("https://picsum.photos/seed/story-" + story.getId() + "/320/460");
        return response;
    }

    // ===== ADMIN ENDPOINTS =====
    
    @Transactional(readOnly = true)
    public List<StoryResponse> getPendingStories() {
        // Lấy tất cả stories chờ duyệt (submissionStatus = SUBMITTED)
        return storyRepository.findBySubmissionStatus(SubmissionStatus.SUBMITTED)
            .stream().map(this::toStoryResponse).toList();
    }

    @Transactional
    public StoryResponse reviewStory(Long storyId, ReviewStoryRequest request) {
        Story story = findStoryById(storyId);
        
        if (story.getSubmissionStatus() != SubmissionStatus.SUBMITTED) {
            throw new IllegalStateException("Chỉ có thể duyệt truyện ở trạng thái SUBMITTED");
        }
        
        String approvalStatus = request.getApprovalStatus();
        if ("APPROVED".equalsIgnoreCase(approvalStatus)) {
            story.setSubmissionStatus(SubmissionStatus.APPROVED);
        } else if ("REJECTED".equalsIgnoreCase(approvalStatus)) {
            story.setSubmissionStatus(SubmissionStatus.REJECTED);
        } else {
            throw new IllegalArgumentException("Trạng thái phê duyệt phải là APPROVED hoặc REJECTED");
        }
        
        story.setAdminNotes(request.getAdminNotes());
        Story reviewed = storyRepository.save(story);
        return toStoryResponse(reviewed);
    }
}
