package com.leasrecover.modules.tenant;

import com.leasrecover._common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tenant")
@Getter
@Setter
public class Tenant extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    @Column(name = "data_retention_months")
    private Integer dataRetentionMonths;

    @Column(nullable = false)
    private String status = "ACTIVE";
}
