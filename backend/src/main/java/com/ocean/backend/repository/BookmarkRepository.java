package com.ocean.backend.repository;

import com.ocean.backend.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    long countByStoryId(Long storyId);
}
