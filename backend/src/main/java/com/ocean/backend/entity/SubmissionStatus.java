package com.ocean.backend.entity;

public enum SubmissionStatus {
    DRAFT,      // Bản nháp, chưa gửi duyệt
    SUBMITTED,  // Đã gửi duyệt, chờ admin phê duyệt
    APPROVED,   // Admin duyệt, có thể viết chương
    REJECTED    // Admin từ chối
}
