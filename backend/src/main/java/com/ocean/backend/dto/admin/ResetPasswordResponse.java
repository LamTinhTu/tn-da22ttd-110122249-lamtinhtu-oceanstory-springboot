package com.ocean.backend.dto.admin;

public class ResetPasswordResponse {

    private String tempPassword;

    public ResetPasswordResponse() {
    }

    public ResetPasswordResponse(String tempPassword) {
        this.tempPassword = tempPassword;
    }

    public String getTempPassword() {
        return tempPassword;
    }

    public void setTempPassword(String tempPassword) {
        this.tempPassword = tempPassword;
    }
}
