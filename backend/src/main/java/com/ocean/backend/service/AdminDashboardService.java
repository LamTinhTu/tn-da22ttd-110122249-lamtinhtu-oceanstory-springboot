package com.ocean.backend.service;

import com.ocean.backend.dto.admin.DashboardSummaryResponse;
import com.ocean.backend.dto.admin.StatusCount;
import com.ocean.backend.dto.admin.TimeSeriesPoint;
import com.ocean.backend.entity.ChapterModerationStatus;
import com.ocean.backend.entity.StoryModerationStatus;
import com.ocean.backend.repository.ChapterRepository;
import com.ocean.backend.repository.CommentRepository;
import com.ocean.backend.repository.ReadingHistoryRepository;
import com.ocean.backend.repository.StoryRepository;
import com.ocean.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final StoryRepository storyRepository;
    private final ChapterRepository chapterRepository;
    private final CommentRepository commentRepository;
    private final ReadingHistoryRepository readingHistoryRepository;

    public AdminDashboardService(UserRepository userRepository,
                                StoryRepository storyRepository,
                                ChapterRepository chapterRepository,
                                CommentRepository commentRepository,
                                ReadingHistoryRepository readingHistoryRepository) {
        this.userRepository = userRepository;
        this.storyRepository = storyRepository;
        this.chapterRepository = chapterRepository;
        this.commentRepository = commentRepository;
        this.readingHistoryRepository = readingHistoryRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(int days) {
        int safeDays = Math.max(7, Math.min(days, 365));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = now.minusDays(safeDays);

        DashboardSummaryResponse res = new DashboardSummaryResponse();
        res.setTotalUsers(userRepository.countByDeletedAtIsNull());
        res.setTotalStories(storyRepository.countByDeletedAtIsNull());
        res.setTotalChapters(chapterRepository.countByDeletedAtIsNull());
        res.setTotalReads(chapterRepository.sumViews());
        res.setTotalComments(commentRepository.countActive());
        res.setPendingStories(storyRepository.countByStatusAndDeletedAtIsNull(StoryModerationStatus.PENDING));
        res.setPendingChapters(chapterRepository.countByModerationStatusAndDeletedAtIsNull(ChapterModerationStatus.PENDING));
        res.setVipUsers(userRepository.countActiveVip(now));

        List<StatusCount> storyByStatus = new ArrayList<>();
        for (StoryModerationStatus st : StoryModerationStatus.values()) {
            long c = storyRepository.countByStatusAndDeletedAtIsNull(st);
            storyByStatus.add(new StatusCount(st.name(), c));
        }
        res.setStoryByStatus(storyByStatus);

        res.setUserGrowth(toSeries(userRepository.countUserGrowthPerDay(from)));
        res.setStoryGrowth(toSeries(storyRepository.countStoryCreatedPerDay(from, false)));
        res.setTraffic(toSeries(readingHistoryRepository.countReadsPerDay(from)));

        return res;
    }

    private List<TimeSeriesPoint> toSeries(List<Object[]> rows) {
        if (rows == null) {
            return List.of();
        }
        List<TimeSeriesPoint> points = new ArrayList<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2) {
                continue;
            }
            String date = String.valueOf(row[0]);
            long value = row[1] == null ? 0 : ((Number) row[1]).longValue();
            // Normalize date to yyyy-MM-dd if possible.
            if (date != null && date.contains("T")) {
                date = date.substring(0, date.indexOf('T'));
            }
            points.add(new TimeSeriesPoint(date, value));
        }
        return points;
    }
}
