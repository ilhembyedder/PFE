package com.leasrecover.modules.cases.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class CaseListResponse {
    private UUID id;
    private String clientName;
    private String contractReference;
    private String currentPhase;
    private String assigneeName;
    private String reliabilityIndicator;
    private ZonedDateTime lastActionAt;
    private ZonedDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getContractReference() { return contractReference; }
    public void setContractReference(String contractReference) { this.contractReference = contractReference; }
    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }
    public String getAssigneeName() { return assigneeName; }
    public void setAssigneeName(String assigneeName) { this.assigneeName = assigneeName; }
    public String getReliabilityIndicator() { return reliabilityIndicator; }
    public void setReliabilityIndicator(String reliabilityIndicator) { this.reliabilityIndicator = reliabilityIndicator; }
    public ZonedDateTime getLastActionAt() { return lastActionAt; }
    public void setLastActionAt(ZonedDateTime lastActionAt) { this.lastActionAt = lastActionAt; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
}
