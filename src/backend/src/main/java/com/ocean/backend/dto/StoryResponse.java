package com.ocean.backend.dto;

import com.ocean.backend.entity.StoryModerationStatus;
import com.ocean.backend.entity.StoryPublicationStatus;
import com.ocean.backend.entity.SubmissionStatus;

import java.time.LocalDateTime;

public class StoryResponse {

    private Long id;
    private String type;
    private String title;
    private String authorName;
    private String coAuthor;
    private String description;
    private String genres;
    private String topics;
    private String category;
    private SubmissionStatus submissionStatus;
    private StoryModerationStatus status;
    private StoryPublicationStatus storyStatus;
    private String adminNotes; // Ghi chú từ admin
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getCoAuthor() {
        return coAuthor;
    }

    public void setCoAuthor(String coAuthor) {
        this.coAuthor = coAuthor;
    }

    public String getGenres() {
        return genres;
    }

    public void setGenres(String genres) {
        this.genres = genres;
    }

    public String getTopics() {
        return topics;
    }

    public void setTopics(String topics) {
        this.topics = topics;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public SubmissionStatus getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(SubmissionStatus submissionStatus) {
        this.submissionStatus = submissionStatus;
    }

    public StoryModerationStatus getStatus() {
        return status;
    }

    public void setStatus(StoryModerationStatus status) {
        this.status = status;
    }

    public StoryPublicationStatus getStoryStatus() {
        return storyStatus;
    }

    public void setStoryStatus(StoryPublicationStatus storyStatus) {
        this.storyStatus = storyStatus;
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

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
