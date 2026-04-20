# Story 1.2: Création et gestion des tenants

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Super Admin,
I want to create, configure, and deactivate tenants (client leasing companies),
so that I can safely onboard new clients and automatically provision their isolated workspaces without manual code changes (FR01, NFR14).

## Acceptance Criteria

1. **Given** I am logged into the Super Admin console
   **When** I trigger the creation of a new Tenant with a name and parameters
   **Then** the backend persists the new Tenant record in the global `public` schema.

2. **Given** a new Tenant record is generated
   **When** the system completes the transaction
   **Then** a dedicated PostgreSQL schema is automatically created and initialized with the required database tables via programmatic Flyway migrations (NFR14).

3. **Given** the Tenant schema is fully provisioned
   **When** the initialization process finishes
   **Then** an initial `"Admin"` user specific to that Tenant is automatically generated and securely bound to that schema (FR01) using a cryptographically hashed password (NFR09).

4. **Given** I am managing tenants
   **When** I deactivate a Tenant
   **Then** all subsequent API requests and authentication attempts for users belonging to that Tenant are forcefully rejected at the gateway level.

## Tasks / Subtasks

- [ ] Task 1: Global Tenant Registry (AC: 1)
  - [ ] Create `Tenant` entity and `TenantRepository` targeting the main/public schema.
  - [ ] Implement `TenantService` to handle creation.
- [ ] Task 2: Automated Schema Provisioning (AC: 2)
  - [ ] Enhance Flyway integration to programmatically create and run migrations on a new schema when a Tenant is created (`Flyway.configure()...migrate()`).
- [ ] Task 3: Admin Provisioning (AC: 3)
  - [ ] Create basic `User` entity to represent the Admin inside the tenant's schema.
  - [ ] Automatically insert an Admin user into the newly generated schema with a `bcrypt` hashed password.
- [ ] Task 4: Tenant Deactivation (AC: 4)
  - [ ] Add `isActive` flag to `Tenant`.
  - [ ] Modify `TenantFilter` (from Story 1.1) to block access with a `403 Forbidden` if the requested tenant is not active.
- [ ] Task 5: REST Endpoints (AC: 1, 4)
  - [ ] Create `/api/v1/super-admin/tenants` CRUD endpoints utilizing standard JSend envelopes (`status`, `data`).

## Dev Notes

### Technical Requirements
- Spring Boot 4.0.3, Java 21, PostgreSQL 18.
- Programmatic Flyway execution is required inside `TenantService`.
- Backend must orchestrate tenant creation transactionally.

### Architecture Compliance
- **Database Naming**: ALL tables and columns in both the global and tenant schemas MUST be `snake_case`.
- **API Formats**: Expose API payloads in perfectly formatted `camelCase`. Response envelope must use `status: "success"` or `status: "error"`.
- **Tenant Context**: Operations creating schemas or inserting admins must correctly manipulate `TenantContextHolder` so queries momentarily target the new schema for insertion.

### Library/Framework Requirements
- `spring-boot-starter-data-jpa`
- `flyway-core`
- `spring-security-crypto` (for bcrypt representation).

### File Structure Requirements
- `backend/src/main/java/com/leasrecover/modules/tenant/` for central Tenant management logic.
- Keep domain boundaries distinct: Controller -> Service -> Repository. Global exception handlers catch errors and map to standard JSON.

### Previous Story Intelligence
- Story 1.1 built `TenantContextHolder` and `AbstractRoutingDataSource`. Task 2 & 4 will utilize and expand upon these to fully automate the provisioning process. The existing `TenantFilter` must be updated to verify the tenant's activity status against the public database registry.

### References
- Architecture Constraints: `c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md` (Sections: Data Architecture, API Envelope).
- Epic Origins: `c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.1 partial representation).

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
