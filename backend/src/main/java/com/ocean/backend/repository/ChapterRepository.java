package com.ocean.backend.repository;

import com.ocean.backend.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    boolean existsByStoryIdAndChapterNumber(Long storyId, Integer chapterNumber);
}
