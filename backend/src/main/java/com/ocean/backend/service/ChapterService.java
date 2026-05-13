package com.ocean.backend.service;

import com.ocean.backend.dto.ChapterResponse;
import com.ocean.backend.dto.CreateChapterRequest;
import com.ocean.backend.dto.UpdateChapterModerationRequest;
import com.ocean.backend.entity.Chapter;
import com.ocean.backend.entity.ChapterModerationStatus;
import com.ocean.backend.entity.Story;
import com.ocean.backend.entity.SubmissionStatus;
import com.ocean.backend.entity.ReadingHistory;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.ChapterRepository;
import com.ocean.backend.repository.ReadingHistoryRepository;
import com.ocean.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ChapterService {

    private final StoryService storyService;
    private final ChapterRepository chapterRepository;
    private final ReadingHistoryRepository readingHistoryRepository;
    private final UserRepository userRepository;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public ChapterService(StoryService storyService,
                          ChapterRepository chapterRepository,
                          ReadingHistoryRepository readingHistoryRepository,
                          UserRepository userRepository) {
        this.storyService = storyService;
        this.chapterRepository = chapterRepository;
        this.readingHistoryRepository = readingHistoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public java.util.List<ChapterResponse> getChaptersByStoryId(Long storyId) {
        return chapterRepository.findByStoryIdOrderByChapterNumberAsc(storyId)
                .stream()
                .map(this::toChapterResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.List<ChapterResponse> getChaptersByStoryIdForUser(Long storyId, Authentication authentication) {
        storyService.ensureCanAccessStory(storyId, authentication);

        boolean isStaff = authentication != null
                && authentication.getAuthorities() != null
                && authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_MODERATOR".equals(a));

        Story story = storyService.findStoryById(storyId);
        boolean isOwner = authentication != null
                && authentication.isAuthenticated()
                && story.getUser() != null
                && story.getUser().getUsername() != null
                && story.getUser().getUsername().equals(authentication.getName());

        if (isStaff || isOwner) {
            return chapterRepository.findByStoryIdAndDeletedAtIsNullOrderByChapterNumberAsc(storyId)
                    .stream()
                    .map(this::toChapterResponse)
                    .toList();
        }

        return chapterRepository.findByStoryIdAndDeletedAtIsNullAndModerationStatusOrderByChapterNumberAsc(
                        storyId,
                        ChapterModerationStatus.APPROVED
                ).stream()
                .map(this::toChapterResponse)
                .toList();
    }

    @Transactional
    public ChapterResponse readChapter(Long chapterId, Authentication authentication, HttpServletRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Bạn cần đăng nhập để đọc chương");
        }

        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chương với id = " + chapterId));
        if (chapter.getDeletedAt() != null) {
            throw new IllegalStateException("Chương đã bị xóa");
        }

        Story story = chapter.getStory();
        storyService.ensureCanAccessStory(story.getId(), authentication);

        boolean isStaff = authentication.getAuthorities() != null
                && authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> "ROLE_ADMIN".equals(a) || "ROLE_MODERATOR".equals(a));

        boolean isOwner = story.getUser() != null
                && story.getUser().getUsername() != null
                && story.getUser().getUsername().equals(authentication.getName());

        if (!isStaff && !isOwner) {
            if (chapter.getModerationStatus() != ChapterModerationStatus.APPROVED) {
                throw new IllegalStateException("Chương chưa được duyệt");
            }
        }

        chapter.setViews((chapter.getViews() == null ? 0 : chapter.getViews()) + 1);
        Chapter saved = chapterRepository.save(chapter);

        ReadingHistory rh = new ReadingHistory();
        User user = userRepository.findByUsername(authentication.getName()).orElse(null);
        rh.setUser(user);
        rh.setStory(story);
        rh.setChapter(saved);
        if (request != null) {
            rh.setIpAddress(extractIp(request));
            rh.setUserAgent(request.getHeader("User-Agent"));
        }
        readingHistoryRepository.save(rh);

        return toChapterResponse(saved);
    }

    @Transactional
    public ChapterResponse updateChapterModeration(Long chapterId, UpdateChapterModerationRequest request) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chương với id = " + chapterId));

        chapter.setModerationStatus(request.getStatus());
        chapter.setViolationNote(request.getViolationNote());

        Chapter saved = chapterRepository.save(chapter);
        return toChapterResponse(saved);
    }

    @Transactional
    public ChapterResponse createChapter(Long storyId, CreateChapterRequest request, String username) {
        Story story = storyService.findStoryById(storyId);
        storyService.verifyOwner(story, username);

        // Kiểm tra truyện đã được duyệt chưa
        if (story.getSubmissionStatus() != SubmissionStatus.APPROVED) {
            throw new IllegalStateException("Truyện chưa được duyệt. Hãy chờ admin phê duyệt trước khi viết chương.");
        }

        validateChapterNumber(storyId, request.getChapterNumber());

        Chapter chapter = new Chapter();
        chapter.setStory(story);
        chapter.setTitle(request.getTitle());
        chapter.setContent(request.getContent());
        chapter.setChapterNumber(request.getChapterNumber());

        Chapter saved = chapterRepository.save(chapter);
        return toChapterResponse(saved);
    }

    @Transactional
    public ChapterResponse createChapterWithImage(Long storyId,
                                                  String title,
                                                  String content,
                                                  Integer chapterNumber,
                                                  MultipartFile image,
                                                  String username) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Tiêu đề chương không được để trống");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Nội dung chương không được để trống");
        }
        if (chapterNumber == null || chapterNumber < 1) {
            throw new IllegalArgumentException("Số chương phải lớn hơn 0");
        }

        Story story = storyService.findStoryById(storyId);
        storyService.verifyOwner(story, username);
        
        // Kiểm tra truyện đã được duyệt chưa
        if (story.getSubmissionStatus() != SubmissionStatus.APPROVED) {
            throw new IllegalStateException("Truyện chưa được duyệt. Hãy chờ admin phê duyệt trước khi viết chương.");
        }
        
        validateChapterNumber(storyId, chapterNumber);

        Chapter chapter = new Chapter();
        chapter.setStory(story);
        chapter.setTitle(title);
        chapter.setContent(content);
        chapter.setChapterNumber(chapterNumber);

        if (image != null && !image.isEmpty()) {
            String imageUrl = saveImage(image);
            chapter.setImageUrl(imageUrl);
        }

        Chapter saved = chapterRepository.save(chapter);
        return toChapterResponse(saved);
    }

    private void validateChapterNumber(Long storyId, Integer chapterNumber) {
        if (chapterRepository.existsByStoryIdAndChapterNumber(storyId, chapterNumber)) {
            throw new IllegalArgumentException("Số chương đã tồn tại trong truyện này");
        }
    }

    private String saveImage(MultipartFile image) {
        try {
            Path uploadPath = Path.of(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String extension = extractExtension(image.getOriginalFilename());
            String fileName = UUID.randomUUID() + extension;
            Path targetFile = uploadPath.resolve(fileName);

            Files.copy(image.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + fileName;
        } catch (IOException ex) {
            throw new IllegalStateException("Không thể lưu ảnh lên hệ thống");
        }
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    private ChapterResponse toChapterResponse(Chapter chapter) {
        ChapterResponse response = new ChapterResponse();
        response.setId(chapter.getId());
        response.setStoryId(chapter.getStory().getId());
        response.setTitle(chapter.getTitle());
        response.setContent(chapter.getContent());
        response.setChapterNumber(chapter.getChapterNumber());
        response.setImageUrl(chapter.getImageUrl());
        response.setCreatedAt(chapter.getCreatedAt());
        response.setModerationStatus(chapter.getModerationStatus() == null ? ChapterModerationStatus.PENDING : chapter.getModerationStatus());
        response.setViews(chapter.getViews() == null ? 0 : chapter.getViews());
        response.setReportCount(chapter.getReportCount() == null ? 0 : chapter.getReportCount());
        response.setViolationNote(chapter.getViolationNote());
        return response;
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
