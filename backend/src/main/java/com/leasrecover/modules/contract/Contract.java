package com.leasrecover.modules.contract;

import com.leasrecover._common.entity.BaseEntity;
import com.leasrecover.modules.client.Client;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract")
@Getter
@Setter
public class Contract extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(name = "reference_number", nullable = false)
    private String referenceNumber;

    @Column(name = "start_date")
    private ZonedDateTime startDate;

    @Column(name = "end_date")
    private ZonedDateTime endDate;

    @Column(nullable = false)
    private String status;
}
