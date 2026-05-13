package com.ocean.backend.dto;

import com.ocean.backend.entity.StoryPublicationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateStoryRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    private String category;

    @NotNull(message = "Tình trạng truyện không được để trống")
    private StoryPublicationStatus storyStatus;

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public StoryPublicationStatus getStoryStatus() {
        return storyStatus;
    }

    public void setStoryStatus(StoryPublicationStatus storyStatus) {
        this.storyStatus = storyStatus;
    }
}
