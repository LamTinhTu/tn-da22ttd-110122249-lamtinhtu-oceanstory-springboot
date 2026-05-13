package com.ocean.backend.service;

import com.ocean.backend.dto.admin.AdminCategoryResponse;
import com.ocean.backend.dto.admin.UpsertCategoryRequest;
import com.ocean.backend.entity.Category;
import com.ocean.backend.repository.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDateTime;

@Service
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;

    public AdminCategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Page<AdminCategoryResponse> search(String q, Boolean active, Boolean deleted, Pageable pageable) {
        return categoryRepository.adminSearch(normalize(q), active, deleted, pageable).map(this::toDto);
    }

    public AdminCategoryResponse create(UpsertCategoryRequest request) {
        String name = normalizeRequired(request.getName(), "Tên thể loại không được để trống");
        String slug = normalizeSlug(request.getSlug(), name);
        boolean isActive = request.getIsActive() == null ? true : Boolean.TRUE.equals(request.getIsActive());

        if (categoryRepository.existsByNameIgnoreCaseAndDeletedAtIsNull(name)) {
            throw new IllegalArgumentException("Thể loại đã tồn tại");
        }
        if (categoryRepository.existsBySlugIgnoreCaseAndDeletedAtIsNull(slug)) {
            throw new IllegalArgumentException("Slug thể loại đã tồn tại");
        }

        Category c = new Category();
        c.setName(name);
        c.setSlug(slug);
        c.setIsActive(isActive);
        return toDto(categoryRepository.save(c));
    }

    public AdminCategoryResponse update(Long id, UpsertCategoryRequest request) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thể loại"));

        if (c.getDeletedAt() != null) {
            throw new IllegalStateException("Thể loại đã bị xóa");
        }

        String name = normalizeRequired(request.getName(), "Tên thể loại không được để trống");
        String slug = normalizeSlug(request.getSlug(), name);
        boolean isActive = request.getIsActive() == null ? Boolean.TRUE.equals(c.getIsActive()) : Boolean.TRUE.equals(request.getIsActive());

        if (categoryRepository.existsByNameIgnoreCaseAndDeletedAtIsNullAndIdNot(name, id)) {
            throw new IllegalArgumentException("Thể loại đã tồn tại");
        }
        if (categoryRepository.existsBySlugIgnoreCaseAndDeletedAtIsNullAndIdNot(slug, id)) {
            throw new IllegalArgumentException("Slug thể loại đã tồn tại");
        }

        c.setName(name);
        c.setSlug(slug);
        c.setIsActive(isActive);
        return toDto(categoryRepository.save(c));
    }

    public void delete(Long id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thể loại"));

        if (c.getDeletedAt() == null) {
            c.setDeletedAt(LocalDateTime.now());
            categoryRepository.save(c);
        }
    }

    private AdminCategoryResponse toDto(Category c) {
        AdminCategoryResponse dto = new AdminCategoryResponse();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setSlug(c.getSlug());
        dto.setIsActive(Boolean.TRUE.equals(c.getIsActive()));
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        dto.setDeletedAt(c.getDeletedAt());
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
