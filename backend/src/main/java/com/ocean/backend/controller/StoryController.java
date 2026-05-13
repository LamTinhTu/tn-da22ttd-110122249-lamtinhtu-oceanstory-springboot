package com.ocean.backend.controller;

import com.ocean.backend.dto.ChapterResponse;
import com.ocean.backend.dto.CreateChapterRequest;
import com.ocean.backend.dto.CreateStoryRequest;
import com.ocean.backend.dto.HomeStoryResponse;
import com.ocean.backend.dto.MessageResponse;
import com.ocean.backend.dto.ReviewStoryRequest;
import com.ocean.backend.dto.StoryResponse;
import com.ocean.backend.dto.UpdateStoryRequest;
import com.ocean.backend.service.ChapterService;
import com.ocean.backend.service.StoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/stories")
public class StoryController {

    private final StoryService storyService;
    private final ChapterService chapterService;

    public StoryController(StoryService storyService, ChapterService chapterService) {
        this.storyService = storyService;
        this.chapterService = chapterService;
    }

    @GetMapping("/explore")
    public ResponseEntity<List<HomeStoryResponse>> exploreStories(@RequestParam(defaultValue = "updated") String tab,
                                                                  @RequestParam(required = false) String category) {
        return ResponseEntity.ok(storyService.getExploreStories(tab, category));
    }

    @GetMapping("/search")
    public ResponseEntity<List<HomeStoryResponse>> searchStories(@RequestParam String keyword) {
        return ResponseEntity.ok(storyService.searchStories(keyword));
    }

    @PostMapping
    public ResponseEntity<StoryResponse> createStory(@Valid @RequestBody CreateStoryRequest request,
                                                     Authentication authentication) {
        String username = authentication.getName();
        StoryResponse response = storyService.createStory(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===== AUTHOR ENDPOINTS =====

    @GetMapping("/my")
    public ResponseEntity<List<StoryResponse>> getMyStories(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(
                storyService.getMyStories(username)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoryResponse> getStoryDetail(@PathVariable Long id,
                                                        Authentication authentication) {
        return ResponseEntity.ok(storyService.getStoryDetailForUser(id, authentication));
    }

    @GetMapping("/{id}/chapters")
    public ResponseEntity<List<ChapterResponse>> getChaptersByStory(@PathVariable Long id,
                                                                    Authentication authentication) {
        storyService.ensureCanAccessStory(id, authentication);
        return ResponseEntity.ok(chapterService.getChaptersByStoryId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StoryResponse> updateStory(@PathVariable Long id,
                                                     @Valid @RequestBody UpdateStoryRequest request,
                                                     Authentication authentication) {
        String username = authentication.getName();
        StoryResponse response = storyService.updateStory(id, request, username);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteStory(@PathVariable Long id,
                                                       Authentication authentication) {
        String username = authentication.getName();
        MessageResponse response = storyService.deleteStory(id, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/chapters")
    public ResponseEntity<ChapterResponse> createChapter(@PathVariable Long id,
                                                         @Valid @RequestBody CreateChapterRequest request,
                                                         Authentication authentication) {
        String username = authentication.getName();
        ChapterResponse response = chapterService.createChapter(id, request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/{id}/chapters/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChapterResponse> createChapterWithImage(@PathVariable Long id,
                                                                  @RequestParam String title,
                                                                  @RequestParam String content,
                                                                  @RequestParam Integer chapterNumber,
                                                                  @RequestParam(required = false) MultipartFile image,
                                                                  Authentication authentication) {
        String username = authentication.getName();
        ChapterResponse response = chapterService.createChapterWithImage(
                id,
                title,
                content,
                chapterNumber,
                image,
                username
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<StoryResponse> submitStory(@PathVariable Long id,
                                                     Authentication authentication) {
        String username = authentication.getName();
        StoryResponse response = storyService.submitStory(id, username);
        return ResponseEntity.ok(response);
    }

    // ===== ADMIN ENDPOINTS =====

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StoryResponse>> getPendingStories() {
        List<StoryResponse> response = storyService.getPendingStories();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StoryResponse> reviewStory(@PathVariable Long id,
                                                     @Valid @RequestBody ReviewStoryRequest request) {
        StoryResponse response = storyService.reviewStory(id, request);
        return ResponseEntity.ok(response);
    }
}
