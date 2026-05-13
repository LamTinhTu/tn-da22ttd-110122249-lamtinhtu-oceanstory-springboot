package com.ocean.backend.repository;

import com.ocean.backend.entity.Chapter;
import com.ocean.backend.entity.ChapterModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    boolean existsByStoryIdAndChapterNumber(Long storyId, Integer chapterNumber);

    List<Chapter> findByStoryIdOrderByChapterNumberAsc(Long storyId);

    List<Chapter> findByStoryIdAndDeletedAtIsNullOrderByChapterNumberAsc(Long storyId);

    List<Chapter> findByStoryIdAndDeletedAtIsNullAndModerationStatusOrderByChapterNumberAsc(Long storyId,
                                                                                            ChapterModerationStatus moderationStatus);

        @Query("""
                select c from Chapter c
                where (:storyId is null or c.story.id = :storyId)
                    and (:status is null or c.moderationStatus = :status)
                    and (:includeDeleted = true or c.deletedAt is null)
                order by c.createdAt desc
                """)
        Page<Chapter> adminSearch(Long storyId, ChapterModerationStatus status, boolean includeDeleted, Pageable pageable);

        @Query("select coalesce(sum(c.views),0) from Chapter c where c.deletedAt is null")
        long sumViews();

        long countByDeletedAtIsNull();

        long countByModerationStatusAndDeletedAtIsNull(ChapterModerationStatus status);
}
