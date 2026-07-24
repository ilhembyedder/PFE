# Story 1.3: Admin User Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want to create, modify, and deactivate "Gestionnaire" accounts within my Tenant,
so that I can control who handles our specific recovery cases securely.

## Acceptance Criteria

1. **Given** I am logged in as an Admin  
   **When** I create a new user account with role `GESTIONNAIRE`  
   **Then** the user's password is cryptographically hashed (NFR09) and the user is strictly bound to my Tenant ID (FR02, FR03).

2. **Given** a deactivated user account  
   **When** they attempt to log in or make API calls using an old session  
   **Then** the system forcibly rejects their request immediately with an "Account Suspended" error.

3. **Given** I am an Admin editing roles  
   **When** I change a user's rights  
   **Then** the changes take effect on their active session immediately based on backend stateless JWT validation (FR06).

4. **Given** I am an Admin of Tenant A  
   **When** I attempt to query, view, or modify an account belonging to Tenant B via the API  
   **Then** the Backend explicitly rejects the request as unauthorized via `@TenantId` strict filtering (FR05).

## Tasks / Subtasks

- [x] Task 1. DTOs and Controller Implementation (AC: #1, #4)
  - [x] Create input DTOs in `com.leasrecover.modules.users.dto`: `UserCreateRequest` (validating email, password length, first/last name, and roles) and `UserUpdateRequest`.
  - [x] Create output DTO: `UserResponse` capturing all user fields (excluding `passwordHash`) formatted in `camelCase`.
  - [x] Create `AdminUserManagementController` at `/api/v1/admin/users` with endpoints:
    - `POST /api/v1/admin/users` (Create user)
    - `GET /api/v1/admin/users` (List users in current tenant)
    - `GET /api/v1/admin/users/{id}` (Get user by ID)
    - `PUT /api/v1/admin/users/{id}` (Update user details)
    - `PUT /api/v1/admin/users/{id}/deactivate` (Deactivate user)
  - [x] Ensure all controllers return `ResponseEntity<JSendResponse<T>>` adhering strictly to the JSend envelope format.
- [x] Task 2. Service Logic and Tenant Context Handoff (AC: #1, #4)
  - [x] Add `tenantUuid` support to `TenantContextHolder` to make the active tenant UUID programmatically accessible.
  - [x] Update `TenantFilter` to populate `TenantContextHolder.setTenantUuid(tenantId)` upon resolving the tenant from the header.
  - [x] Implement `UserManagementService` containing CRUD logic.
  - [x] Inject `PasswordEncoder` (BCrypt) to hash plain passwords immediately during creation.
  - [x] Bind new user entities strictly to the current tenant UUID retrieved from `TenantContextHolder`.
  - [x] Enforce that any fetched user's tenant UUID matches the current active tenant UUID before modifying or returning details.
- [x] Task 3. Active Session Status Validation (AC: #2, #3)
  - [x] Scaffold user status validation checking if the status is `ACTIVE`. If `INACTIVE`, throw an exception mapped to `403 Forbidden` with the error payload `"Account Suspended"`.
  - [x] Document/integrate JWT role and status verification so that updates to roles or status take effect on active sessions immediately by validating each request against the database or cache.
- [x] Task 4. Unit & Integration Testing (AC: #1-4)
  - [x] Write Mockito unit tests in `UserManagementServiceTest` validating user creation (password hashing, tenant binding), updates, and deactivation.
  - [x] Write integration tests in `AdminUserManagementControllerTest` verifying endpoint responses, validation errors, tenant isolation (calls on separate tenants returning 404/403), and JSend envelope compliance.

## Dev Notes

### Technical Requirements
- **Password Hashing:** MUST use Spring Security's injected `PasswordEncoder` bean (which is BCrypt). Do not implement custom hashing algorithms.
- **Tenant Context:** Rely on the dynamic schema switching from `TenantContextHolder.getTenantId()`. To retrieve the UUID of the tenant, extend `TenantContextHolder` to also store the UUID.
- **REST Envelopes:** All endpoints must return JSON envelopes following the JSend standard (`{ "status": "success", "data": ... }`). Use camelCase keys in JSON and snake_case columns in the database.
- **Validation:** Add `@Valid` on request payloads, validating fields like `@Email`, `@NotBlank`, and password strength/length constraints.

### File Structure Requirements
- All files related to user management must reside inside the module folder: `backend/src/main/java/com/leasrecover/modules/users/`.
- Test classes must reside in `backend/src/test/java/com/leasrecover/modules/users/` and `backend/src/test/java/com/leasrecover/config/tenant/`.

### Previous Story Intelligence
- Hibernate multi-tenancy utilizes dynamic schema routing based on `AbstractRoutingDataSource`. Since `Tenant` is defined in the `public` schema but is queried during requests, we must map its schema explicitly:
  > [!TIP]
  > Update the `Tenant` entity in `com.leasrecover.modules.tenant.Tenant` to specify `@Table(name = "tenant", schema = "public")` to avoid database routing errors during dynamic tenant schema execution contexts.
- All entities inherit from `BaseEntity` which contains metadata fields (`createdBy`, `createdAt`, `updatedAt`, `version`, `isDeleted`, `deletedAt`). Use these instead of manual updates.

### Project Structure Notes
- Module folder: `com.leasrecover.modules.users`
- Standard routing prefix: `/api/v1/admin/users`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L225-L248)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L18-L35)
- Tenant configuration: [config.yaml](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad/bmm/config.yaml)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Fixed context loading issues in WebMvc slice tests by moving `@EnableJpaAuditing` to `JpaConfig` and adding Mockito beans for repositories.
- Updated `ObjectMapper` import package for Jackson 3 / Spring Boot 4 compatibility.

### Completion Notes List

- Implemented `AdminUserManagementController` exposing endpoints for CRUD and deactivation of tenant users under `/api/v1/admin/users`. All responses conform to JSend envelope structure.
- Implemented `UserManagementService` handling creation (with BCrypt hashing), updates, deactivation, and single/list retrieval, strictly validating and binding entities to the active tenant UUID context.
- Added strict security gates in `TenantFilter`: blocks Super Admins from accessing tenant schemas, verifies tenant and user presence, rejects inactive users with `"Account Suspended"`, and restricts `/api/v1/admin/**` endpoints to users with `"ADMIN"` role.
- Authored Mockito unit tests covering all service CRUD logic and controller web slice tests covering endpoint status, input validation, and role auth. All tests pass successfully.

### File List

- `backend/src/main/java/com/leasrecover/core/GlobalExceptionHandler.java` (Created)
- `backend/src/main/java/com/leasrecover/modules/users/AppUser.java`
- `backend/src/main/java/com/leasrecover/modules/users/AppUserRepository.java`
- `backend/src/main/java/com/leasrecover/modules/users/UserManagementService.java`
- `backend/src/main/java/com/leasrecover/modules/users/AdminUserManagementController.java`
- `backend/src/main/java/com/leasrecover/modules/users/dto/UserCreateRequest.java`
- `backend/src/main/java/com/leasrecover/modules/users/dto/UserUpdateRequest.java`
- `backend/src/main/java/com/leasrecover/modules/users/dto/UserResponse.java`
- `backend/src/test/java/com/leasrecover/modules/users/UserManagementServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/users/AdminUserManagementControllerTest.java`
- `backend/src/main/java/com/leasrecover/config/tenant/TenantFilter.java` (Modified)
- `backend/src/test/java/com/leasrecover/config/tenant/TenantFilterTest.java` (Modified)

### Change Log

- 2026-06-07: Implemented complete user management CRUD controller, service logic, hashing, security filter restrictions, and test suite. Status updated to review.
