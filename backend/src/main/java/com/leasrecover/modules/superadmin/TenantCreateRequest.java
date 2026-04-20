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
}
