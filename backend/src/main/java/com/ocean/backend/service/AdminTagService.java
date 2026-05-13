package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AdminTagResponse;
import com.ocean.backend.dto.admin.UpsertTagRequest;
import com.ocean.backend.entity.Tag;
import com.ocean.backend.repository.TagRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;

@Service
public class AdminTagService {

    private final TagRepository tagRepository;

    public AdminTagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    public Page<AdminTagResponse> search(String q, Boolean active, Boolean deleted, Pageable pageable) {
        return tagRepository.adminSearch(normalize(q), active, deleted, pageable).map(this::toDto);
    }

    public AdminTagResponse create(UpsertTagRequest request) {
        String name = normalizeRequired(request.getName(), "Tên tag không được để trống");
        String slug = normalizeSlug(request.getSlug(), name);
        boolean isActive = request.getIsActive() == null ? true : Boolean.TRUE.equals(request.getIsActive());

        if (tagRepository.existsByNameIgnoreCaseAndDeletedAtIsNull(name)) {
            throw new IllegalArgumentException("Tag đã tồn tại");
        }
        if (tagRepository.existsBySlugIgnoreCaseAndDeletedAtIsNull(slug)) {
            throw new IllegalArgumentException("Slug tag đã tồn tại");
        }

        Tag t = new Tag();
        t.setName(name);
        t.setSlug(slug);
        t.setIsActive(isActive);
        return toDto(tagRepository.save(t));
    }

    public AdminTagResponse update(Long id, UpsertTagRequest request) {
        Tag t = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tag"));

        if (t.getDeletedAt() != null) {
            throw new IllegalStateException("Tag đã bị xóa");
        }

        String name = normalizeRequired(request.getName(), "Tên tag không được để trống");
        String slug = normalizeSlug(request.getSlug(), name);
        boolean isActive = request.getIsActive() == null ? Boolean.TRUE.equals(t.getIsActive()) : Boolean.TRUE.equals(request.getIsActive());

        if (tagRepository.existsByNameIgnoreCaseAndDeletedAtIsNullAndIdNot(name, id)) {
            throw new IllegalArgumentException("Tag đã tồn tại");
        }
        if (tagRepository.existsBySlugIgnoreCaseAndDeletedAtIsNullAndIdNot(slug, id)) {
            throw new IllegalArgumentException("Slug tag đã tồn tại");
        }

        t.setName(name);
        t.setSlug(slug);
        t.setIsActive(isActive);
        return toDto(tagRepository.save(t));
    }

    public void delete(Long id) {
        Tag t = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tag"));

        if (t.getDeletedAt() == null) {
            t.setDeletedAt(LocalDateTime.now());
            tagRepository.save(t);
        }
    }

    private AdminTagResponse toDto(Tag t) {
        AdminTagResponse dto = new AdminTagResponse();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setSlug(t.getSlug());
        dto.setIsActive(Boolean.TRUE.equals(t.getIsActive()));
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());
        dto.setDeletedAt(t.getDeletedAt());
        return dto;
    }

    private String normalize(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isBlank() ? null : t;
    }

    private String normalizeRequired(String s, String message) {
        String t = normalize(s);
        if (t == null) {
            throw new IllegalArgumentException(message);
        }
        return t;
    }

    private String normalizeSlug(String slug, String nameFallback) {
        String raw = normalize(slug);
        if (raw == null) {
            raw = nameFallback;
        }
        String out = slugify(raw);
        if (out.isBlank()) {
            throw new IllegalArgumentException("Slug không hợp lệ");
        }
        return out;
    }

    private String slugify(String input) {
        String s = String.valueOf(input == null ? "" : input).trim().toLowerCase();
        s = Normalizer.normalize(s, Normalizer.Form.NFD);
        s = s.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        s = s.replaceAll("[^a-z0-9]+", "-");
        s = s.replaceAll("-+", "-");
        s = s.replaceAll("^-|-$", "");
        return s;
    }
}
