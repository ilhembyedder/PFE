package com.leasrecover.modules.cases.dto;

import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class CaseValuationResponse {
    private UUID caseId;
    private Long marketValueCents;
    private Long initialResidualValueCents;
    private Long deviationValueCents;
    private BigDecimal deviationPercentage;
    private String reliabilityIndicator;
    private String currencyCode;
}
