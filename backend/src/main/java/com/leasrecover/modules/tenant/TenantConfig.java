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

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public BigDecimal getAiDeviationModerate() { return aiDeviationModerate; }
    public void setAiDeviationModerate(BigDecimal aiDeviationModerate) { this.aiDeviationModerate = aiDeviationModerate; }
    public BigDecimal getAiDeviationCritical() { return aiDeviationCritical; }
    public void setAiDeviationCritical(BigDecimal aiDeviationCritical) { this.aiDeviationCritical = aiDeviationCritical; }
    public Integer getDormancyThresholdDays() { return dormancyThresholdDays; }
    public void setDormancyThresholdDays(Integer dormancyThresholdDays) { this.dormancyThresholdDays = dormancyThresholdDays; }
    public Map<String, Integer> getPhaseLegalDelays() { return phaseLegalDelays; }
    public void setPhaseLegalDelays(Map<String, Integer> phaseLegalDelays) { this.phaseLegalDelays = phaseLegalDelays; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
    public ZonedDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(ZonedDateTime deletedAt) { this.deletedAt = deletedAt; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
}
