package com.leasrecover.modules.notification;

import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class AiProgressPayload {
    private UUID caseId;
    private UUID tenantId;
    private String status;
    private String stage;
    private int progress;
    private String message;
    private Object data;

    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }
}
