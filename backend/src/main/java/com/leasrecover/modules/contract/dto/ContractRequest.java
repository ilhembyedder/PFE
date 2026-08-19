package com.leasrecover.modules.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class ContractRequest {

    @NotNull(message = "L'identifiant du client est obligatoire.")
    private UUID clientId;

    @NotBlank(message = "La référence du contrat est obligatoire.")
    private String referenceNumber;

    private ZonedDateTime startDate;
    private ZonedDateTime endDate;

    @NotBlank(message = "Le statut du contrat est obligatoire.")
    private String status;

    public UUID getClientId() { return clientId; }
    public void setClientId(UUID clientId) { this.clientId = clientId; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public ZonedDateTime getStartDate() { return startDate; }
    public void setStartDate(ZonedDateTime startDate) { this.startDate = startDate; }
    public ZonedDateTime getEndDate() { return endDate; }
    public void setEndDate(ZonedDateTime endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
