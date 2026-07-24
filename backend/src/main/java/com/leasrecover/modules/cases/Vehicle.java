package com.leasrecover.modules.cases;

import com.leasrecover._common.entity.BaseEntity;
import com.leasrecover.modules.contract.Contract;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Entity
@Table(name = "vehicle")
@Getter
@Setter
public class Vehicle extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(nullable = false)
    private String vin;

    @Column(name = "license_plate")
    private String licensePlate;

    private String brand;

    private String model;

    private Integer year;
}
