package com.ocean.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stories")
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "author_name", nullable = true)
    private String authorName; // Tác giả (lấy từ username)

    @Column
    private String coAuthor; // Đồng tác giả (tuỳ chọn)

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", nullable = true)
    private User user; // User tạo story (từ authentication)

    @Column
    private String type; // Một chương, Nhiều chương

    @Column(columnDefinition = "TEXT")
    private String description; // Tóm tắt nội dung (bắt buộc)

    @Column(columnDefinition = "TEXT")
    private String content; // Nội dung chi tiết (tuỳ chọn, sau khi approved)

    @Column(columnDefinition = "TEXT", name = "genres")
    private String genres; // String đơn (hoặc CSV) từ dropdown

    @Column(columnDefinition = "TEXT", name = "topics")
    private String topics; // String đơn (hoặc CSV) từ dropdown

    @Column
    private String category;

    @Column(name = "cover_image")
    private String coverImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_status", nullable = true)
    private SubmissionStatus submissionStatus; // DRAFT, SUBMITTED, APPROVED, REJECTED

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = true)
    private StoryModerationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "story_status", nullable = true)
    private StoryPublicationStatus storyStatus;

    @Column(columnDefinition = "TEXT")
    private String adminNotes; // Ghi chú từ admin khi từ chối/phê duyệt

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Chapter> chapters = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.isHidden == null) {
            this.isHidden = false;
        }

        if (this.submissionStatus == null) {
            this.submissionStatus = SubmissionStatus.DRAFT;
        }
        if (this.status == null) {
            this.status = StoryModerationStatus.DRAFT;
        }
        if (this.storyStatus == null) {
            this.storyStatus = StoryPublicationStatus.ONGOING;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getCoAuthor() {
        return coAuthor;
    }

    public void setCoAuthor(String coAuthor) {
        this.coAuthor = coAuthor;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getGenres() {
        return genres;
    }

    public void setGenres(String genres) {
        this.genres = genres;
    }

    public String getTopics() {
        return topics;
    }

    public void setTopics(String topics) {
        this.topics = topics;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public SubmissionStatus getSubmissionStatus() {
        return submissionStatus;
    }

    public void setSubmissionStatus(SubmissionStatus submissionStatus) {
        this.submissionStatus = submissionStatus;
    }

    public StoryModerationStatus getStatus() {
        return status;
    }

    public void setStatus(StoryModerationStatus status) {
        this.status = status;
    }

    public StoryPublicationStatus getStoryStatus() {
        return storyStatus;
    }

    public void setStoryStatus(StoryPublicationStatus storyStatus) {
        this.storyStatus = storyStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Chapter> getChapters() {
        return chapters;
    }

    public void setChapters(List<Chapter> chapters) {
        this.chapters = chapters;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public Boolean getIsHidden() {
        return isHidden;
    }

    public void setIsHidden(Boolean hidden) {
        isHidden = hidden;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(LocalDateTime deletedAt) {
        this.deletedAt = deletedAt;
    }
}
