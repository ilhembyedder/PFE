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

    public CasePrerequisitesResponse() {}

    public CasePrerequisitesResponse(String nextPhase, boolean isBlocked, List<String> missingPrerequisites) {
        this.nextPhase = nextPhase;
        this.isBlocked = isBlocked;
        this.missingPrerequisites = missingPrerequisites;
    }

    public String getNextPhase() { return nextPhase; }
    public void setNextPhase(String nextPhase) { this.nextPhase = nextPhase; }
    public boolean isBlocked() { return isBlocked; }
    public void setBlocked(boolean isBlocked) { this.isBlocked = isBlocked; }
    public List<String> getMissingPrerequisites() { return missingPrerequisites; }
    public void setMissingPrerequisites(List<String> missingPrerequisites) { this.missingPrerequisites = missingPrerequisites; }
}
