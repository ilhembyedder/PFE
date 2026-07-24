-- V3__add_case_alerts_table.sql
-- Table to persist case deadline and dormancy alerts

CREATE TABLE IF NOT EXISTS case_alert (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    case_id UUID NOT NULL REFERENCES recovery_case(id),
    alert_type VARCHAR(50) NOT NULL, -- 'DEADLINE', 'DORMANCY'
    criticality VARCHAR(50) NOT NULL, -- 'WARNING', 'CRITICAL'
    message TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    version INT NOT NULL DEFAULT 0,
    created_by VARCHAR(255),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_case_alert_tenant_resolved ON case_alert(tenant_id, is_resolved);
CREATE INDEX idx_case_alert_case_id ON case_alert(case_id);
