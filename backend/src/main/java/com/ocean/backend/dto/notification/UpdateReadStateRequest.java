package com.ocean.backend.dto.notification;

import jakarta.validation.constraints.NotNull;

public class UpdateReadStateRequest {

    @NotNull
    private Boolean isRead;

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean read) {
        isRead = read;
    }
}
