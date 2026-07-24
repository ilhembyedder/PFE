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
}
