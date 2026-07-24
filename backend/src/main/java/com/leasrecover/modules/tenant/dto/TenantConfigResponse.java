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
}
