package com.leasrecover.modules.cases.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class AssignCaseRequest {

    @NotNull(message = "Assignee ID is required")
    private UUID assigneeId;

    public UUID getAssigneeId() { return assigneeId; }
    public void setAssigneeId(UUID assigneeId) { this.assigneeId = assigneeId; }
}
