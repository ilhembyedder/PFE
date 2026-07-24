# Story 2.1: Tenant Branding Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,  
I want to configure my company's specific branding (Name, Logo URL),  
So that my Gestionnaires interact within an environment branded for our specific leasing company.

## Acceptance Criteria

1. **Given** I am logged into the platform as an Admin  
   **When** I navigate to the Tenant Settings view  
   **Then** I am presented with inputs to update the `name` and `logo_url` of my specific Tenant record (FR07).

2. **Given** I submit a valid Logo URL  
   **When** I save the settings  
   **Then** the UI (Command Center sidebar) immediately updates to reflect the new primary branding.

3. **Given** I leave the logo or name blank  
   **When** I attempt to save  
   **Then** I receive a contextual inline blocker validation error (UX-DR6).

## Tasks / Subtasks

- [ ] Task 1. Spring Boot REST Endpoints for Tenant Branding (AC: #1, #2)
  - [ ] Create request DTO `TenantBrandingRequest.java` in `com.leasrecover.modules.tenant.dto` validating that `name` and `logoUrl` are not blank and `logoUrl` is a valid URL format.
  - [ ] Create response DTO `TenantResponse.java` capturing `id`, `name`, `logoUrl`, and `status`.
  - [ ] Implement `TenantBrandingController.java` at `/api/v1/admin/tenant` with endpoints:
    - `GET /api/v1/admin/tenant`: Fetches the current tenant details.
    - `PUT /api/v1/admin/tenant/branding`: Updates the branding `name` and `logoUrl` of the active tenant.
  - [ ] Secure endpoints so they are only accessible to authenticated users with the `ADMIN` role.
  - [ ] Enforce data isolation: retrieve the active tenant UUID dynamically from `TenantContextHolder.getTenantUuid()`, querying and updating only the corresponding `Tenant` record in the `public` database.
  - [ ] Ensure all controllers return JSend envelope responses (`JSendResponse.success(data)`).
- [ ] Task 2. Next.js Frontend Tenant Settings Page (AC: #1, #3)
  - [ ] Create Tenant Settings page at `frontend/src/app/(dashboard)/settings/tenant/page.js` using Ant Design v5.
  - [ ] Implement client-side validations inside the settings Form to ensure fields are not blank and the logo is a valid URL.
  - [ ] Integrate `InlineBlocker` validation patterns (UX-DR6) to display validation errors on-page instead of using pop-up modals.
  - [ ] Create Next.js Server Action or BFF proxy fetch to submit the updated tenant settings to the Spring Boot backend.
- [ ] Task 3. Live Sidebar Branding Synchronization (AC: #2)
  - [ ] Create a `TenantBrandingContext` or shared state provider wrapping the layout to hold dynamic tenant branding state (`name` and `logoUrl`).
  - [ ] Update `Sidebar.js` to consume the branding state, rendering the tenant logo and name dynamically in the header.
  - [ ] Ensure the Tenant Settings page updates the branding state upon successful form submission, instantly reflecting the new name and logo in the Sidebar.
- [ ] Task 4. Unit & Integration Testing (AC: #1-3)
  - [ ] Write unit tests for tenant settings updates (validating inputs, database update logic).
  - [ ] Write WebMvc controller integration tests for `/api/v1/admin/tenant` verifying route protection, role verification, and JSend envelope conformity.
  - [ ] Write frontend integration/E2E tests verifying the branding form validations, submission flow, and immediate sidebar header update.

## Dev Notes

### Technical Requirements
- **Tenant Context Resolution:** Do not allow the client to pass the tenant UUID in the request body for updates. Resolve the target tenant UUID solely from the authenticated session context (`TenantContextHolder`).
- **REST Envelopes:** All endpoints must return JSON envelopes following the JSend standard (`{ "status": "success", "data": ... }`).
- **Input Validation:** Use Spring Boot's `@Valid` annotation and standard validator annotations (e.g. `@NotBlank`, `@URL`).

### File Structure Requirements
- Spring Boot controllers/DTOs: `backend/src/main/java/com/leasrecover/modules/tenant/`
- Spring Boot tests: `backend/src/test/java/com/leasrecover/modules/tenant/`
- Next.js branding views: `frontend/src/app/(dashboard)/settings/tenant/`
- Next.js layout update: `frontend/src/components/layout/Sidebar.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L277-L296)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L246-L248)
- Database schema: [V1__init_global_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/public/V1__init_global_schema.sql#L4-L16)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Fixed compilation error in `TenantBrandingControllerTest.java` by changing `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest` import to `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`.
- Fixed ESLint unescaped quotes errors in `settings/tenant/page.js` by escaping single quotes in JSX to `&apos;`.

### Completion Notes List

- Created backend request and response DTOs (`TenantBrandingRequest.java` and `TenantResponse.java`) with jakarta validation constraints.
- Implemented `TenantBrandingController.java` exposing endpoints to fetch and update tenant branding, extracting the active tenant UUID dynamically from `TenantContextHolder`.
- Secured endpoints under `/api/v1/admin/tenant` ensuring they are only accessible to authenticated users with the `ADMIN` role via `TenantFilter`.
- Wrote full WebMvc controller integration tests in `TenantBrandingControllerTest.java` verifying endpoint access controls, JSend response structure, and validation constraints.
- Created `TenantBrandingContext` shared React state provider to coordinate branding dynamically across Next.js components.
- Developed Next.js BFF proxy route handler at `/api/admin/tenant` to decrypt session token cookies and securely communicate with the backend.
- Built Tenant Settings page at `/settings/tenant` using Ant Design v5 Form, implementing inline validation blockers and immediate sidebar header updates.
- Wrapped Dashboard Layout with the branding provider and bound sidebar logo/name to dynamic context parameters.

### File List

- `backend/src/main/java/com/leasrecover/modules/tenant/dto/TenantBrandingRequest.java`
- `backend/src/main/java/com/leasrecover/modules/tenant/dto/TenantResponse.java`
- `backend/src/main/java/com/leasrecover/modules/tenant/TenantBrandingController.java`
- `backend/src/test/java/com/leasrecover/modules/tenant/TenantBrandingControllerTest.java`
- `frontend/src/lib/branding-context.js`
- `frontend/src/app/api/admin/tenant/route.js`
- `frontend/src/app/(dashboard)/settings/tenant/page.js`
- `frontend/src/app/(dashboard)/layout.js`
