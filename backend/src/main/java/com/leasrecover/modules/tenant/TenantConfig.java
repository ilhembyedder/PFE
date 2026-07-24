package com.leasrecover.modules.tenant;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tenant_config")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class TenantConfig {

    @Id
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "ai_deviation_moderate")
    private BigDecimal aiDeviationModerate;

    @Column(name = "ai_deviation_critical")
    private BigDecimal aiDeviationCritical;

    @Column(name = "dormancy_threshold_days")
    private Integer dormancyThresholdDays;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "phase_legal_delays")
    private Map<String, Integer> phaseLegalDelays;

    @Version
    @Column(nullable = false)
    private Integer version = 0;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private ZonedDateTime deletedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
}
