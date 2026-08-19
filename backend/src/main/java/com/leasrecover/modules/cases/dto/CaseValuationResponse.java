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

    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public Long getMarketValueCents() { return marketValueCents; }
    public void setMarketValueCents(Long marketValueCents) { this.marketValueCents = marketValueCents; }
    public Long getInitialResidualValueCents() { return initialResidualValueCents; }
    public void setInitialResidualValueCents(Long initialResidualValueCents) { this.initialResidualValueCents = initialResidualValueCents; }
    public Long getDeviationValueCents() { return deviationValueCents; }
    public void setDeviationValueCents(Long deviationValueCents) { this.deviationValueCents = deviationValueCents; }
    public BigDecimal getDeviationPercentage() { return deviationPercentage; }
    public void setDeviationPercentage(BigDecimal deviationPercentage) { this.deviationPercentage = deviationPercentage; }
    public String getReliabilityIndicator() { return reliabilityIndicator; }
    public void setReliabilityIndicator(String reliabilityIndicator) { this.reliabilityIndicator = reliabilityIndicator; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
}
