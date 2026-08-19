package com.leasrecover.modules.tenant;

import com.leasrecover._common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tenant", schema = "public")
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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public Integer getDataRetentionMonths() { return dataRetentionMonths; }
    public void setDataRetentionMonths(Integer dataRetentionMonths) { this.dataRetentionMonths = dataRetentionMonths; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
