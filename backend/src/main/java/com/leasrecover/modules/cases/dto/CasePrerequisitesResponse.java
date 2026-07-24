package com.leasrecover.modules.cases.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CasePrerequisitesResponse {
    private String nextPhase;
    private boolean isBlocked;
    private List<String> missingPrerequisites;
}
