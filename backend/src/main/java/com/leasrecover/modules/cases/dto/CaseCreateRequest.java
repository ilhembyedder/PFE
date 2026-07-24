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
}
