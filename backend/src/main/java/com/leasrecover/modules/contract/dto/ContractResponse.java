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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getClientRegistrationNumber() { return clientRegistrationNumber; }
    public void setClientRegistrationNumber(String clientRegistrationNumber) { this.clientRegistrationNumber = clientRegistrationNumber; }
    public String getClientContactEmail() { return clientContactEmail; }
    public void setClientContactEmail(String clientContactEmail) { this.clientContactEmail = clientContactEmail; }
    public String getClientContactPhone() { return clientContactPhone; }
    public void setClientContactPhone(String clientContactPhone) { this.clientContactPhone = clientContactPhone; }
    public String getClientAddress() { return clientAddress; }
    public void setClientAddress(String clientAddress) { this.clientAddress = clientAddress; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public ZonedDateTime getStartDate() { return startDate; }
    public void setStartDate(ZonedDateTime startDate) { this.startDate = startDate; }
    public ZonedDateTime getEndDate() { return endDate; }
    public void setEndDate(ZonedDateTime endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public String getVehicleVin() { return vehicleVin; }
    public void setVehicleVin(String vehicleVin) { this.vehicleVin = vehicleVin; }
    public String getVehicleLicensePlate() { return vehicleLicensePlate; }
    public void setVehicleLicensePlate(String vehicleLicensePlate) { this.vehicleLicensePlate = vehicleLicensePlate; }
    public String getVehicleBrand() { return vehicleBrand; }
    public void setVehicleBrand(String vehicleBrand) { this.vehicleBrand = vehicleBrand; }
    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }
    public Integer getVehicleYear() { return vehicleYear; }
    public void setVehicleYear(Integer vehicleYear) { this.vehicleYear = vehicleYear; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

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
