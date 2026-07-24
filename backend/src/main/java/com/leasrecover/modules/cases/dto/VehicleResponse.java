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
