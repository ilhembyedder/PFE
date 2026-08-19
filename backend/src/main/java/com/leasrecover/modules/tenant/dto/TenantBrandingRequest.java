package com.leasrecover.modules.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TenantBrandingRequest {

    @NotBlank(message = "Le nom ne peut pas être vide")
    private String name;

    @NotBlank(message = "L'URL du logo ne peut pas être vide")
    @URL(message = "L'URL du logo doit être valide")
    private String logoUrl;

    public TenantBrandingRequest() {}

    public TenantBrandingRequest(String name, String logoUrl) {
        this.name = name;
        this.logoUrl = logoUrl;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
}
