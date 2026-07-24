# Story 5.3: Valuation Comparison & Threshold Engine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the System,  
I want to compare the newly extracted market value against the legally embedded initial residual contract value using the Admin's configured thresholds,  
so that I can formally deduce the financial deviation risk indicator.

## Acceptance Criteria

1. **Given** the FastAPI service successfully returns the extracted `market_value`  
   **When** the Spring Boot service receives it  
   **Then** it natively computes the deviation gap both in absolute `BigInt` value and percentage versus the case's `initial_residual_value_cents` (FR28, FR29).  
   **And** it generates the final reliability indicator (`✅ Reliable`, `⚠️ Moderate Risk`, `🚨 Critical Risk`) dynamically based strictly on the current Admin thresholds stored in the Tenant Config (FR30).

## Tasks / Subtasks

- [x] Task 1. Webhook Processing & Calculation Service (AC: #1, #2)
  - [x] Implement calculation logic in `AIValuationService.java` or `CaseService.java` executed during webhook callbacks:
    - [x] Retrieve `AIValuation` and associated `RecoveryCase`.
    - [x] Retrieve `TenantConfig` mapping matching `TenantContextHolder.getTenantUuid()`.
    - [x] Extract `initialResidualValueCents` from the case, and `marketValueCents` from the FastAPI success payload.
    - [x] **Calculate Deviation Value:**
      - `deviationValueCents = marketValueCents - initialResidualValueCents;` (negative value indicates depreciation/deficit).
    - [x] **Calculate Deviation Percentage:**
      - Handle division by zero check: If `initialResidualValueCents` is zero or null, set percentage to 0.0.
      - `deviationPercentage = (double) Math.abs(deviationValueCents) / initialResidualValueCents * 100.0;`
    - [x] **Determine Reliability Indicator:**
      - Retrieve thresholds: `ai_deviation_moderate` (e.g. 10.0) and `ai_deviation_critical` (e.g. 20.0).
      - If `deviationPercentage < moderate`: Set indicator to `"RELIABLE"`.
      - If `deviationPercentage >= moderate` and `deviationPercentage < critical`: Set indicator to `"MODERATE_RISK"`.
      - If `deviationPercentage >= critical`: Set indicator to `"CRITICAL_RISK"`.
    - [x] **Populate and Persist Entity:**
      - Update the `AIValuation` entity with computed `deviationValueCents`, `deviationPercentage` (as `BigDecimal` mapped to `NUMERIC(5,2)`), and `reliabilityIndicator` string.
      - Set file fields: brand, model, year, mileage, condition, estimated market value, and currency code from the payload.
      - Set `status = 'SUCCESS'` and `processed_at = ZonedDateTime.now()`.
      - Save the entity.

- [x] Task 2. SSE Dispatch Completion Event (AC: #1)
  - [x] After persisting the success state of the valuation:
    - Fire the final SSE event containing the fully calculated DTO to the active client:
      - Payload keys: `caseId`, `status: 'SUCCESS'`, `brand`, `model`, `year`, `marketValueCents`, `deviationValueCents`, `deviationPercentage`, `reliabilityIndicator`.

- [x] Task 3. Unit & Integration Testing (AC: #1, #2)
  - [x] Write unit tests in `AIValuationServiceTest.java` verifying:
    - [x] Correct signed deviation cents and absolute percentage calculation.
    - [x] Dynamic threshold matching boundaries (10.0% vs 20.0% configurations).
    - [x] Division-by-zero resilience handling empty case residual parameters safely.
  - [x] Write webhook integration tests in `CaseControllerTest.java` simulating successful FastAPI callback payloads and asserting that the database record is saved with the correct calculated indicators and the SSE stream finishes.

## Dev Notes

### Technical Requirements
- **Precision Floating Point Safety:** Compute percentages using `double` variables for comparison, but store values in database tables using `BigDecimal` (`NUMERIC(5,2)` in SQL) to avoid database float representation roundings.
- **Transactional Integrity:** Webhook updates to `AIValuation` and `RecoveryCase` updates must commit within a single database transaction block.

### File Structure Requirements
- Spring Boot Service: `backend/src/main/java/com/leasrecover/modules/cases/AIValuationService.java`
- Spring Boot Controller callback: `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L555-L568)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L321-L327)
- Dynamic Config schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L4-L16)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

None.

### Completion Notes List

- Implemented AIValuationService callback logic to compute deviation value, percentage and determine reliability indicator.
- Persisted successfully calculated values to AIValuation database.
- Added dynamic loading of deviation thresholds (ai_deviation_moderate, ai_deviation_critical) from TenantConfig.
- Dispatched final SSE completion payload with calculated DTO to client.
- Wrote AIValuationServiceTest unit tests for math correctness, boundary checks and division by zero resilience.
- Wrote integration tests in CaseControllerTest simulating webhook callback success and verifying correct state updates.

### File List

- `backend/src/main/java/com/leasrecover/modules/cases/AIValuationService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- `backend/src/test/java/com/leasrecover/modules/cases/AIValuationServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java`

### Change Log

- 2026-07-02: Completed Story 5.3 implementation including service calculations, SSE emission, and full test suite verification.
