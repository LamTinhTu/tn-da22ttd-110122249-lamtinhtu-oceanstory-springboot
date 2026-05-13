package com.ocean.backend.dto.notification;

public class SendSystemNotificationResponse {

    private long createdCount;

    public SendSystemNotificationResponse() {
    }

    public SendSystemNotificationResponse(long createdCount) {
        this.createdCount = createdCount;
    }

    public long getCreatedCount() {
        return createdCount;
    }

    public void setCreatedCount(long createdCount) {
        this.createdCount = createdCount;
    }
}
