package com.leasrecover.modules.cases.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEventResponse {
    private String eventType;
    private ZonedDateTime timestamp;
    private String actor;
    private String description;
}
