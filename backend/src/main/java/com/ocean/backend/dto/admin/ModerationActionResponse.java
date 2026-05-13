package com.ocean.backend.dto.admin;

import java.time.LocalDateTime;

public class ModerationActionResponse {

    private Long id;
    private String targetType;
    private Long targetId;
    private String fromStatus;
    private String toStatus;
    private String action;
    private String reason;
    private Long moderatorId;
    private String moderatorUsername;
    private LocalDateTime createdAt;

    public ModerationActionResponse() {
    }

    public ModerationActionResponse(Long id,
                                    String targetType,
                                    Long targetId,
                                    String fromStatus,
                                    String toStatus,
                                    String action,
                                    String reason,
                                    Long moderatorId,
                                    String moderatorUsername,
                                    LocalDateTime createdAt) {
        this.id = id;
        this.targetType = targetType;
        this.targetId = targetId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.action = action;
        this.reason = reason;
        this.moderatorId = moderatorId;
        this.moderatorUsername = moderatorUsername;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(String fromStatus) {
        this.fromStatus = fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public void setToStatus(String toStatus) {
        this.toStatus = toStatus;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Long getModeratorId() {
        return moderatorId;
    }

    public void setModeratorId(Long moderatorId) {
        this.moderatorId = moderatorId;
    }

    public String getModeratorUsername() {
        return moderatorUsername;
    }

    public void setModeratorUsername(String moderatorUsername) {
        this.moderatorUsername = moderatorUsername;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
