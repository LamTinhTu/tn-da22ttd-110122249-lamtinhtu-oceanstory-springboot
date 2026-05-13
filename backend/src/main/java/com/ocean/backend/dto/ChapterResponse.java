package com.ocean.backend.dto;

import java.time.LocalDateTime;
import com.ocean.backend.entity.ChapterModerationStatus;

public class ChapterResponse {

    private Long id;
    private Long storyId;
    private String title;
    private String content;
    private Integer chapterNumber;
    private String imageUrl;
    private LocalDateTime createdAt;

    private ChapterModerationStatus moderationStatus;
    private Integer views;
    private Integer reportCount;
    private String violationNote;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStoryId() {
        return storyId;
    }

    public void setStoryId(Long storyId) {
        this.storyId = storyId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getChapterNumber() {
        return chapterNumber;
    }

    public void setChapterNumber(Integer chapterNumber) {
        this.chapterNumber = chapterNumber;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ChapterModerationStatus getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(ChapterModerationStatus moderationStatus) {
        this.moderationStatus = moderationStatus;
    }

    public Integer getViews() {
        return views;
    }

    public void setViews(Integer views) {
        this.views = views;
    }

    public Integer getReportCount() {
        return reportCount;
    }

    public void setReportCount(Integer reportCount) {
        this.reportCount = reportCount;
    }

    public String getViolationNote() {
        return violationNote;
    }

    public void setViolationNote(String violationNote) {
        this.violationNote = violationNote;
    }
}
