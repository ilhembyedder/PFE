# Story 6.4: Autonomous Alert Healing & State Persistence

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the System,  
I want to automatically dismiss alerts only when the required action has specifically been satisfied, and persist them faithfully across the user's sessions otherwise,  
so that the alert feed acts as an uncompromised source of truth for pending compliance tasks.

## Acceptance Criteria

1. **Given** an alert exists on a dossier  
   **When** the user completes the expected action (e.g., transitions the phase or uploads the missing document)  
   **Then** the backend automatically clears the alert state natively—no manual 'Dismiss' button is required (FR36).

2. **Given** a user has pending alerts and logs out  
   **When** the user logs back in three days later  
   **Then** the alerts remain perfectly active and visible, recalculating their urgency appropriately upon session creation (FR37).

## Tasks / Subtasks

- [x] Task 1. Spring Boot Alert Healing Service Hooks (AC: #1)
  - [x] Implement healing methods in `CaseAlertService.java`:
    - [x] `resolveDormancyAlert(UUID caseId)`: Query the database for active (`isResolved = false`) dormancy alerts associated with the case ID. If any exist, set `isResolved = true` and `resolvedAt = ZonedDateTime.now()`. Save.
    - [x] `resolveDeadlineAlert(UUID caseId)`: Query the database for active (`isResolved = false`) deadline alerts associated with the case ID. If any exist, set `isResolved = true` and `resolvedAt = ZonedDateTime.now()`. Save.
    - [x] Wrap both methods in `@Transactional` blocks to run within existing case update operations.

- [x] Task 2. Service Layer Integration (AC: #1)
  - [x] Integrate the healing hooks into the core domain mutation services:
    - [x] In `CaseService.java` (methods `updateCase`, `assignCase`, `addNote`), call `caseAlertService.resolveDormancyAlert(caseId)` upon saving changes (updating `last_action_at` heals dormancy).
    - [x] In `CaseService.java` (method `advancePhase`), call `caseAlertService.resolveDeadlineAlert(caseId)` upon successful phase transition.
    - [x] In `DocumentUploadService.java` (method `storeDocument`), call `caseAlertService.resolveDormancyAlert(caseId)` since document upload represents user activity.

- [x] Task 3. Database State Persistence and Recalculation (AC: #2)
  - [x] Enforce database-level session independence: Because active alerts are stored in the `case_alert` table (FR37), they naturally persist across logins/logouts.
  - [x] Enable recalculation: Ensure the nightly `AlertEngineScheduler` process recalculates date intervals on active alerts, automatically upgrading warnings to critical status if deadlines are crossed during user absence.

- [x] Task 4. Unit & Integration Testing (AC: #1, #2)
  - [x] Write integration tests in `CaseAlertHealingTest.java`:
    - [x] **Test Dormancy Healing:** Insert a case with a backdated `last_action_at` and trigger scheduler to spawn a `DORMANCY` alert. Post a note using `CaseService` and verify that the alert record's `isResolved` is set to `true`.
    - [x] **Test Deadline Healing:** Spawn a case with a `DEADLINE` warning. Advance the phase using `CaseService.advancePhase()` and verify that the deadline alert transitions to resolved.
    - [x] **Test Urgency Escalation:** Verify that the background task upgrades a `DEADLINE` warning alert (`WARNING`) to critical status (`CRITICAL`) when the timestamp surpasses the legal limit.

## Dev Notes

### Technical Requirements
- **Real-Time UI Updates:** Triggering the alert healing hooks inside the controller transaction ensures that when the client receives the REST success response and re-fetches dashboard alerts, the resolved alerts are immediately omitted.
- **Fail-Safe Integrity:** Always check for active alert presence before running update SQL statements to avoid unnecessary database writes.

### File Structure Requirements
- Spring Boot Service: `backend/src/main/java/com/leasrecover/modules/cases/CaseAlertService.java`
- Spring Boot Controller: `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L638-L652)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L479-L480)
- Alerts Scheduler: [4-3-proactive-deadline-dormancy-alerts-engine.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/4-3-proactive-deadline-dormancy-alerts-engine.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Backend Maven tests run: 152/152 successful (BUILD SUCCESS).

### Completion Notes List

- Implemented `CaseAlertService` containing `resolveDormancyAlert` and `resolveDeadlineAlert` hooks.
- Integrated hooks inside `CaseService` (`updateCase`, `assignCase`, `addNote`, `advancePhase`) and `DocumentUploadService` (`storeDocument`).
- Added Mockito mock support for the new dependency in `CaseServiceTest`, `DocumentUploadServiceTest`, and `CaseAlertServiceTest`.
- Created new integration test suite `CaseAlertHealingTest` to verify alert healing and deadline criticality escalation.
- Adversarial Code Review: Fixed potential `NonUniqueResultException` in `CaseAlertService` by replacing single-result queries with `findAllByCaseIdAndAlertTypeAndIsResolvedFalse(...)` to handle multiple active duplicate alerts safely. Updated `CaseAlertHealingTest` to cover multi-alert resolution. (180/180 Maven tests passing).

### File List

- `backend/src/main/java/com/leasrecover/modules/cases/CaseAlertService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentUploadService.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseAlertHealingTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/DocumentUploadServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseAlertServiceTest.java`
