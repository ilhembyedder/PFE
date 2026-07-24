# Story 2.3: AI Deviation Threshold Strategy

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,  
I want to configure the AI sensitivity deviation thresholds with simple defaults,  
So that the AI indicator reliably marks a difference between standard depreciation (Moderate) and alarming discrepancies (Critical) without over-complicating my setup.

## Acceptance Criteria

1. **Given** a new Tenant is provisioned  
   **When** the `TENANT_CONFIG` is initialized  
   **Then** sensible standard defaults are automatically populated for `ai_deviation_moderate` (e.g., 10%) and `ai_deviation_critical` (e.g., 20%) to avoid blocking onboarding.

2. **Given** my company operates with stricter financial risk policies  
   **When** I edit the moderate and critical percentage thresholds (FR09)  
   **Then** the AI valuation indicator logic (✅ / ⚠️ / 🚨) recalculates case severity thresholds based on these new parameters live for future analysis.

3. **Given** I input invalid threshold values (e.g., negative, > 100%, or moderate >= critical)  
   **When** I attempt to save  
   **Then** the UI displays an immediate inline blocker error preventing invalid threshold configurations (UX-DR6).

## Tasks / Subtasks

- [x] Task 1. Programmatic TenantConfig Defaults Onboarding (AC: #1)
  - [x] Update `TenantProvisioningService.java` to insert a default `TenantConfig` record in the newly migrated tenant schema right after running Flyway.
  - [x] Set default values: `aiDeviationModerate = 10.00`, `aiDeviationCritical = 20.00`, and `dormancyThresholdDays = 30` dynamically using the created `tenantId` (UUID).
- [x] Task 2. Spring Boot Threshold DTOs and API Controller (AC: #2, #3)
  - [x] Add fields `aiDeviationModerate` (BigDecimal) and `aiDeviationCritical` (BigDecimal) to the `TenantConfig.java` entity in `com.leasrecover.modules.tenant`.
  - [x] Create DTOs `ThresholdUpdateRequest.java` and `ThresholdResponse.java` in `com.leasrecover.modules.tenant.dto`.
  - [x] Implement class-level request validation to ensure both thresholds are between `0.00` and `100.00`, and `aiDeviationModerate` is strictly less than `aiDeviationCritical`.
  - [x] Implement endpoints in `TenantConfigController.java` under path `/api/v1/admin/tenant/config/thresholds`:
    - [x] `GET /api/v1/admin/tenant/config/thresholds`: Fetch current thresholds.
    - [x] `PUT /api/v1/admin/tenant/config/thresholds`: Update thresholds.
  - [x] Restrict endpoints to users with the `ADMIN` role.
  - [x] Extract active tenant UUID from `TenantContextHolder.getTenantUuid()` to maintain strict multi-tenant boundary checks.
  - [x] Return JSend envelope responses (`JSendResponse.success(data)`).
- [x] Task 3. Next.js AI Threshold Settings UI (AC: #2, #3)
  - [x] Integrate AI Threshold fields (Moderate % and Critical %) into the Compliance Settings screen at `frontend/src/app/(dashboard)/settings/compliance/page.js` (or as a sub-tab).
  - [x] Add client-side validations: enforce limits between 0% and 100%, and check that `moderate < critical`.
  - [x] Use `InlineBlocker` error patterns (UX-DR6) to display validation errors on-page next to the form fields instead of popup modals.
  - [x] Implement BFF fetch proxy to submit threshold updates to Spring Boot, and display a non-blocking toast `notification.success` on save.
- [x] Task 4. Integration & Unit Testing (AC: #1-3)
  - [x] Write unit tests verifying `TenantProvisioningService` correctly initializes default thresholds.
  - [x] Write unit/integration tests for `TenantConfigController` thresholds endpoint verifying business logic (`moderate < critical` checks, negative values, and role auth).
  - [x] Write frontend E2E/integration tests verifying the setting form inputs, invalid value blocker UI, and successful save behavior.

## Dev Notes

### Technical Requirements
- **Onboarding defaults:** Programmatic insertion of default thresholds is critical to prevent `NullPointerException`s when first loading a newly provisioned tenant's settings.
- **Precision:** Use `BigDecimal` with scaling `(5, 2)` for AI thresholds to match the database `NUMERIC(5, 2)` column precision without floating point inaccuracies.
- **REST Envelopes:** Ensure all API responses use the JSend format. Returns `ResponseEntity<JSendResponse<T>>`.
- **Tenant Context Isolation:** Retrieve the active tenant UUID solely from `TenantContextHolder.getTenantUuid()`.

### File Structure Requirements
- Spring Boot controllers/entities/DTOs: `backend/src/main/java/com/leasrecover/modules/tenant/`
- Spring Boot tests: `backend/src/test/java/com/leasrecover/modules/tenant/`
- Next.js settings views: `frontend/src/app/(dashboard)/settings/compliance/`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L317-L332)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L246-L248)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L4-L16)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- None (all tests passed on the first run without debugging needed).

### Completion Notes List

- Created `ThresholdResponse` and `ThresholdUpdateRequest` DTOs with validation logic.
- Implemented `GET` and `PUT` `/api/v1/admin/tenant/config/thresholds` endpoints in `TenantConfigController`.
- Added unit and integration tests in `TenantConfigControllerTest` verifying successful threshold retrieval, modification, role authorization restriction, and out-of-bounds validation.
- Added Next.js BFF proxy routes in `frontend/src/app/api/admin/tenant/config/thresholds/route.js`.
- Upgraded the compliance settings screen to render threshold inputs, perform client-side validations, display inline blocker warnings, and save the settings concurrently.

### File List

- `backend/src/main/java/com/leasrecover/modules/tenant/dto/ThresholdResponse.java`
- `backend/src/main/java/com/leasrecover/modules/tenant/dto/ThresholdUpdateRequest.java`
- `backend/src/main/java/com/leasrecover/modules/tenant/TenantConfig.java`
- `backend/src/main/java/com/leasrecover/modules/tenant/TenantProvisioningService.java`
- `backend/src/main/java/com/leasrecover/modules/tenant/TenantConfigController.java`
- `backend/src/test/java/com/leasrecover/modules/tenant/TenantProvisioningServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/tenant/TenantConfigControllerTest.java`
- `frontend/jest.config.js`
- `frontend/src/app/api/admin/tenant/config/thresholds/route.js`
- `frontend/src/app/(dashboard)/settings/compliance/page.js`
- `frontend/src/__tests__/compliance.test.js`
