# Story 4.3: Proactive Deadline & Dormancy Alerts Engine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want the system to automatically trigger alerts when legal deadlines approach or a case becomes dormant,  
so that I am aware of critical actions required without having to manually check calendar dates.

## Acceptance Criteria

1. **Given** the Admin has configured phase-specific legal timelines and dormancy periods  
   **When** a case approaches the configured legal expiration or exceeds the dormancy threshold (FR10/FR21)  
   **Then** a background worker process automatically flags the dossier with an active Alert State (FR20, FR21).  
   **And** the UI will be able to render this state (to be consumed by the Dashboard commands).

## Tasks / Subtasks

- [x] Task 1. Database Schema Migration for Alerts (AC: #1)
  - [x] Create a new Flyway migration script `V3__add_case_alerts_table.sql` in `backend/src/main/resources/db/migration/tenant/`:
    ```sql
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
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_case_alert_tenant_resolved ON case_alert(tenant_id, is_resolved);
    CREATE INDEX idx_case_alert_case_id ON case_alert(case_id);
    ```

- [x] Task 2. Scaffolding Spring Boot Alert Entity & Repository (AC: #1)
  - [x] Implement `CaseAlert.java` under `com.leasrecover.modules.cases` extending `BaseEntity`:
    - Fields: `tenantId` (UUID), `caseId` (UUID), `alertType` (String/Enum), `criticality` (String/Enum), `message` (String), `isResolved` (Boolean), `resolvedAt` (ZonedDateTime).
  - [x] Implement `CaseAlertRepository.java` extending `JpaRepository` supporting queries like `findAllByTenantIdAndIsResolvedFalse`.

- [x] Task 3. Spring Scheduler Background Worker (AC: #1)
  - [x] Create `AlertEngineScheduler.java` under `com.leasrecover.modules.cases` annotated with `@Component` and `@EnableScheduling`:
    - [x] Implement a scheduled method `processAlerts()` (e.g. running daily `@Scheduled(cron = "0 0 2 * * *")` or configurable interval):
      - [x] Loop through all active tenants (retrieved from `TenantRepository`).
      - [x] Bind context to each tenant's schema dynamically using `TenantContextHolder.setTenantId(schemaName)` and `TenantContextHolder.setTenantUuid(tenantId)`.
      - [x] Fetch all active `RecoveryCase` records.
      - [x] Load the `TenantConfig` mapping for legal delays and dormancy threshold days.
      - [x] **Dormancy Check:** Compare `ZonedDateTime.now()` minus `case.last_action_at` against `dormancy_threshold_days`. If it exceeds, create or update a `DORMANCY` alert with `criticality = 'CRITICAL'`.
      - [x] **Deadline Check:** Fetch the legal delay limit for `case.currentPhase` from `phase_legal_delays` JSONB map. Compare `ZonedDateTime.now()` minus `case.phase_started_at` against the limit:
        - [x] If within 2 days of expiration: Create/update a `DEADLINE` alert with `criticality = 'WARNING'`.
        - [x] If expired: Create/update a `DEADLINE` alert with `criticality = 'CRITICAL'`.
      - [x] Cleanly insert new alerts, resolve old ones that are no longer matching conditions, and commit.
      - [x] Ensure a `finally` block cleans up `TenantContextHolder`.

- [x] Task 4. REST APIs for Alert Exposure (AC: #1)
  - [x] Implement controller endpoints in `CaseController.java`:
    - [x] `GET /api/v1/cases/alerts` -> Fetches all unresolved alerts for the current tenant.
    - [x] `GET /api/v1/cases/{id}/alerts` -> Fetches unresolved alerts for a specific recovery case.
    - [x] Enforce JSend success envelope formatting on outputs.

- [x] Task 5. Unit & Integration Testing (AC: #1)
  - [x] Write unit tests for alert calculation logic in `AlertEngineServiceTest.java` verifying boundary dates correctly trigger warnings vs critical alerts.
  - [x] Write integration tests for `AlertEngineScheduler` verifying it runs across multiple tenant schemas and writes records into `case_alert` tables successfully.

## Dev Notes

### Technical Requirements
- **Tenant Context Switching:** Schedulers run outside the HTTP request filter chain. Schedulers must manually configure and clear `TenantContextHolder` context boundaries to ensure Flyway data routing maps to correct database schemas.
- **Transactional Schedule Execution:** Ensure each tenant's scanning routine runs in its own transaction context. If one tenant's execution fails, other tenants' alert updates must process successfully.
- **JSONB Parsing:** Parse `phase_legal_delays` JSONB securely using Jackson `ObjectMapper` mapping to a map (`Map<String, Integer>`) representing phase name to number of days.

### File Structure Requirements
- Spring Boot Scheduler: `backend/src/main/java/com/leasrecover/modules/cases/AlertEngineScheduler.java`
- Spring Boot Entity: `backend/src/main/java/com/leasrecover/modules/cases/CaseAlert.java`
- Database schema: `backend/src/main/resources/db/migration/tenant/V3__add_case_alerts_table.sql`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L496-L509)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L247)
- Configuration config: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L4-L16)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References
- Backend Maven tests run: 110/110 successful (BUILD SUCCESS).

### Completion Notes List
- Created database migration script `V3__add_case_alerts_table.sql` for case deadline and dormancy alerts.
- Designed JPA Entity `CaseAlert.java` extending `BaseEntity` with `tenantId`, `caseId`, `alertType`, `criticality`, `message`, `isResolved`, and `resolvedAt` fields.
- Scaffolded `CaseAlertRepository.java` to support querying unresolved alerts by tenant or case.
- Implemented `AlertEngineService.java` to execute alert logic: dormancy threshold check (`DORMANCY` alert with `CRITICAL` criticality) and legal deadline expiration check (`DEADLINE` alert with `WARNING` criticality if within 2 days, and `CRITICAL` if expired), cleaning and resolving old alerts.
- Developed Spring Scheduler Background Worker `AlertEngineScheduler.java` executing periodically across all active tenants, dynamically binding context to each tenant's schema context via `TenantContextHolder` and executing the alerts scan.
- Implemented DTO `CaseAlertResponse.java` for clean JSON serialization of case alerts.
- Added service methods in `CaseService.java` to fetch unresolved alerts globally or for a specific case, and exposed them via REST endpoints `/api/v1/cases/alerts` and `/api/v1/cases/{id}/alerts` in `CaseController.java` with JSend envelope formatting.
- Authored comprehensive JUnit 5 unit tests for alert logic in `AlertEngineServiceTest.java` and scheduler execution context switching in `AlertEngineSchedulerTest.java`.

### File List
- `backend/src/main/resources/db/migration/tenant/V3__add_case_alerts_table.sql`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseAlert.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseAlertRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/AlertEngineService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/AlertEngineScheduler.java`
- `backend/src/main/java/com/leasrecover/modules/cases/dto/CaseAlertResponse.java`
- `backend/src/test/java/com/leasrecover/modules/cases/AlertEngineServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/AlertEngineSchedulerTest.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`

## Senior Developer Review (AI)

- **Reviewer:** IlhemBENYEDDER (via AI)
- **Date:** 2026-07-01
- **Status:** APPROVED (Fixes Applied)

### Findings & Fixes
- **[HIGH] Soft-deleted or inactive cases do not have their active alerts resolved by the Alert Engine background process**
  - **Issue:** The scheduler bypassed alert resolution for cases that were soft-deleted or closed (non-active).
  - **Fix:** Updated `AlertEngineService.processAlertsForTenant` to resolve outstanding `DORMANCY` and `DEADLINE` alerts for cases belonging to the tenant that are soft-deleted or inactive before skipping alert generation.
  - **Tests Added:** Added `testProcessAlerts_CaseInactive_ResolvesAlerts` and `testProcessAlerts_CaseDeleted_ResolvesAlerts` to `AlertEngineServiceTest.java`.
