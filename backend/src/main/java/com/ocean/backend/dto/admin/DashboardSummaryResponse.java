package com.ocean.backend.dto.admin;

import java.util.List;

public class DashboardSummaryResponse {

    private long totalUsers;
    private long totalStories;
    private long totalChapters;
    private long totalReads;
    private long totalComments;
    private long pendingStories;
    private long pendingChapters;
    private long vipUsers;

    private List<StatusCount> storyByStatus;
    private List<TimeSeriesPoint> userGrowth;
    private List<TimeSeriesPoint> storyGrowth;
    private List<TimeSeriesPoint> traffic;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalStories() {
        return totalStories;
    }

    public void setTotalStories(long totalStories) {
        this.totalStories = totalStories;
    }

    public long getTotalChapters() {
        return totalChapters;
    }

    public void setTotalChapters(long totalChapters) {
        this.totalChapters = totalChapters;
    }

    public long getTotalReads() {
        return totalReads;
    }

    public void setTotalReads(long totalReads) {
        this.totalReads = totalReads;
    }

    public long getTotalComments() {
        return totalComments;
    }

    public void setTotalComments(long totalComments) {
        this.totalComments = totalComments;
    }

    public long getPendingStories() {
        return pendingStories;
    }

    public void setPendingStories(long pendingStories) {
        this.pendingStories = pendingStories;
    }

    public long getPendingChapters() {
        return pendingChapters;
    }

    public void setPendingChapters(long pendingChapters) {
        this.pendingChapters = pendingChapters;
    }

    public long getVipUsers() {
        return vipUsers;
    }

    public void setVipUsers(long vipUsers) {
        this.vipUsers = vipUsers;
    }

    public List<StatusCount> getStoryByStatus() {
        return storyByStatus;
    }

    public void setStoryByStatus(List<StatusCount> storyByStatus) {
        this.storyByStatus = storyByStatus;
    }

    public List<TimeSeriesPoint> getUserGrowth() {
        return userGrowth;
    }

    public void setUserGrowth(List<TimeSeriesPoint> userGrowth) {
        this.userGrowth = userGrowth;
    }

    public List<TimeSeriesPoint> getStoryGrowth() {
        return storyGrowth;
    }

    public void setStoryGrowth(List<TimeSeriesPoint> storyGrowth) {
        this.storyGrowth = storyGrowth;
    }

    public List<TimeSeriesPoint> getTraffic() {
        return traffic;
    }

    public void setTraffic(List<TimeSeriesPoint> traffic) {
        this.traffic = traffic;
    }
}
