package com.leasrecover.modules.cases.dto;

import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.cases.Vehicle;
import com.leasrecover.modules.cases.RecoveryCase;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class CaseResponse {
    private UUID id;
    private UUID tenantId;
    private ZonedDateTime createdAt;
    private String status;
    private String currentPhase;
    private ZonedDateTime phaseStartedAt;
    private ZonedDateTime lastActionAt;
    private Long initialResidualValueCents;
    private String currencyCode;
    private UUID assigneeId;
    private String assigneeEmail;
    private String assigneeName;
    
    private ClientDto client;
    private ContractDto contract;
    private VehicleDto vehicle;
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }
    public ZonedDateTime getPhaseStartedAt() { return phaseStartedAt; }
    public void setPhaseStartedAt(ZonedDateTime phaseStartedAt) { this.phaseStartedAt = phaseStartedAt; }
    public ZonedDateTime getLastActionAt() { return lastActionAt; }
    public void setLastActionAt(ZonedDateTime lastActionAt) { this.lastActionAt = lastActionAt; }
    public Long getInitialResidualValueCents() { return initialResidualValueCents; }
    public void setInitialResidualValueCents(Long initialResidualValueCents) { this.initialResidualValueCents = initialResidualValueCents; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public UUID getAssigneeId() { return assigneeId; }
    public void setAssigneeId(UUID assigneeId) { this.assigneeId = assigneeId; }
    public String getAssigneeEmail() { return assigneeEmail; }
    public void setAssigneeEmail(String assigneeEmail) { this.assigneeEmail = assigneeEmail; }
    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
    public ClientDto getClient() { return client; }
    public void setClient(ClientDto client) { this.client = client; }
    public ContractDto getContract() { return contract; }
    public void setContract(ContractDto contract) { this.contract = contract; }
    public VehicleDto getVehicle() { return vehicle; }
    public void setVehicle(VehicleDto vehicle) { this.vehicle = vehicle; }

    @Getter
    @Setter
    public static class ClientDto {
        private UUID id;
        private String fullNameOrCompany;
        private String registrationNumber;
        private String contactEmail;
        private String contactPhone;
        private String address;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getFullNameOrCompany() { return fullNameOrCompany; }
        public void setFullNameOrCompany(String fullNameOrCompany) { this.fullNameOrCompany = fullNameOrCompany; }
        public String getRegistrationNumber() { return registrationNumber; }
        public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
        public String getContactEmail() { return contactEmail; }
        public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
        public String getContactPhone() { return contactPhone; }
        public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }

    @Getter
    @Setter
    public static class ContractDto {
        private UUID id;
        private String referenceNumber;
        private ZonedDateTime startDate;
        private ZonedDateTime endDate;
        private String status;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getReferenceNumber() { return referenceNumber; }
        public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
        public ZonedDateTime getStartDate() { return startDate; }
        public void setStartDate(ZonedDateTime startDate) { this.startDate = startDate; }
        public ZonedDateTime getEndDate() { return endDate; }
        public void setEndDate(ZonedDateTime endDate) { this.endDate = endDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    @Getter
    @Setter
    public static class VehicleDto {
        private UUID id;
        private String vin;
        private String licensePlate;
        private String brand;
        private String model;
        private Integer year;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
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
    }

    public static CaseResponse fromEntity(RecoveryCase rcase, Vehicle vehicle) {
        CaseResponse response = new CaseResponse();
        response.setId(rcase.getId());
        response.setTenantId(rcase.getTenantId());
        response.setCreatedAt(rcase.getCreatedAt());
        response.setStatus(rcase.getStatus());
        response.setCurrentPhase(rcase.getCurrentPhase() != null ? rcase.getCurrentPhase().name() : null);
        response.setPhaseStartedAt(rcase.getPhaseStartedAt());
        response.setLastActionAt(rcase.getLastActionAt());
        response.setInitialResidualValueCents(rcase.getInitialResidualValueCents());
        response.setCurrencyCode(rcase.getCurrencyCode());
        if (rcase.getAssignee() != null) {
            response.setAssigneeId(rcase.getAssignee().getId());
            response.setAssigneeEmail(rcase.getAssignee().getEmail());
            String fullName = ((rcase.getAssignee().getFirstName() != null ? rcase.getAssignee().getFirstName() : "") + " " +
                               (rcase.getAssignee().getLastName() != null ? rcase.getAssignee().getLastName() : "")).trim();
            response.setAssigneeName(!fullName.isEmpty() ? fullName : rcase.getAssignee().getEmail());
        }

        if (rcase.getContract() != null) {
            Contract contract = rcase.getContract();
            ContractDto contractDto = new ContractDto();
            contractDto.setId(contract.getId());
            contractDto.setReferenceNumber(contract.getReferenceNumber());
            contractDto.setStartDate(contract.getStartDate());
            contractDto.setEndDate(contract.getEndDate());
            contractDto.setStatus(contract.getStatus());
            response.setContract(contractDto);

            if (contract.getClient() != null) {
                Client client = contract.getClient();
                ClientDto clientDto = new ClientDto();
                clientDto.setId(client.getId());
                clientDto.setFullNameOrCompany(client.getFullNameOrCompany());
                clientDto.setRegistrationNumber(client.getRegistrationNumber());
                clientDto.setContactEmail(client.getContactEmail());
                clientDto.setContactPhone(client.getContactPhone());
                clientDto.setAddress(client.getAddress());
                response.setClient(clientDto);
            }
        }

        if (vehicle != null) {
            VehicleDto vehicleDto = new VehicleDto();
            vehicleDto.setId(vehicle.getId());
            vehicleDto.setVin(vehicle.getVin());
            vehicleDto.setLicensePlate(vehicle.getLicensePlate());
            vehicleDto.setBrand(vehicle.getBrand());
            vehicleDto.setModel(vehicle.getModel());
            vehicleDto.setYear(vehicle.getYear());
            response.setVehicle(vehicleDto);
        }

        return response;
    }
}
