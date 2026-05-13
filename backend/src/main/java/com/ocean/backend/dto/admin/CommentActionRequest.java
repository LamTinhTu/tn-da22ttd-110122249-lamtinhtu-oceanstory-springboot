package com.ocean.backend.dto.admin;

import jakarta.validation.constraints.NotNull;

public class CommentActionRequest {
    @NotNull(message = "Reason cannot be null")
    private String reason;

    public CommentActionRequest() {}

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
