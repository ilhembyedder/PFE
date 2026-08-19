package com.leasrecover.modules.cases.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class PriorityAlertResponse {
    private UUID alertId;
    private UUID caseId;
    private String clientName;
    private String contractReference;
    private String alertType;
    private String criticality;
    private String message;
    private ZonedDateTime createdAt;

    public UUID getAlertId() { return alertId; }
    public void setAlertId(UUID alertId) { this.alertId = alertId; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getContractReference() { return contractReference; }
    public void setContractReference(String contractReference) { this.contractReference = contractReference; }
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
