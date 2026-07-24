package com.leasrecover.modules.cases;

import com.leasrecover._common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "case_alert")
@Getter
@Setter
public class CaseAlert extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "alert_type", nullable = false)
    private String alertType; // 'DEADLINE', 'DORMANCY'

    @Column(name = "criticality", nullable = false)
    private String criticality; // 'WARNING', 'CRITICAL'

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @Column(name = "resolved_at")
    private ZonedDateTime resolvedAt;
}
