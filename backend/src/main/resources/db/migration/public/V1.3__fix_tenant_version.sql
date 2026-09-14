-- V1.3__fix_tenant_version.sql
-- Ensure all tenants have version set to 0 if null
UPDATE tenant SET version = 0 WHERE version IS NULL;
