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
}
