package com.ocean.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;

public class UpsertTagRequest {

    @NotBlank(message = "Tên tag không được để trống")
    private String name;

    private String slug;

    private Boolean isActive;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
