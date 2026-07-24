package com.leasrecover.modules.users.dto;

import com.leasrecover.modules.users.AppUser;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class UserResponse {

    private UUID id;
    private UUID tenantId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String status;
    private ZonedDateTime lastLogin;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public static UserResponse fromUser(AppUser user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setTenantId(user.getTenantId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole());
        response.setStatus(user.getStatus());
        response.setLastLogin(user.getLastLogin());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
