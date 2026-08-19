package com.leasrecover.modules.superadmin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TenantCreateRequest {

    @NotBlank(message = "Tenant name cannot be blank")
    private String name;

    private String logoUrl;

    @NotNull(message = "Data retention months must be specified")
    private Integer dataRetentionMonths;

    @NotBlank(message = "Admin email cannot be blank")
    @Email(message = "Admin email must be valid")
    private String adminEmail;

    @NotBlank(message = "Admin password cannot be blank")
    private String adminPassword;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public Integer getDataRetentionMonths() { return dataRetentionMonths; }
    public void setDataRetentionMonths(Integer dataRetentionMonths) { this.dataRetentionMonths = dataRetentionMonths; }
    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }
    public String getAdminPassword() { return adminPassword; }
    public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
}
