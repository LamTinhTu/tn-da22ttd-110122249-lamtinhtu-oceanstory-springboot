package com.ocean.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ReviewStoryRequest {
    
    @NotBlank(message = "Trạng thái phê duyệt là bắt buộc (APPROVED hoặc REJECTED)")
    private String approvalStatus; // APPROVED hoặc REJECTED
    
    private String adminNotes; // Ghi chú từ admin

    public ReviewStoryRequest() {}

    public ReviewStoryRequest(String approvalStatus, String adminNotes) {
        this.approvalStatus = approvalStatus;
        this.adminNotes = adminNotes;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
