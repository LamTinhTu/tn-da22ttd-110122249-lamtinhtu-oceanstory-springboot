package com.ocean.backend.controller;

import com.ocean.backend.dto.ChapterResponse;
import com.ocean.backend.dto.ModerationStoryResponse;
import com.ocean.backend.dto.ReviewStoryRequest;
import com.ocean.backend.dto.StoryResponse;
import com.ocean.backend.dto.UpdateChapterModerationRequest;
import com.ocean.backend.service.ChapterService;
import com.ocean.backend.service.StoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/moderator")
@PreAuthorize("hasRole('MODERATOR')")
public class ModeratorController {

    private final StoryService storyService;
    private final ChapterService chapterService;

    public ModeratorController(StoryService storyService, ChapterService chapterService) {
        this.storyService = storyService;
        this.chapterService = chapterService;
    }

    @GetMapping("/stories")
    public ResponseEntity<List<ModerationStoryResponse>> getStoriesForModeration(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(storyService.getApprovedStoriesForModeration(keyword));
    }

    @GetMapping("/stories/pending")
    public ResponseEntity<List<StoryResponse>> getPendingStoriesForModeration(@RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(storyService.getPendingStoriesForModeration(keyword));
    }

    @PutMapping("/stories/{storyId}/review")
    public ResponseEntity<StoryResponse> reviewStory(@PathVariable Long storyId,
                                                     @Valid @RequestBody ReviewStoryRequest request) {
        return ResponseEntity.ok(storyService.reviewStoryForModeration(storyId, request));
    }

    @GetMapping("/stories/{storyId}/chapters")
    public ResponseEntity<List<ChapterResponse>> getChaptersByStory(@PathVariable Long storyId) {
        return ResponseEntity.ok(chapterService.getChaptersByStoryId(storyId));
    }

    @PutMapping("/chapters/{chapterId}/moderation")
    public ResponseEntity<ChapterResponse> updateChapterModeration(@PathVariable Long chapterId,
                                                                   @Valid @RequestBody UpdateChapterModerationRequest request) {
        return ResponseEntity.ok(chapterService.updateChapterModeration(chapterId, request));
    }
}
