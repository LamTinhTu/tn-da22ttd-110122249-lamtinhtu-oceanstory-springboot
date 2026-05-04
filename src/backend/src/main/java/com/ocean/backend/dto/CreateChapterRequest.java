package com.ocean.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateChapterRequest {

    @NotBlank(message = "Tiêu đề chương không được để trống")
    private String title;

    @NotBlank(message = "Nội dung chương không được để trống")
    private String content;

    @NotNull(message = "Số chương không được để trống")
    @Min(value = 1, message = "Số chương phải lớn hơn 0")
    private Integer chapterNumber;

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
}
