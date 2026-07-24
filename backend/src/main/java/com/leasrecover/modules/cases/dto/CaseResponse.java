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
    
    private ClientDto client;
    private ContractDto contract;
    private VehicleDto vehicle;

    @Getter
    @Setter
    public static class ClientDto {
        private UUID id;
        private String fullNameOrCompany;
        private String registrationNumber;
        private String contactEmail;
        private String contactPhone;
        private String address;
    }

    @Getter
    @Setter
    public static class ContractDto {
        private UUID id;
        private String referenceNumber;
        private ZonedDateTime startDate;
        private ZonedDateTime endDate;
        private String status;
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
