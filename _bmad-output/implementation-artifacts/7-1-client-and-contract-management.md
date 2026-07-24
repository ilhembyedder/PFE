# Story 7.1: Client and Contract Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to create and manage Clients and their associated Contracts in the system,  
So that I can select existing contracts when creating a recovery case rather than typing data manually, ensuring referential integrity.

## Acceptance Criteria

1. **Given** I am a Gestionnaire  
2. **When** I navigate to the "Clients & Contrats" repertoire  
3. **Then** I can create a new Client (Name, Registration number, contact info) and associate leasing Contracts (Reference, start/end dates, status) with them.

4. **Given** I am creating a new Recovery Case  
5. **When** I fill in the case details  
6. **Then** I can select an existing Contract from an autocomplete list, which automatically binds the Client and Vehicle to the case.

## Tasks / Subtasks

- [x] Task 1. Spring Boot Client & Contract JPA Entities and Repositories (AC: #1)
  - [x] Create `Client.java` entity in `com.leasrecover.modules.client` mapped to table `client`. Inherit from `BaseEntity`. Include fields: `tenantId` (UUID), `fullNameOrCompany` (String), `registrationNumber` (String), `contactEmail` (String), `contactPhone` (String), `address` (String).
  - [x] Create `ClientRepository.java` extending `JpaRepository<Client, UUID>` supporting `findByEmailAndIsDeletedFalse` and `findAllByIsDeletedFalse`.
  - [x] Create `Contract.java` entity in `com.leasrecover.modules.contract` mapped to table `contract`. Inherit from `BaseEntity`. Include fields: `tenantId` (UUID), `client` (ManyToOne to `Client`), `referenceNumber` (String), `startDate` (ZonedDateTime), `endDate` (ZonedDateTime), `status` (String).
  - [x] Create `ContractRepository.java` extending `JpaRepository<Contract, UUID>` supporting finding active contracts and filtering by `client` or `tenantId`.
- [x] Task 2. Spring Boot Client & Contract REST Controllers (AC: #1, #2)
  - [x] Create DTOs: `ClientRequest`, `ClientResponse`, `ContractRequest`, `ContractResponse` in respective packages, utilizing `camelCase` keys.
  - [x] Apply standard validations: `@NotBlank` for `fullNameOrCompany` / `referenceNumber`, and `@Email` for email properties.
  - [x] Implement `ClientController.java` at `/api/v1/clients` and `ContractController.java` at `/api/v1/contracts` with standard CRUD endpoints (GET list, GET by ID, POST, PUT, DELETE (soft-delete)).
  - [x] Secure endpoints so they are only accessible to authenticated users with `GESTIONNAIRE` or `ADMIN` roles.
  - [x] Enforce dynamic tenant isolation: retrieve active tenant UUID from `TenantContextHolder.getTenantUuid()`, ensuring all created records are bound to the active tenant and queries are restricted within it.
  - [x] Return standard JSend response envelopes (`JSendResponse.success(data)`).
- [x] Task 3. Next.js "Clients & Contrats" Repertoire UI Dashboard (AC: #1)
  - [x] Create dashboard view at `frontend/src/app/(dashboard)/leasing/page.js` using Ant Design v5 `Table`, `Tabs`, `Drawer`, and `Form`.
  - [x] Render a filterable and paginated table listing clients, registration numbers, contact details, and their associated contracts.
  - [x] Implement client-side validations on forms (prevent blank inputs, validate emails), displaying error warnings via an `InlineBlocker` component (UX-DR6).
  - [x] Integrate API fetch handlers to submit and fetch data, showing a `notification.success` toast on successful client/contract creation.
- [x] Task 4. Unit & Integration Testing (AC: #1-2)
  - [x] Write unit tests for `ClientService` and `ContractService` validating CRUD operations and tenant context bounds.
  - [x] Write WebMvc controller integration tests for `/api/v1/clients` and `/api/v1/contracts` verifying authorization (restricting to roles `GESTIONNAIRE`/`ADMIN`) and JSend envelope compliance.
  - [x] Write frontend integration/E2E tests verifying settings input rendering, invalid blocker validation messages, and successful list updates.

## Dev Notes

### Technical Requirements
- **Referential Integrity:** Ensure contracts cannot be created without a valid, existing `client_id` belonging to the same tenant schema.
- **REST Envelopes:** Ensure all API responses use the JSend format. Returns `ResponseEntity<JSendResponse<T>>`.
- **Soft Delete:** Do not physically delete database rows. Set `isDeleted = true` and filter out soft-deleted entities during standard queries.

### File Structure Requirements
- Client module classes: `backend/src/main/java/com/leasrecover/modules/client/`
- Contract module classes: `backend/src/main/java/com/leasrecover/modules/contract/`
- Next.js UI views: `frontend/src/app/(dashboard)/leasing/`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L337-L352)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L295-L308)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L37-L68)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

### Completion Notes List

### File List
