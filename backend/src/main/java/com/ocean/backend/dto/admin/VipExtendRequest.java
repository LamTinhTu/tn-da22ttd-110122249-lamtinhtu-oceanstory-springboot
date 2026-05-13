package com.ocean.backend.dto.admin;

import jakarta.validation.constraints.Min;

public class VipExtendRequest {

    @Min(value = 1, message = "Số ngày gia hạn phải >= 1")
    private int days;

    public int getDays() {
        return days;
    }

    public void setDays(int days) {
        this.days = days;
    }
}
