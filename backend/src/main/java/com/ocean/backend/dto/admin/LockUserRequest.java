package com.ocean.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;

public class LockUserRequest {

    @NotBlank(message = "Vui lòng nhập lý do khóa")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
