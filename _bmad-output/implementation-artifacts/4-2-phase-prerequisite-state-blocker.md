# Story 4.2: Phase Prerequisite State Blocker

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want the system to clearly block me from advancing a phase if legal or business prerequisites are missing,  
so that I do not accidentally violate our compliance workflows.

## Acceptance Criteria

1. **Given** a case is in a phase where prerequisites are missing (e.g., missing critical document upload)  
   **When** I attempt to advance to the next phase via the `ConditionalPhaseStepper`  
   **Then** the UI explicitly displays a visual lock on the next step accompanied by a tooltip or an inline blocker detailing exactly what is missing (FR19, UX-DR3).  
   **And** the backend actively rejects any API requests trying to force the phase change without the prerequisite.

## Tasks / Subtasks

- [x] Task 1. Spring Boot Prerequisite Service & Validation Engine (AC: #2)
  - [x] Create a service class `CasePrerequisiteService.java` under `com.leasrecover.modules.cases`:
    - Define a method `checkPrerequisites(RecoveryCase recoveryCase, RecoveryPhase targetPhase)` returning a list of unsatisfied prerequisite descriptions.
    - Implement validation rules:
      - For transition to `VENTE`: Verify that a record exists in the `ai_valuation` table associated with the case with status `'SUCCESS'` or `'COMPLETED'`. If not, append the warning: `"L'estimation de valeur par l'IA doit être effectuée et validée avant d'accéder à la phase de Vente."`
      - For transition to other phases (e.g. `MISE_EN_DEMEURE`, `SAISIE`): Add validation hooks to easily support check constraints (e.g. checking if a required contract document exists).
  - [x] Implement custom exception `PrerequisiteNotMetException.java` extending `ResponseStatusException` returning HTTP 400 Bad Request with details.

- [x] Task 2. Integrate Check into Phase Progression (AC: #2)
  - [x] Update `advancePhase` in `CaseService.java` to call `casePrerequisiteService.checkPrerequisites(recoveryCase, nextPhase)`.
  - [x] If the check returns any unsatisfied prerequisites, throw `PrerequisiteNotMetException` to abort the database transaction and prevent progression.

- [x] Task 3. Spring Boot REST API for Client-Side Checking (AC: #1)
  - [x] Implement endpoint `GET /api/v1/cases/{id}/prerequisites` in `CaseController.java`:
    - Returns a response payload wrapping:
      - `nextPhase`: The target phase string.
      - `isBlocked`: Boolean flag.
      - `missingPrerequisites`: A JSON array of string warning messages.
    - Wrap the response in a JSend success envelope.

- [x] Task 4. Next.js Stepper Visual Lock and Tooltips (AC: #1)
  - [x] Update `ConditionalPhaseStepper.js` to accept `prerequisitesStatus` as a prop:
    - [x] If a step is blocked, render a lock icon next to the step title.
    - [x] Wrap the locked step in an Ant Design `<Tooltip>` displaying the list of missing prerequisites.
  - [x] Implement `InlineBlocker.js` component in `frontend/src/components/ui/` (UX-DR6):
    - [x] Render a warning banner above the "Avancer la phase" button if the next phase is blocked.
    - [x] Include details of what is missing (e.g., "Rapport d'expertise manquant") and a CTA link to navigate to the upload section.
    - [x] Disable the "Avancer la phase" button.

- [x] Task 5. Unit & Integration Testing (AC: #1, #2)
  - [x] Write unit tests in `CasePrerequisiteServiceTest.java` verifying that transition to `VENTE` succeeds if an AI valuation exists, and fails with a validation exception if it does not.
  - [x] Write integration tests in `CaseControllerTest.java` verifying that calling `POST /api/v1/cases/{id}/next-phase` returns HTTP 400 Bad Request with a clear JSend error payload when prerequisites are unsatisfied.
  - [x] Scaffolding E2E tests validating the locked stepper and tooltip hover states in Next.js.

## Dev Notes

### Technical Requirements
- **Extensible Validation Checks:** Design the validation engine with a composite rule pattern so additional compliance checks (e.g. required documents per phase) can be registered without editing core controller routes.
- **Fail-Fast Controller Behavior:** Throw the validation exception early at the service layer boundary to prevent any unnecessary database calls or dirty-state writes.

### File Structure Requirements
- Spring Boot Service: `backend/src/main/java/com/leasrecover/modules/cases/CasePrerequisiteService.java`
- Next.js Stepper update: `frontend/src/features/cases/components/ConditionalPhaseStepper.js`
- Inline Blocker: `frontend/src/components/ui/InlineBlocker.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L483-L495)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L469-L471)
- UI Specifications: [ux-design-specification.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/ux-design-specification.md#L97)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

### Completion Notes List
- Created CasePrerequisiteService to evaluate phase transitions.
- Implemented constraint logic for VENTE phase requiring a valid AI valuation.
- Added placeholders/hooks for other phases.
- Created custom PrerequisiteNotMetException (HTTP 400 Bad Request).
- Created GET /api/v1/cases/{id}/prerequisites endpoint on backend.
- Created Next.js API route handler to proxy backend prerequisites endpoint.
- Updated ConditionalPhaseStepper in frontend to render locked steps with tooltips.
- Created InlineBlocker warning banner component to block phase transition.
- Disabled "Avancer la phase" button in case details page when blocked.
- Wrote and passed comprehensive unit and integration tests (CasePrerequisiteServiceTest, CaseServiceTest, CaseControllerTest, and cases-details.test.js).
- [AI Code Review Fixes] Added missing integration test for prerequisite validation failure in CaseControllerTest.java.
- [AI Code Review Fixes] Updated CasePrerequisiteService and CasePrerequisiteServiceTest to enforce strict tenant isolation in native queries.

### File List
- [NEW] [PrerequisiteNotMetException.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/PrerequisiteNotMetException.java)
- [NEW] [CasePrerequisiteService.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/CasePrerequisiteService.java)
- [NEW] [CasePrerequisitesResponse.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/dto/CasePrerequisitesResponse.java)
- [NEW] [CasePrerequisiteServiceTest.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/test/java/com/leasrecover/modules/cases/CasePrerequisiteServiceTest.java)
- [NEW] [route.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/app/api/cases/[id]/prerequisites/route.js)
- [NEW] [InlineBlocker.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/components/ui/InlineBlocker.js)
- [MODIFY] [CaseService.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/CaseService.java)
- [MODIFY] [CaseController.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/CaseController.java)
- [MODIFY] [CaseServiceTest.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/test/java/com/leasrecover/modules/cases/CaseServiceTest.java)
- [MODIFY] [CaseControllerTest.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java)
- [MODIFY] [ConditionalPhaseStepper.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/features/cases/components/ConditionalPhaseStepper.js)
- [MODIFY] [page.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/app/(dashboard)/cases/[id]/page.js)
- [MODIFY] [cases-details.test.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/__tests__/cases-details.test.js)
