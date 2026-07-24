# Story 6.2: Action-Oriented Critical Alert Feed

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want the system to forcefully highlight my most critical or dormant cases entirely at the very top of my dashboard,  
so that my daily workflow is effortlessly prioritized by urgency without needing to actively search.

## Acceptance Criteria

1. **Given** there are cases with active deadline or dormancy warnings  
   **When** the backend fetches my dashboard data  
   **Then** an intelligent sorting algorithm forcefully evaluates urgency and pulls these specific cases into a dedicated top-oriented banner area (FR34, UX-DR7).  
   **And** the UI renders these as distinct `AlertCard` components featuring thick colored borders denoting criticality (UX-DR5).

## Tasks / Subtasks

- [x] Task 1. Spring Boot Priority Alerts Service & Dynamic Sort (AC: #1)
  - [x] Create response DTO `PriorityAlertResponse.java` in `com.leasrecover.modules.cases.dto` capturing: `alertId`, `caseId`, `clientName`, `contractReference`, `alertType`, `criticality`, `message`, `createdAt`.
  - [x] Implement `getPriorityAlerts()` in `CaseAlertService.java` or `CaseService.java`:
    - [x] Fetch all unresolved alerts (`isResolved = false`) for the active tenant UUID.
    - [x] Sort alerts using a custom Java `Comparator`:
      - Sort `criticality = 'CRITICAL'` before `'WARNING'`.
      - Sort by `createdAt` ascending (oldest unresolved alerts first).
    - [x] Limit the stream output size to the top 5 priority items to prevent banner pollution.
    - [x] Map the results to `PriorityAlertResponse` DTOs.
  - [x] Implement REST endpoint `GET /api/v1/dashboard/alerts/priority` in `CaseController.java` returning results wrapped in JSend success. Secure endpoint access to `GESTIONNAIRE` role.

- [x] Task 2. Next.js AlertCard Component Scaffolding (AC: #1, #2)
  - [x] Create `AlertCard.js` under `frontend/src/features/cases/components/` (UX-DR5):
    - [x] Render a flexbox card container with a thick `4px` left border.
    - [x] Color mapping for the left border:
      - `'CRITICAL'`: Critical red token `#EF4444`.
      - `'WARNING'`: Warning orange token `#F59E0B`.
    - [x] Render alert context details (Client name, case ID reference, and description message).
    - [x] Render a Call-To-Action (CTA) button labeled `"Résoudre l'alerte"`.

- [x] Task 3. Dashboard Top Banner Section Integration (AC: #1)
  - [x] Implement main dashboard view `page.js` in `frontend/src/app/(dashboard)/`:
    - [x] Query the endpoint `GET /api/v1/dashboard/alerts/priority` on mount.
    - [x] If the returned list is not empty:
      - [x] Render a full-width banner container directly at the top of the dashboard main viewport (UX-DR7).
      - [x] Map the alerts to `AlertCard` components.
      - [x] Add visual divider cutting before the cases table below to draw focus (UX-DR7).

- [x] Task 4. Unit & Integration Testing (AC: #1, #2)
  - [x] Write unit tests in `CaseAlertServiceTest.java` verifying that:
    - [x] Alerts with `'CRITICAL'` criticality sort before `'WARNING'` regardless of creation date.
    - [x] Resolved alerts are completely ignored by the query.
  - [x] Write integration tests in `CaseControllerTest.java` verifying JSend structure and role checks.
  - [x] Scaffolding E2E tests validating the left border color class maps correctly to API response codes.

## Dev Notes

### Technical Requirements
- **Urgency Priority Order:** The custom sorting comparator must evaluate criticality first to guarantee important actions override minor warnings.
- **Header Alert Banner Scope:** Keep the top banner strictly above dashboard navigation lists. Do not render this banner on Case Detail views or admin settings to prevent visual noise.

### File Structure Requirements
- Spring Boot Controller: `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- Next.js Component: `frontend/src/features/cases/components/AlertCard.js`
- Next.js Dashboard: `frontend/src/app/(dashboard)/cases/page.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L612-L624)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L479-L480)
- UI Specifications: [ux-design-specification.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/ux-design-specification.md#L99)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Backend test execution log: file:///C:/Users/IlhemBENYEDDER/.gemini/antigravity/brain/fa602dd2-5107-424e-ad81-6106c4038066/.system_generated/tasks/task-147.log
- Frontend test execution log: file:///C:/Users/IlhemBENYEDDER/.gemini/antigravity/brain/fa602dd2-5107-424e-ad81-6106c4038066/.system_generated/tasks/task-160.log

### Completion Notes List

- Implemented `PriorityAlertResponse` DTO and `getPriorityAlerts` service method in Spring Boot backend, enforcing a sorting strategy prioritizing `CRITICAL` over `WARNING` alerts and oldest first, limited to the top 5 unresolved alerts for the tenant.
- Created `GET /api/v1/dashboard/alerts/priority` REST endpoint in backend secured for `GESTIONNAIRE` role.
- Implemented `AlertCard.js` component with specific left-border color mappings (`#EF4444` for CRITICAL, `#F59E0B` for WARNING) and a Call-To-Action button.
- Configured a BFF API proxy route in Next.js to forward requests to the Spring Boot endpoint.
- Integrated the priority alerts banner onto the cases dashboard registry page with a visual divider.
- Wrote unit tests (`CaseAlertServiceTest.java`) and integration tests (`CaseControllerTest.java`) for the backend.
- Scaffolding unit/E2E test suite (`AlertCard.test.js` and `cases-registry.test.js`) for the frontend.

### File List

- `backend/src/main/java/com/leasrecover/modules/cases/dto/PriorityAlertResponse.java` [NEW]
- `backend/src/main/java/com/leasrecover/modules/cases/CaseService.java` [MODIFY]
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java` [MODIFY]
- `frontend/src/app/api/dashboard/alerts/priority/route.js` [NEW]
- `frontend/src/features/cases/components/AlertCard.js` [NEW]
- `frontend/src/app/(dashboard)/cases/page.js` [MODIFY]
- `backend/src/test/java/com/leasrecover/modules/cases/CaseAlertServiceTest.java` [NEW]
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java` [MODIFY]
- `frontend/src/__tests__/AlertCard.test.js` [NEW]
- `frontend/src/__tests__/cases-registry.test.js` [MODIFY]
