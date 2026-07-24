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
}
