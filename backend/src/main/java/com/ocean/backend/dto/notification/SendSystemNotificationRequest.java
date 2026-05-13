package com.ocean.backend.dto.notification;

import com.ocean.backend.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;

public class SendSystemNotificationRequest {

    private NotificationType type;

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    private Object meta;

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Object getMeta() {
        return meta;
    }

    public void setMeta(Object meta) {
        this.meta = meta;
    }
}
