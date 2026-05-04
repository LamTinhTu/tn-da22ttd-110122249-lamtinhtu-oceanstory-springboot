package com.ocean.backend.service;

import com.ocean.backend.dto.ChapterResponse;
import com.ocean.backend.dto.CreateChapterRequest;
import com.ocean.backend.entity.Chapter;
import com.ocean.backend.entity.Story;
import com.ocean.backend.entity.SubmissionStatus;
import com.ocean.backend.repository.ChapterRepository;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public ChapterService(StoryService storyService, ChapterRepository chapterRepository) {
        this.storyService = storyService;
        this.chapterRepository = chapterRepository;
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
        return response;
    }
}
