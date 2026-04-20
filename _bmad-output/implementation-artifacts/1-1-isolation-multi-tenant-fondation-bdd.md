# Story 1.1: Isolation Multi-Tenant (Fondation BDD)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Super Admin,
I want the system to isolate each tenant's data at the database level (Separate Schema),
so that there is zero risk of data leakage between different leasing companies (FR04).

## Acceptance Criteria

1. **Given** an initialization script
   **When** a new tenant is provisioned
   **Then** a dedicated PostgreSQL schema is created dynamically for this tenant.

2. **Given** an API request from user A (Tenant A)
   **When** they try to access a resource
   **Then** the Backend ensures the context resolves strictly to Schema A.

3. **Given** an API request from user A (Tenant A)
   **When** they try to brute-force a URL belonging to Tenant B
   **Then** the system returns a 403 Forbidden or 404 Not Found without leaking existence.

## Tasks / Subtasks

- [ ] Task 1: Setup Multi-Tenancy Architecture (AC: 1, 2)
  - [ ] Create `TenantContextHolder` using `ThreadLocal` structure (Virtual Thread safe).
  - [ ] Implement `TenantFilter` to extract tenant ID from incoming requests (headers or context) and populate `TenantContextHolder`.
- [ ] Task 2: Implement Dynamic Database Routing (AC: 1, 2)
  - [ ] Implement `AbstractRoutingDataSource` to route database queries to the proper PostgreSQL schema based on `TenantContextHolder`.
  - [ ] Configure `Hibernate` to resolve schemas automatically per transaction.
- [ ] Task 3: Setup Flyway for Schema Migrations (AC: 1)
  - [ ] Set up Flyway script mechanism capable of auto-running migrations specific to each tenant schema over loops or specifically when a tenant is provisioned.
- [ ] Task 4: Setup API Boundaries & Security Constraints (AC: 3)
  - [ ] Add Global Exception handling allowing unauthenticated/incorrect tenant requests to explicitly return a 403 Forbidden without leaking existence in a standardized JSend envelope.
  - [ ] Write integration test validating complete schema isolation.

## Dev Notes

### Technical Requirements
- Language/Framework: Java 21, Spring Boot 4.0.3, PostgreSQL 18.
- The `TenantContextHolder` must be safely compatible with Spring Boot 4's Virtual Threads (no thread-local leaks).
- **Multi-Tenancy Strategy**: 'Shared Database, Separate Schema'. No row-level filtering logic should pollute business entities; rely purely on schema boundaries.

### Architecture Compliance
- **Database Naming**: ALL tables, columns, constraints MUST be exclusively `snake_case` (e.g. `created_at`, `tenant_id`).
- **Response Format**: Any exceptions or 403 responses must follow the Standard API JSend envelope: `{ "status": "error", "error": { "code": 403, "message": "Forbidden", ... } }`.
- **Tenant Context Boundary**: Tenant logic must be intercepted completely at the API boundaries (filter layer) to remain transparent to the `Service` and `Repository` layers.

### Library/Framework Requirements
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-web`
- `flyway-core`
- PostgreSQL driver

### Project Structure Notes
- Centralize context management: `backend/src/main/java/com/leasrecover/core/` (for `TenantFilter`, `TenantContextHolder`).
- Routing persistence logic: `backend/src/main/java/com/leasrecover/config/` (for Database + Flyway configuration).
- Keep domain boundaries distinct: The tenant filtering strictly affects database resolution underneath the repos.

### References
- Architecture Constraints: `c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md` (Sections: Data Architecture, API Boundaries, Project Organization)
- Epic Origins: `c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md` (Epic 1)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
