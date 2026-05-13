package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AdminReportResponse;
import com.ocean.backend.entity.Report;
import com.ocean.backend.entity.ReportStatus;
import com.ocean.backend.entity.ReportTargetType;
import com.ocean.backend.entity.User;
import com.ocean.backend.repository.ReportRepository;
import com.ocean.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AdminReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public AdminReportService(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminReportResponse> list(String statusRaw, String targetTypeRaw, String q, Pageable pageable) {
        ReportStatus status = parseStatus(statusRaw);
        ReportTargetType targetType = parseTargetType(targetTypeRaw);
        String normalizedQ = normalize(q);
        return reportRepository.adminSearch(status, targetType, normalizedQ, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public AdminReportResponse getById(Long id) {
        Report report = requireReport(id);
        return toDto(report);
    }

    @Transactional
    public AdminReportResponse handle(Long reportId, String resolutionRaw, String handledNote, Authentication authentication) {
        Report report = requireReport(reportId);

        String resolution = String.valueOf(resolutionRaw).trim().toUpperCase();
        ReportStatus newStatus;
        if ("RESOLVED".equals(resolution)) {
            newStatus = ReportStatus.RESOLVED;
        } else if ("REJECTED".equals(resolution)) {
            newStatus = ReportStatus.REJECTED;
        } else {
            throw new IllegalArgumentException("Resolution phải là RESOLVED hoặc REJECTED");
        }

        report.setStatus(newStatus);
        report.setHandledNote(handledNote);
        report.setHandledAt(LocalDateTime.now());

        // Gán người xử lý từ authentication
        if (authentication != null && authentication.isAuthenticated()) {
            userRepository.findByUsername(authentication.getName())
                    .ifPresent(report::setHandledBy);
        }

        return toDto(reportRepository.save(report));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Report requireReport(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo với id = " + id));
    }

    private AdminReportResponse toDto(Report r) {
        AdminReportResponse dto = new AdminReportResponse();
        dto.setId(r.getId());

        User reporter = r.getReporter();
        if (reporter != null) {
            dto.setReporterId(reporter.getId());
            dto.setReporterUsername(reporter.getUsername());
        }

        dto.setTargetType(r.getTargetType() == null ? null : r.getTargetType().name());
        dto.setTargetId(r.getTargetId());
        dto.setReason(r.getReason());
        dto.setDescription(r.getDescription());
        dto.setStatus(r.getStatus() == null ? null : r.getStatus().name());
        dto.setHandledNote(r.getHandledNote());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setHandledAt(r.getHandledAt());

        User handledBy = r.getHandledBy();
        if (handledBy != null) {
            dto.setHandledByUsername(handledBy.getUsername());
        }

        return dto;
    }

    private ReportStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return ReportStatus.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Status không hợp lệ: " + raw);
        }
    }

    private ReportTargetType parseTargetType(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return ReportTargetType.valueOf(raw.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("TargetType không hợp lệ: " + raw);
        }
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
