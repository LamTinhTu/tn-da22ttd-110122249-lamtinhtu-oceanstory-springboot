package com.ocean.backend.repository;

import com.ocean.backend.entity.ReadingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReadingHistoryRepository extends JpaRepository<ReadingHistory, Long> {

    @Query("""
        select cast(r.createdAt as date), count(r)
        from ReadingHistory r
        where r.createdAt >= :from
        group by cast(r.createdAt as date)
        order by cast(r.createdAt as date)
        """)
    List<Object[]> countReadsPerDay(java.time.LocalDateTime from);

    long countByCreatedAtIsNotNull();
}
