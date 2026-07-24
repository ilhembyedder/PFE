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
}
