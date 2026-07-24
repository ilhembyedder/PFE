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
}
