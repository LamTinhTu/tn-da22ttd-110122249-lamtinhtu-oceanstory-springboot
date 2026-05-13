package com.ocean.backend.dto.admin;

public class TimeSeriesPoint {

    private String date;
    private long value;

    public TimeSeriesPoint() {
    }

    public TimeSeriesPoint(String date, long value) {
        this.date = date;
        this.value = value;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        this.value = value;
    }
}
