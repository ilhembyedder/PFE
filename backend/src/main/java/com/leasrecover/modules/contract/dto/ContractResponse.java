package com.leasrecover.modules.contract.dto;

import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.cases.Vehicle;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class ContractResponse {
    private UUID id;
    private UUID tenantId;
    private UUID clientId;
    private String clientName;
    private String clientRegistrationNumber;
    private String clientContactEmail;
    private String clientContactPhone;
    private String clientAddress;
    
    private String referenceNumber;
    private ZonedDateTime startDate;
    private ZonedDateTime endDate;
    private String status;
    
    private UUID vehicleId;
    private String vehicleVin;
    private String vehicleLicensePlate;
    private String vehicleBrand;
    private String vehicleModel;
    private Integer vehicleYear;
    
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public static ContractResponse fromEntity(Contract contract) {
        return fromEntity(contract, null);
    }

    public static ContractResponse fromEntity(Contract contract, Vehicle vehicle) {
        if (contract == null) return null;
        ContractResponse response = new ContractResponse();
        response.setId(contract.getId());
        response.setTenantId(contract.getTenantId());
        if (contract.getClient() != null) {
            response.setClientId(contract.getClient().getId());
            response.setClientName(contract.getClient().getFullNameOrCompany());
            response.setClientRegistrationNumber(contract.getClient().getRegistrationNumber());
            response.setClientContactEmail(contract.getClient().getContactEmail());
            response.setClientContactPhone(contract.getClient().getContactPhone());
            response.setClientAddress(contract.getClient().getAddress());
        }
        response.setReferenceNumber(contract.getReferenceNumber());
        response.setStartDate(contract.getStartDate());
        response.setEndDate(contract.getEndDate());
        response.setStatus(contract.getStatus());
        
        if (vehicle != null) {
            response.setVehicleId(vehicle.getId());
            response.setVehicleVin(vehicle.getVin());
            response.setVehicleLicensePlate(vehicle.getLicensePlate());
            response.setVehicleBrand(vehicle.getBrand());
            response.setVehicleModel(vehicle.getModel());
            response.setVehicleYear(vehicle.getYear());
        }
        
        response.setCreatedAt(contract.getCreatedAt());
        response.setUpdatedAt(contract.getUpdatedAt());
        return response;
    }
}
