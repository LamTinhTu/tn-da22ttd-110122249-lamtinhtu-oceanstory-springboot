package com.ocean.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;

public class UpdateUserRoleRequest {

    @NotBlank(message = "Vui lòng chọn role")
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
