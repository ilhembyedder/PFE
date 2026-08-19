package com.leasrecover.modules.tenant.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {
    private UUID id;
    private String name;
    private String logoUrl;
    private String status;

    public TenantResponse() {}

    public TenantResponse(UUID id, String name, String logoUrl, String status) {
        this.id = id;
        this.name = name;
        this.logoUrl = logoUrl;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
