# Story 4.1: The 5-Phase Sequential Progression & Conditional Stepper

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to visually track and progress a recovery case through its 5 strict sequential phases,  
so that I know exactly where a case stands in the legal process.

## Acceptance Criteria

1. **Given** I am viewing an active Recovery Case  
   **When** I load the page  
   **Then** I see the `ConditionalPhaseStepper` component (UX-DR3) displaying the 5 phases: Pré-contentieux → Mise en demeure → Saisie du véhicule → Vente → Clôture (FR18).  
   **And** my current phase is visually highlighted.

2. **Given** I want to advance to the next phase manually (and all prerequisites are implicitly met)  
   **When** I trigger the phase transition  
   **Then** the backend updates the phase status, logs the transition in the audit trail, and the UI immediately reflects the advancement.

## Tasks / Subtasks

- [x] Task 1. Scaffolding Phase Enum and State Machine (AC: #2)
  - [x] Define a Java enum `RecoveryPhase.java` under `com.leasrecover.modules.cases`:
    - Values: `PRE_CONTENTIEUX`, `MISE_EN_DEMEURE`, `SAISIE`, `VENTE`, `CLOTURE`.
    - Implement a method `getNextPhase()` returning the next sequential phase, or throwing an `IllegalStateException` if called on `CLOTURE`.
  - [x] Refactor `RecoveryCase.java` to map `current_phase` as an enum string or raw string with strict enum validation checks.

- [x] Task 2. Spring Boot REST Endpoint for Transition (AC: #2)
  - [x] Implement `advancePhase(UUID id)` in `CaseService.java` wrapped in a `@Transactional` block:
    - Retrieve `RecoveryCase`. If not found, throw a 404.
    - Call `getNextPhase()` on the current phase.
    - Set the case's `currentPhase` to the new value.
    - Set `phaseStartedAt` and `lastActionAt` to `ZonedDateTime.now()`.
    - Save the entity (automatically logging the update via Envers).
  - [x] Add endpoint `POST /api/v1/cases/{id}/next-phase` in `CaseController.java`:
    - Restrict endpoint to `GESTIONNAIRE` role.
    - Return JSend success envelope containing the updated `CaseResponse`.

- [x] Task 3. Next.js Stepper Component (AC: #1)
  - [x] Scaffolding `ConditionalPhaseStepper.js` in `frontend/src/features/cases/components/`:
    - Wraps and configuration-extends Ant Design v5's `<Steps>` component.
    - Map the 5 phases to Steps items:
      1. Pré-contentieux
      2. Mise en demeure
      3. Saisie du véhicule
      4. Vente
      5. Clôture
    - Set active step index dynamically based on case's `currentPhase` resolved from props.
    - Ensure clean, responsive sizing and layout suited for the "Command Center" dashboard viewport.

- [x] Task 4. Transition Control & Toast Integration (AC: #2)
  - [x] In the case detail page (`frontend/src/app/(dashboard)/cases/[id]/page.js`), integrate the `ConditionalPhaseStepper` component at the top of the details body area.
  - [x] Add an "Avancer la phase" button:
    - Hide or disable the button if the case is in the `CLOTURE` phase.
    - On button click, fire a POST request to `/api/v1/cases/{id}/next-phase` via Next.js Server Action or fetch.
    - On success, trigger page data revalidation (`revalidatePath`) and display the toast: `notification.success({ message: "Phase du dossier mise à jour avec succès" })`.

- [x] Task 5. Unit & Integration Testing (AC: #1, #2)
  - [x] Write unit tests for `RecoveryPhase` state machine transitions, validating that `CLOTURE` cannot be advanced.
  - [x] Write integration tests in `CaseControllerTest.java` verifying Envers records the transition event audit history correctly.
  - [x] Scaffolding frontend tests validating that the stepper highlights the correct active step index and disables button progression at `CLOTURE`.

## Dev Notes

### Technical Requirements
- **Strict Sequential Order:** Verify that phase updates strictly follow the workflow. Direct jumps (e.g. `PRE_CONTENTIEUX` to `VENTE` directly) must be rejected by the backend.
- **Transactional Consistency:** The state transition must run within a database transaction context to ensure Envers revisions match phase timestamps.
- **Latency constraint:** Transitions must be executed and confirmed in the UI in `< 1 second` (NFR03). Keep payload weight small.

### File Structure Requirements
- Spring Boot Enums: `backend/src/main/java/com/leasrecover/modules/cases/RecoveryPhase.java`
- Next.js Stepper component: `frontend/src/features/cases/components/ConditionalPhaseStepper.js`
- Case Details update: `frontend/src/app/(dashboard)/cases/[id]/page.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L466-L482)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L469-L471)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L95-L96)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References
- Verified via JUnit test execution: 32 tests passed successfully.
- Verified Next.js compilation: production build succeeded with no errors.

### Completion Notes List
- Defined `RecoveryPhase` state machine enum.
- Refactored `RecoveryCase` entity to map `current_phase` to `RecoveryPhase` using JPA `@Enumerated`.
- Implemented backend transactional method `advancePhase` in `CaseService` with role verification and tenant isolation checks.
- Added REST endpoint `POST /api/v1/cases/{id}/next-phase` in `CaseController`.
- Added JUnit unit/integration tests in `RecoveryPhaseTest`, `CaseServiceTest`, `CaseControllerTest`, and `CaseHistoryServiceTest` verifying transitions, validations, and Envers history logs.
- Configured frontend Next.js routing proxy for POST requests.
- Scaffolded `ConditionalPhaseStepper.js` with Ant Design's `Steps` component.
- Integrated the stepper and "Avancer la phase" button in the case details page, handling transition actions, toast alerts, and state refresh.

### File List
- `backend/src/main/java/com/leasrecover/modules/cases/RecoveryPhase.java`
- `backend/src/main/java/com/leasrecover/modules/cases/RecoveryCase.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- `backend/src/main/java/com/leasrecover/modules/cases/dto/CaseResponse.java`
- `backend/src/test/java/com/leasrecover/modules/cases/RecoveryPhaseTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseHistoryServiceTest.java`
- `frontend/src/app/api/cases/[id]/next-phase/route.js`
- `frontend/src/features/cases/components/ConditionalPhaseStepper.js`
- `frontend/src/app/(dashboard)/cases/[id]/page.js`

## Senior Developer Review (AI)

### Review Checklist & Outcomes
- **Status:** Approved
- **Checklist:**
  - [x] Story file loaded and verified
  - [x] Acceptance Criteria fully validated against codebase implementation
  - [x] File list completeness checked and verified
  - [x] Backend unit & integration tests run and pass (110/110)
  - [x] Frontend Jest unit tests run and pass (14/14)
  - [x] Code quality, multi-tenancy context isolation, and transactional integrity verified
  - [x] UI button visibility for CLOTURE phase verified and tested

### Review Notes
1. **Critical/High Severity Gaps Remedied:** None.
2. **Medium Gaps Resolved:**
   - Added missing Jest test coverage in [cases-details.test.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/__tests__/cases-details.test.js) asserting that the "Avancer la phase" button is completely hidden from the viewport when a case has reached the final `CLOTURE` phase. All tests pass successfully.

## Change Log

- **2026-07-01:** Code review performed by senior AI reviewer. Added Jest coverage for `CLOTURE` phase button hiding. Status updated to `done`.
