# Story 3.1: Recovery Case Initialization

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to create a new Recovery Case (Dossier) by selecting or entering the Client, Contract, and Vehicle details,  
so that I can officially begin tracking the recovery lifecycle on the platform with accurate initial financial baselines.

## Acceptance Criteria

1. **Given** I am creating a dossier  
   **When** I fill out the `Client` data (name, registration) and link it to a new `Contract` (reference, start/end date) and `Vehicle` (VIN, plate, brand)  
   **Then** the Backend permanently records the financial value as `initial_residual_value_cents` using a robust `BigInt` variable to guarantee zero floating point math errors (FR12).

2. **Given** a new dossier is created  
   **When** it successfully saves via the REST API  
   **Then** its ID is formulated natively as a Time-Sequential `UUID v7` optimizing database scale.

3. **Given** I am the creator  
   **When** the case initializes  
   **Then** I am automatically assigned as the `assignee_id`  
   **And** its status is forced to `ACTIVE` occupying the `PRE_CONTENTIEUX` phase natively.

## Tasks / Subtasks

- [x] Task 1. Spring Boot Entities & Database Schema Mapping (AC: #1, #2, #3)
  - [x] Implement `Client.java`, `Contract.java`, `Vehicle.java`, and `RecoveryCase.java` in the new backend module package `com.leasrecover.modules.cases`.
  - [x] Have all four entities extend `com.leasrecover._common.entity.BaseEntity` to inherit common fields (`id`, `version`, `createdBy`, `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`).
  - [x] Annotate entities with JPA mappings corresponding to `V1__init_tenant_schema.sql`:
    - `Client`: `@Table(name = "client")`
    - `Contract`: `@Table(name = "contract")` referencing `client_id` as `@ManyToOne`
    - `Vehicle`: `@Table(name = "vehicle")` referencing `contract_id` as `@ManyToOne`
    - `RecoveryCase`: `@Table(name = "recovery_case")` referencing `contract_id` as `@ManyToOne` and `assignee_id` as `@ManyToOne` to `AppUser`
  - [x] Define repositories: `ClientRepository.java`, `ContractRepository.java`, `VehicleRepository.java`, and `RecoveryCaseRepository.java` extending `JpaRepository`.

- [x] Task 2. Time-Sequential UUID v7 Generator (AC: #2)
  - [x] Create a utility class `UuidCreator.java` under `com.leasrecover._common.util`.
  - [x] Implement UUID v7 generator logic utilizing the system millisecond epoch time (upper 48 bits) combined with a cryptographically secure random source (lower 76 bits) conforming to RFC 9562/RFC 4122 variant:
    ```java
    package com.leasrecover._common.util;
    
    import java.security.SecureRandom;
    import java.util.UUID;
    
    public class UuidCreator {
        private static final SecureRandom random = new SecureRandom();
        
        public static UUID createUuidV7() {
            long timestamp = System.currentTimeMillis();
            long msb = (timestamp & 0xFFFFFFFFFFFFL) << 16;
            msb |= 0x7000L; // Set version to 7
            msb |= (random.nextInt() & 0x0FFF); // rand_a (12 bits)
            
            long lsb = (random.nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L; // variant 2
            return new UUID(msb, lsb);
        }
    }
    ```
  - [x] Update entity creation logic across the services to utilize `UuidCreator.createUuidV7()` when instantiating new entities instead of `UUID.randomUUID()`.

- [x] Task 3. Spring Boot REST Endpoints & Transactional Service (AC: #1, #2, #3)
  - [x] Create request DTO `CaseCreateRequest.java` in `com.leasrecover.modules.cases.dto` capturing:
    - Client fields: `clientFullName`, `clientRegistrationNumber`, `clientContactEmail`, `clientContactPhone`, `clientAddress`
    - Contract fields: `contractReferenceNumber`, `contractStartDate`, `contractEndDate`, `contractStatus`
    - Vehicle fields: `vehicleVin`, `vehicleLicensePlate`, `vehicleBrand`, `vehicleModel`, `vehicleYear`
    - Case fields: `initialResidualValueCents`, `currencyCode` (default to `"TND"`)
  - [x] Create response DTO `CaseResponse.java` in `com.leasrecover.modules.cases.dto` returning a clean nested JSON structure mapping all created fields.
  - [x] Create `CaseService.java` in `com.leasrecover.modules.cases` with a `@Transactional` method `createCase(CaseCreateRequest request, String userEmail)`:
    - [x] Resolve the authenticated user's `AppUser` via `appUserRepository.findByEmailAndIsDeletedFalse(userEmail)`.
    - [x] Initialize, set UUID v7 for, and save `Client`.
    - [x] Initialize, set UUID v7 for, and save `Contract` referencing the saved `Client`.
    - [x] Initialize, set UUID v7 for, and save `Vehicle` referencing the saved `Contract`.
    - [x] Initialize and save `RecoveryCase` with:
      - Generated UUID v7 ID.
      - References to the `Contract` and `AppUser` (as `assignee`).
      - Forced `currentPhase` to `"PRE_CONTENTIEUX"`.
      - Forced `status` to `"ACTIVE"`.
      - `phaseStartedAt` and `lastActionAt` set to current ZonedDateTime.
      - `initialResidualValueCents` and `currencyCode`.
  - [x] Create `CaseController.java` mapped to `POST /api/v1/cases`:
    - [x] Accept `@RequestBody @Valid CaseCreateRequest request` and resolve the user email from the header `@RequestHeader("X-User-Email") String userEmail`.
    - [x] Execute `caseService.createCase(request, userEmail)` and wrap the result in a JSend envelope `JSendResponse.success(response)`.
    - [x] Secure endpoint access to users with the `GESTIONNAIRE` role.

- [x] Task 4. Next.js Case Creation Form UI (AC: #1, #3)
  - [x] Create Case Creation page at `frontend/src/app/(dashboard)/cases/new/page.js` utilizing Ant Design v5 components.
  - [x] Build a multi-section structured form (Client, Contract, Vehicle, Case financial configuration) matching the "Command Center" layout.
  - [x] Form validation rules:
    - [x] Alphanumeric checks for VIN and registration numbers.
    - [x] Positive integers for financial value inputs.
    - [x] Convert the raw decimal input value (e.g. Dinars/Euros) to cents (multiply by 100) prior to API transmission.
  - [x] Integrate a Next.js Server Action or BFF API endpoint proxying form submission to `POST /api/v1/cases`, injecting session-based `X-Tenant-ID` and `X-User-Email` headers.
  - [x] Upon successful save, display a non-blocking toast `notification.success({ message: 'Dossier de recouvrement initialisé avec succès' })` and redirect to the dashboard.

- [x] Task 5. Unit & Integration Testing (AC: #1-3)
  - [x] Scaffolding `CaseServiceTest.java` verifying transactional atomicity (if vehicle insertion fails, no client or contract persists).
  - [x] Scaffolding `CaseControllerTest.java` verifying the JSend envelope format and JWT/header extraction boundaries.
  - [x] Create E2E/Integration test for the Next.js form validating client-side inputs and verifying redirect states on success.

## Dev Notes

### Technical Requirements
- **Referential Integrity:** Ensure the database operations run sequentially: Client first, Contract second, Vehicle third, and RecoveryCase last. If any operation fails, the whole database transaction must rollback.
- **UUID v7 Implementation:** All entities created in this story must utilize the custom UUID v7 generator to guarantee chronological ordering in the database.
- **Cents Representation:** Never use floating-point types (Float/Double) for currency calculations. Store all values as `Long` cents (`BigInt` in SQL) to avoid rounding discrepancies.

### File Structure Requirements
- Spring Boot packages: `backend/src/main/java/com/leasrecover/modules/cases/`
- Custom UUID v7 generator: `backend/src/main/java/com/leasrecover/_common/util/UuidCreator.java`
- Next.js creation views: `frontend/src/app/(dashboard)/cases/new/`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L389-L409)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L425-L426)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L37-L107)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References
- Backend Maven tests run: 56/56 successful (BUILD SUCCESS).
- Frontend Jest tests run: 8/8 successful (3 passed, 3 total).

### Completion Notes List
- Implemented time-sequential UUID v7 generator utility `UuidCreator.java`.
- Designed multi-tenant JPA Entities `Client`, `Contract`, `Vehicle`, and `RecoveryCase` extending `BaseEntity`.
- Developed REST request/response DTOs with validation rules (alphanumeric pattern checking for VIN and registration).
- Implemented `@Transactional` `CaseService` for atomic case creation and validation of `GESTIONNAIRE` roles.
- Bound REST controller endpoint `POST /api/v1/cases` using headers.
- Scaffolds mock service and controller tests (verifying successful case creation, authorization failures, and transactional failures).
- Modified `next.config.mjs` to add routing rewrites `/dashboard/:path*` -> `/:path*`.
- Created Next.js BFF endpoint `POST /api/cases` proxying request, decrypting JWT cookie, and passing headers.
- Built a premium responsive Case Creation Form at `/cases/new` using Ant Design.
- Fixed security vulnerability in `CaseController` by resolving email from `SecurityContextHolder` rather than relying blindly on `X-User-Email` header, and resolved frontend Ant Design Select/Alert/Notification deprecations.

### File List
- `backend/src/main/java/com/leasrecover/_common/util/UuidCreator.java`
- `backend/src/main/java/com/leasrecover/modules/cases/Client.java`
- `backend/src/main/java/com/leasrecover/modules/cases/ClientRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/Contract.java`
- `backend/src/main/java/com/leasrecover/modules/cases/ContractRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/Vehicle.java`
- `backend/src/main/java/com/leasrecover/modules/cases/VehicleRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/RecoveryCase.java`
- `backend/src/main/java/com/leasrecover/modules/cases/RecoveryCaseRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- `backend/src/main/java/com/leasrecover/modules/cases/dto/CaseCreateRequest.java`
- `backend/src/main/java/com/leasrecover/modules/cases/dto/CaseResponse.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java`
- `frontend/next.config.mjs`
- `frontend/src/app/api/cases/route.js`
- `frontend/src/app/(dashboard)/cases/new/page.js`
- `frontend/src/__tests__/cases.test.js`
