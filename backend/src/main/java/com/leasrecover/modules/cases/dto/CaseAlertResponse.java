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
