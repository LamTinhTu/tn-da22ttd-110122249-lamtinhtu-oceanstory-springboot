package com.ocean.backend.dto;

import com.ocean.backend.entity.ChapterModerationStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateChapterModerationRequest {

    @NotNull
    private ChapterModerationStatus status;

    private String violationNote;

    public ChapterModerationStatus getStatus() {
        return status;
    }

    public void setStatus(ChapterModerationStatus status) {
        this.status = status;
    }

    public String getViolationNote() {
        return violationNote;
    }

    public void setViolationNote(String violationNote) {
        this.violationNote = violationNote;
    }
}
