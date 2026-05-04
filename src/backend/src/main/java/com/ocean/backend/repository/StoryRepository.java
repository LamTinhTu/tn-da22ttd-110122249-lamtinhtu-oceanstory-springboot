package com.ocean.backend.repository;

import com.ocean.backend.entity.Story;
import com.ocean.backend.entity.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {

    boolean existsByIdAndUserId(Long id, Long userId);

    List<Story> findTop12ByOrderByUpdatedAtDesc();

    List<Story> findTop12ByOrderByCreatedAtDesc();

    @Query(value = "select * from stories order by random() limit 12", nativeQuery = true)
    List<Story> findTop12Recommended();

    List<Story> findTop12ByCategoryIgnoreCaseOrderByUpdatedAtDesc(String category);

    @Query("""
            select s from Story s
            where lower(s.title) like lower(concat('%', :keyword, '%'))
               or lower(s.user.username) like lower(concat('%', :keyword, '%'))
            order by s.updatedAt desc
            """)
    List<Story> searchByKeyword(String keyword);

    List<Story> findBySubmissionStatus(SubmissionStatus submissionStatus);
}
