package com.ocean.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateStoryRequest {

    @NotBlank(message = "Loại hình không được để trống")
    private String type; // Một chương, Nhiều chương

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String coAuthor; // Đồng tác giả (tuỳ chọn)

    @NotBlank(message = "Tóm tắt nội dung không được để trống")
    private String description; // Tóm tắt nội dung (bắt buộc)

    private String genres; // Dropdown: "Ngôn tình", "Kiếm hiệp", ...

    private String topics; // Dropdown: "Tình cảm", "Hành động", ...

    private String coverImage; // URL/Path ảnh bìa (tuỳ chọn)

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

    public String getCoAuthor() {
        return coAuthor;
    }

    public void setCoAuthor(String coAuthor) {
        this.coAuthor = coAuthor;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }
}
