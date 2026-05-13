package com.ocean.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;

public class HandleReportRequest {

    /** "RESOLVED" or "REJECTED" */
    @NotBlank
    private String resolution;

    private String handledNote;

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getHandledNote() {
        return handledNote;
    }

    public void setHandledNote(String handledNote) {
        this.handledNote = handledNote;
    }
}
