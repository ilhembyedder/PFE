package com.leasrecover.modules.cases.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;

@Getter
@Setter
public class CaseCreateRequest {
    // Client fields
    @NotBlank(message = "Client full name or company is required")
    private String clientFullName;

    @Pattern(regexp = "^[a-zA-Z0-9]*$", message = "Client registration number must be alphanumeric")
    private String clientRegistrationNumber;

    @Email(message = "Invalid client email format")
    private String clientContactEmail;

    private String clientContactPhone;
    private String clientAddress;

    // Contract fields
    @NotBlank(message = "Contract reference number is required")
    private String contractReferenceNumber;

    @NotNull(message = "Contract start date is required")
    private ZonedDateTime contractStartDate;

    @NotNull(message = "Contract end date is required")
    private ZonedDateTime contractEndDate;

    @NotBlank(message = "Contract status is required")
    private String contractStatus;

    // Vehicle fields
    @NotBlank(message = "Vehicle VIN is required")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Vehicle VIN must be alphanumeric")
    private String vehicleVin;

    @Pattern(regexp = "^[a-zA-Z0-9]*$", message = "Vehicle license plate must be alphanumeric")
    private String vehicleLicensePlate;

    @NotBlank(message = "Vehicle brand is required")
    private String vehicleBrand;

    @NotBlank(message = "Vehicle model is required")
    private String vehicleModel;

    @NotNull(message = "Vehicle year is required")
    @Min(value = 1900, message = "Vehicle year must be valid")
    private Integer vehicleYear;

    // Case fields
    @NotNull(message = "Initial residual value is required")
    @Min(value = 0, message = "Initial residual value must be positive")
    private Long initialResidualValueCents;

    private String currencyCode = "TND";

    public String getClientFullName() { return clientFullName; }
    public void setClientFullName(String clientFullName) { this.clientFullName = clientFullName; }
    public String getClientRegistrationNumber() { return clientRegistrationNumber; }
    public void setClientRegistrationNumber(String clientRegistrationNumber) { this.clientRegistrationNumber = clientRegistrationNumber; }
    public String getClientContactEmail() { return clientContactEmail; }
    public void setClientContactEmail(String clientContactEmail) { this.clientContactEmail = clientContactEmail; }
    public String getClientContactPhone() { return clientContactPhone; }
    public void setClientContactPhone(String clientContactPhone) { this.clientContactPhone = clientContactPhone; }
    public String getClientAddress() { return clientAddress; }
    public void setClientAddress(String clientAddress) { this.clientAddress = clientAddress; }
    public String getContractReferenceNumber() { return contractReferenceNumber; }
    public void setContractReferenceNumber(String contractReferenceNumber) { this.contractReferenceNumber = contractReferenceNumber; }
    public ZonedDateTime getContractStartDate() { return contractStartDate; }
    public void setContractStartDate(ZonedDateTime contractStartDate) { this.contractStartDate = contractStartDate; }
    public ZonedDateTime getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(ZonedDateTime contractEndDate) { this.contractEndDate = contractEndDate; }
    public String getContractStatus() { return contractStatus; }
    public void setContractStatus(String contractStatus) { this.contractStatus = contractStatus; }
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
    public Long getInitialResidualValueCents() { return initialResidualValueCents; }
    public void setInitialResidualValueCents(Long initialResidualValueCents) { this.initialResidualValueCents = initialResidualValueCents; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
}
