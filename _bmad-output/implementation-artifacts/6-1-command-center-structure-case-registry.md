# Story 6.1: Command Center Structure & Case Registry

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to consult the list of all my active dossiers with advanced filtering (phase, status, risk level) inside a unified dashboard layout,  
so that I can find, track, and manage any specific case rapidly.

## Acceptance Criteria

1. **Given** I access the main dashboard  
   **When** the page renders  
   **Then** I see the "Command Center" layout with a static sidebar (UX-DR7).  
   **And** the main area displays a paginated Registry table of my active dossiers.  
   **And** I can filter this registry comprehensively by Phase, Status, or AI Alert Level (FR33).

## Tasks / Subtasks

- [x] Task 1. Spring Boot Dynamic Query Repository & Specifications (AC: #2)
  - [x] Implement query specifications in `CaseSpecification.java` in `com.leasrecover.modules.cases`:
    - Scaffolding filter predicates:
      - `tenantId` (UUID): Enforce strictly matching `TenantContextHolder.getTenantUuid()`.
      - `currentPhase` (String): optional filter.
      - `status` (String): optional filter (e.g. `'ACTIVE'`).
      - `reliabilityIndicator` (String): Join `ai_valuation` table and filter where `reliability_indicator` matches the parameter.
  - [x] Update `RecoveryCaseRepository.java` to extend `JpaSpecificationExecutor<RecoveryCase>`.

- [x] Task 2. Spring Boot Paginated List API (AC: #2)
  - [x] Create response DTO `CaseListResponse.java` returning flat case parameters: `id`, `clientName`, `contractReference`, `currentPhase`, `assigneeName`, `reliabilityIndicator`, `lastActionAt`, `createdAt`.
  - [x] Implement `getCases(Pageable pageable, String phase, String status, String alertLevel)` in `CaseService.java`:
    - Execute query using repositories with specs and pagination.
    - Map output Page elements to `CaseListResponse` DTOs.
  - [x] Add REST mapping `GET /api/v1/cases` in `CaseController.java`:
    - Support pagination query params (`page`, `size`, `sortBy`).
    - Secure endpoint to `GESTIONNAIRE` role.
    - Return output wrapped in JSend success envelope.

- [x] Task 3. Next.js Command Center Sidebar Layout (AC: #1)
  - [x] Create layout template `layout.js` in `frontend/src/app/(dashboard)/` (UX-DR7):
    - [x] Render a left-aligned static `<Sider>` sidebar with:
      - Brand Header (Name "LeasRecover" + Logo image).
      - Menu component listing: Dashboard (pointing to `/dashboard`), Cases (pointing to `/cases`), and Settings.
    - [x] Render a top `<Header>` banner showing current authenticated user details and profile logout controls.
    - [x] Render a content area for children routes.

- [x] Task 4. Next.js Registry Table & Filtering UI (AC: #1)
  - [x] Create cases directory view `page.js` in `frontend/src/app/(dashboard)/cases/`:
    - [x] Build a filter toolbar panel using Ant Design v5 `<Select>` components for Phase, Status, and Alert Level.
    - [x] Scaffolding paginated Ant Design `<Table>` component:
      - Columns: Client Name, Contract Reference, Phase, Assignee, AI Valuation status (rendering color badge ✅/⚠️/🚨), and Last Action Date.
      - Height: Row heights set to 48px to satisfy density requirements (UX-DR7).
    - [x] Connect Table pagination and filter selection changes to server queries (Server Actions or fetch routes) to reload data in `< 2 seconds` (NFR02).

- [x] Task 5. Unit & Integration Testing (AC: #1, #2)
  - [x] Write integration tests in `CaseControllerTest.java` verifying that querying `GET /api/v1/cases` successfully paginates results, filters by phase/risk, and wraps them in JSend envelope payloads.
  - [x] Write frontend component tests verifying table row formatting and filter event triggers.

## Dev Notes

### Technical Requirements
- **Tenant Scope Isolation:** Ensure the query specifications strictly filter records by `tenantId` resolved from the session context. Never allow cross-tenant leakages.
- **Fast List Loading:** The table must load 1,000+ dossiers in `< 2 seconds` (NFR02). Optimize pagination queries and avoid N+1 queries by fetching associations (`Client`, `Contract`, `AppUser`) in a single JOIN query.

### File Structure Requirements
- Spring Boot Specifications: `backend/src/main/java/com/leasrecover/modules/cases/CaseSpecification.java`
- Next.js Sider layout: `frontend/src/app/(dashboard)/layout.js`
- Next.js Registry View: `frontend/src/app/(dashboard)/cases/page.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L594-L611)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L479-L480)
- UI Specifications: [ux-design-specification.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/ux-design-specification.md#L210)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- None. All test suites compiled and executed successfully.

### Completion Notes List

- Implemented dynamic paginated querying and filtering backend API endpoint `GET /api/v1/cases` in `CaseController.java` and `CaseService.java` with N+1 fetch query prevention.
- Added comprehensive unit and integration tests verifying query pagination, filtering, and role authorization in `CaseControllerTest.java`.
- Updated the Next.js static sidebar layout `layout.js` with correct brand/logo headers and restructured navigation links (Dashboard, Cases, Settings).
- Refactored user details, profile, and logout actions into a premium top sticky `<Header>` banner on the dashboard page.
- Created the Cases Registry list page `page.js` in `frontend/src/app/(dashboard)/cases/` featuring dynamic pagination, sorting, filters (Phase, Status, AI Alert Level) with an exactly 48px density registry table.
- Added frontend Jest component tests verifying registry rendering and stub calls in `cases-registry.test.js`.

### File List

- `backend/src/main/java/com/leasrecover/modules/cases/CaseSpecification.java` [NEW]
- `backend/src/main/java/com/leasrecover/modules/cases/RecoveryCaseRepository.java` [MODIFY]
- `backend/src/main/java/com/leasrecover/modules/cases/dto/CaseListResponse.java` [NEW]
- `backend/src/main/java/com/leasrecover/modules/cases/CaseService.java` [MODIFY]
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java` [MODIFY]
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java` [MODIFY]
- `frontend/src/app/(dashboard)/layout.js` [MODIFY]
- `frontend/src/app/api/cases/route.js` [NEW]
- `frontend/src/app/(dashboard)/cases/page.js` [MODIFY]
- `frontend/src/__tests__/cases-registry.test.js` [NEW]
