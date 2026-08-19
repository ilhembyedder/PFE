package com.leasrecover.modules.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TenantConfigResponse {
    private UUID tenantId;
    private Integer dormancyThresholdDays;
    private Map<String, Integer> phaseLegalDelays;

    public TenantConfigResponse() {}

    public TenantConfigResponse(UUID tenantId, Integer dormancyThresholdDays, Map<String, Integer> phaseLegalDelays) {
        this.tenantId = tenantId;
        this.dormancyThresholdDays = dormancyThresholdDays;
        this.phaseLegalDelays = phaseLegalDelays;
    }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public Integer getDormancyThresholdDays() { return dormancyThresholdDays; }
    public void setDormancyThresholdDays(Integer dormancyThresholdDays) { this.dormancyThresholdDays = dormancyThresholdDays; }
    public Map<String, Integer> getPhaseLegalDelays() { return phaseLegalDelays; }
    public void setPhaseLegalDelays(Map<String, Integer> phaseLegalDelays) { this.phaseLegalDelays = phaseLegalDelays; }
}
