package com.leasrecover.modules.cases.dto;

import com.leasrecover.modules.cases.CaseAlert;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class CaseAlertResponse {
    private UUID id;
    private UUID caseId;
    private String alertType;
    private String criticality;
    private String message;
    private Boolean isResolved;
    private ZonedDateTime resolvedAt;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }
    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Boolean getIsResolved() { return isResolved; }
    public void setIsResolved(Boolean isResolved) { this.isResolved = isResolved; }
    public ZonedDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(ZonedDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static CaseAlertResponse fromEntity(CaseAlert alert) {
        CaseAlertResponse response = new CaseAlertResponse();
        response.setId(alert.getId());
        response.setCaseId(alert.getCaseId());
        response.setAlertType(alert.getAlertType());
        response.setCriticality(alert.getCriticality());
        response.setMessage(alert.getMessage());
        response.setIsResolved(alert.getIsResolved());
        response.setResolvedAt(alert.getResolvedAt());
        response.setCreatedAt(alert.getCreatedAt());
        response.setUpdatedAt(alert.getUpdatedAt());
        return response;
    }
}
