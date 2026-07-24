package com.leasrecover.modules.auth;

import java.io.Serializable;

public class UserPrincipal implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String userId;
    private final String email;
    private final String tenantId;
    private final String role;
    private final String name;

    public UserPrincipal(String userId, String email, String tenantId, String role, String name) {
        this.userId = userId;
        this.email = email;
        this.tenantId = tenantId;
        this.role = role;
        this.name = name;
    }

    public String getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getRole() {
        return role;
    }

    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return "UserPrincipal{" +
                "userId='" + userId + '\'' +
                ", email='" + email + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", role='" + role + '\'' +
                ", name='" + name + '\'' +
                '}';
    }
}
