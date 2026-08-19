package com.leasrecover.modules.cases;

import com.leasrecover._common.entity.BaseEntity;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.contract.Contract;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;
import org.hibernate.envers.AuditOverride;
import org.hibernate.envers.RelationTargetAuditMode;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "recovery_case")
@Getter
@Setter
@Audited
@AuditOverride(forClass = BaseEntity.class, isAudited = false)
public class RecoveryCase extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    private AppUser assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    private Contract contract;

    @Column(name = "initial_residual_value_cents")
    private Long initialResidualValueCents;

    @Column(name = "currency_code", length = 3)
    private String currencyCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase", nullable = false)
    private RecoveryPhase currentPhase;

    @Column(name = "phase_started_at")
    private ZonedDateTime phaseStartedAt;

    @Column(name = "last_action_at")
    private ZonedDateTime lastActionAt;

    @Column(nullable = false)
    private String status = "ACTIVE";

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public AppUser getAssignee() { return assignee; }
    public void setAssignee(AppUser assignee) { this.assignee = assignee; }
    public Contract getContract() { return contract; }
    public void setContract(Contract contract) { this.contract = contract; }
    public Long getInitialResidualValueCents() { return initialResidualValueCents; }
    public void setInitialResidualValueCents(Long initialResidualValueCents) { this.initialResidualValueCents = initialResidualValueCents; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public RecoveryPhase getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(RecoveryPhase currentPhase) { this.currentPhase = currentPhase; }
    public ZonedDateTime getPhaseStartedAt() { return phaseStartedAt; }
    public void setPhaseStartedAt(ZonedDateTime phaseStartedAt) { this.phaseStartedAt = phaseStartedAt; }
    public ZonedDateTime getLastActionAt() { return lastActionAt; }
    public void setLastActionAt(ZonedDateTime lastActionAt) { this.lastActionAt = lastActionAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
