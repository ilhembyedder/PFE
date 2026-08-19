package com.leasrecover.modules.cases;

import com.leasrecover._common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_valuation")
@Getter
@Setter
public class AIValuation extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private RecoveryCase recoveryCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private Document document;

    @Column(name = "extracted_brand")
    private String extractedBrand;

    @Column(name = "extracted_model")
    private String extractedModel;

    @Column(name = "extracted_year")
    private Integer extractedYear;

    @Column(name = "extracted_mileage")
    private Integer extractedMileage;

    @Column(name = "extracted_condition")
    private String extractedCondition;

    @Column(name = "estimated_market_value_cents")
    private Long estimatedMarketValueCents;

    @Column(name = "currency_code")
    private String currencyCode;

    @Column(name = "deviation_value_cents")
    private Long deviationValueCents;

    @Column(name = "deviation_percentage", precision = 5, scale = 2)
    private BigDecimal deviationPercentage;

    @Column(name = "reliability_indicator")
    private String reliabilityIndicator;

    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "processed_at")
    private ZonedDateTime processedAt;

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public RecoveryCase getRecoveryCase() { return recoveryCase; }
    public void setRecoveryCase(RecoveryCase recoveryCase) { this.recoveryCase = recoveryCase; }
    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }
    public String getExtractedBrand() { return extractedBrand; }
    public void setExtractedBrand(String extractedBrand) { this.extractedBrand = extractedBrand; }
    public String getExtractedModel() { return extractedModel; }
    public void setExtractedModel(String extractedModel) { this.extractedModel = extractedModel; }
    public Integer getExtractedYear() { return extractedYear; }
    public void setExtractedYear(Integer extractedYear) { this.extractedYear = extractedYear; }
    public Integer getExtractedMileage() { return extractedMileage; }
    public void setExtractedMileage(Integer extractedMileage) { this.extractedMileage = extractedMileage; }
    public String getExtractedCondition() { return extractedCondition; }
    public void setExtractedCondition(String extractedCondition) { this.extractedCondition = extractedCondition; }
    public Long getEstimatedMarketValueCents() { return estimatedMarketValueCents; }
    public void setEstimatedMarketValueCents(Long estimatedMarketValueCents) { this.estimatedMarketValueCents = estimatedMarketValueCents; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public Long getDeviationValueCents() { return deviationValueCents; }
    public void setDeviationValueCents(Long deviationValueCents) { this.deviationValueCents = deviationValueCents; }
    public BigDecimal getDeviationPercentage() { return deviationPercentage; }
    public void setDeviationPercentage(BigDecimal deviationPercentage) { this.deviationPercentage = deviationPercentage; }
    public String getReliabilityIndicator() { return reliabilityIndicator; }
    public void setReliabilityIndicator(String reliabilityIndicator) { this.reliabilityIndicator = reliabilityIndicator; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public ZonedDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(ZonedDateTime processedAt) { this.processedAt = processedAt; }
}
