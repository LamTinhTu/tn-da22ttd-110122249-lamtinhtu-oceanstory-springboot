package com.ocean.backend.repository;

import com.ocean.backend.entity.Story;
import com.ocean.backend.entity.StoryModerationStatus;
import com.ocean.backend.entity.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {

    boolean existsByIdAndUserId(Long id, Long userId);

    List<Story> findTop12ByDeletedAtIsNullAndIsHiddenFalseAndStatusOrderByUpdatedAtDesc(StoryModerationStatus status);

    List<Story> findTop12ByDeletedAtIsNullAndIsHiddenFalseAndStatusOrderByCreatedAtDesc(StoryModerationStatus status);

    @Query(value = "select * from stories where deleted_at is null and is_hidden = false and status = 'APPROVED' order by random() limit 12", nativeQuery = true)
    List<Story> findTop12Recommended();

    List<Story> findTop12ByDeletedAtIsNullAndIsHiddenFalseAndCategoryIgnoreCaseAndStatusOrderByUpdatedAtDesc(String category,
                                                        StoryModerationStatus status);

    @Query("""
            select s from Story s
            where s.deletedAt is null
              and s.isHidden = false
              and (lower(s.title) like lower(concat('%', :keyword, '%'))
               or lower(s.user.username) like lower(concat('%', :keyword, '%')))
            order by s.updatedAt desc
            """)
    List<Story> searchByKeyword(String keyword);

    List<Story> findBySubmissionStatus(SubmissionStatus submissionStatus);

    List<Story> findByUserUsernameOrderByUpdatedAtDesc(String username);

    @Query("""
        select s from Story s
        where (:q is null
          or lower(s.title) like :q
          or lower(s.authorName) like :q)
          and (:submissionStatus is null or s.submissionStatus = :submissionStatus)
          and (:status is null or s.status = :status)
        and (:category is null or lower(s.category) = :category)
        and (:author is null or lower(s.authorName) like :author)
          and (:hidden is null or s.isHidden = :hidden)
          and (:includeDeleted = true or s.deletedAt is null)
        order by s.updatedAt desc
        """)
    Page<Story> adminSearch(String q,
                           SubmissionStatus submissionStatus,
                           StoryModerationStatus status,
                           String category,
                           String author,
                           Boolean hidden,
                           boolean includeDeleted,
                           Pageable pageable);

    long countByDeletedAtIsNull();

    long countByStatusAndDeletedAtIsNull(StoryModerationStatus status);

    @Query("""
        select cast(s.createdAt as date), count(s)
        from Story s
        where (:includeDeleted = true or s.deletedAt is null)
          and s.createdAt >= :from
        group by cast(s.createdAt as date)
        order by cast(s.createdAt as date)
        """)
    java.util.List<Object[]> countStoryCreatedPerDay(java.time.LocalDateTime from, boolean includeDeleted);
}
