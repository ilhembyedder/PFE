package com.leasrecover.modules.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ThresholdResponse {
    private UUID tenantId;
    private BigDecimal aiDeviationModerate;
    private BigDecimal aiDeviationCritical;

    public ThresholdResponse() {}

    public ThresholdResponse(UUID tenantId, BigDecimal aiDeviationModerate, BigDecimal aiDeviationCritical) {
        this.tenantId = tenantId;
        this.aiDeviationModerate = aiDeviationModerate;
        this.aiDeviationCritical = aiDeviationCritical;
    }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public BigDecimal getAiDeviationModerate() { return aiDeviationModerate; }
    public void setAiDeviationModerate(BigDecimal aiDeviationModerate) { this.aiDeviationModerate = aiDeviationModerate; }
    public BigDecimal getAiDeviationCritical() { return aiDeviationCritical; }
    public void setAiDeviationCritical(BigDecimal aiDeviationCritical) { this.aiDeviationCritical = aiDeviationCritical; }
}
