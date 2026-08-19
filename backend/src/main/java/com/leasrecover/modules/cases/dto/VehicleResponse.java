package com.leasrecover.modules.cases.dto;

import com.leasrecover.modules.cases.Vehicle;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class VehicleResponse {
    private UUID id;
    private UUID tenantId;
    private UUID contractId;
    private String vin;
    private String licensePlate;
    private String brand;
    private String model;
    private Integer year;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getContractId() { return contractId; }
    public void setContractId(UUID contractId) { this.contractId = contractId; }
    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }
    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static VehicleResponse fromEntity(Vehicle vehicle) {
        if (vehicle == null) return null;
        VehicleResponse response = new VehicleResponse();
        response.setId(vehicle.getId());
        response.setTenantId(vehicle.getTenantId());
        if (vehicle.getContract() != null) {
            response.setContractId(vehicle.getContract().getId());
        }
        response.setVin(vehicle.getVin());
        response.setLicensePlate(vehicle.getLicensePlate());
        response.setBrand(vehicle.getBrand());
        response.setModel(vehicle.getModel());
        response.setYear(vehicle.getYear());
        response.setCreatedAt(vehicle.getCreatedAt());
        response.setUpdatedAt(vehicle.getUpdatedAt());
        return response;
    }
}
