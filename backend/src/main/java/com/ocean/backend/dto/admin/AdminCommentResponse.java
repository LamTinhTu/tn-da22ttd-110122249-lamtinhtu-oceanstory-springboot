package com.ocean.backend.dto.admin;

import com.ocean.backend.dto.ChapterResponse;
import java.time.LocalDateTime;

public class AdminCommentResponse {
    private Long id;
    private String content;
    private Boolean isHidden;
    private Boolean isLocked;
    private String lockReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AdminUserResponse user;
    private AdminStoryResponse story;
    private ChapterResponse chapter;

    public AdminCommentResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getIsHidden() {
        return isHidden;
    }

    public void setIsHidden(Boolean hidden) {
        isHidden = hidden;
    }

    public Boolean getIsLocked() {
        return isLocked;
    }

    public void setIsLocked(Boolean locked) {
        isLocked = locked;
    }

    public String getLockReason() {
        return lockReason;
    }

    public void setLockReason(String lockReason) {
        this.lockReason = lockReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public AdminUserResponse getUser() {
        return user;
    }

    public void setUser(AdminUserResponse user) {
        this.user = user;
    }

    public AdminStoryResponse getStory() {
        return story;
    }

    public void setStory(AdminStoryResponse story) {
        this.story = story;
    }

    public ChapterResponse getChapter() {
        return chapter;
    }

    public void setChapter(ChapterResponse chapter) {
        this.chapter = chapter;
    }
}
