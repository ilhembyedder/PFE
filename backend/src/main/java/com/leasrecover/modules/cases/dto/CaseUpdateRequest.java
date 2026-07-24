package com.leasrecover.modules.cases.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CaseUpdateRequest {

    @NotBlank(message = "Client full name or company is required")
    private String clientFullName;

    @NotBlank(message = "Contract reference number is required")
    private String contractReferenceNumber;

    @NotNull(message = "Initial residual value is required")
    @Min(value = 0, message = "Initial residual value must be positive")
    private Long initialResidualValueCents;

    @NotBlank(message = "Currency code is required")
    @Size(min = 3, max = 3, message = "Currency code must be exactly 3 characters")
    private String currencyCode;
}
