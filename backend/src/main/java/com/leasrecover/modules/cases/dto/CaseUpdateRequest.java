package com.leasrecover.modules.cases.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("clientFullName")
    @JsonAlias({"clientName", "clientFullName"})
    private String clientFullName;

    @NotBlank(message = "Contract reference number is required")
    @JsonProperty("contractReferenceNumber")
    @JsonAlias({"contractReference", "contractReferenceNumber"})
    private String contractReferenceNumber;

    @NotNull(message = "Initial residual value is required")
    @Min(value = 0, message = "Initial residual value must be positive")
    private Long initialResidualValueCents;

    @NotBlank(message = "Currency code is required")
    @Size(min = 3, max = 3, message = "Currency code must be exactly 3 characters")
    private String currencyCode;

    public String getClientFullName() { return clientFullName; }
    public void setClientFullName(String clientFullName) { this.clientFullName = clientFullName; }
    public String getContractReferenceNumber() { return contractReferenceNumber; }
    public void setContractReferenceNumber(String contractReferenceNumber) { this.contractReferenceNumber = contractReferenceNumber; }
    public Long getInitialResidualValueCents() { return initialResidualValueCents; }
    public void setInitialResidualValueCents(Long initialResidualValueCents) { this.initialResidualValueCents = initialResidualValueCents; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
}
