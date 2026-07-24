# Story 7.2: Vehicle Inventory Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to link physical Vehicles to Contracts,  
so that I have a distinct record of the asset (VIN, Plate, Brand, Model, Year) that I need to recover.

## Acceptance Criteria

1. **Given** a leasing Contract is active  
   **When** I view its details  
   **Then** I can register the physical Vehicle bound to it by specifying its VIN, license plate, and base characteristics.

2. **Given** a Vehicle is linked to a Contract  
   **When** the AI valuation is performed on an attached expertise document  
   **Then** the extracted Brand/Model/Year from the document can be cross-referenced against the actual Vehicle entity data for discrepancy alerts.

## Tasks / Subtasks

- [x] Task 1. Spring Boot REST Endpoints for Vehicle Scaffolding (AC: #1)
  - [x] Create request DTO `VehicleCreateRequest.java` in `com.leasrecover.modules.cases.dto` validating `vin` is not blank and is alphanumeric, uploader fields like `brand`, `model`, `year`, `licensePlate` are formatted correctly.
  - [x] Create response DTO `VehicleResponse.java` in `com.leasrecover.modules.cases.dto`.
  - [x] Implement `VehicleService.java` in `com.leasrecover.modules.cases`:
    - Define method `registerVehicle(UUID contractId, VehicleCreateRequest request)`:
      - Retrieve the target `Contract`.
      - Verify that no vehicle is currently linked to this contract (or update if exists).
      - Instantiate a new `Vehicle` entity, generate UUID v7, set `tenantId`, `contractId`, and set fields. Save entity.
  - [x] Add REST mappings in `CaseController.java` or `ContractController.java`:
    - `POST /api/v1/contracts/{contractId}/vehicle` -> Registers a vehicle.
    - `GET /api/v1/contracts/{contractId}/vehicle` -> Retrieves vehicle details.
    - Secure endpoints to `GESTIONNAIRE` role and wrap responses in JSend envelopes.

- [x] Task 2. AI Valuation Discrepancy Engine (AC: #2)
  - [x] Update webhook valuation calculations in `AIValuationService.java` (executed upon successful FastAPI callbacks):
    - [x] Retrieve the `Vehicle` associated with the case contract.
    - [x] If a `Vehicle` is registered:
      - [x] Perform fuzzy comparison checks:
        - Compare `extractedBrand` with `vehicle.brand` (convert both to lowercase and remove spaces).
        - Compare `extractedModel` with `vehicle.model` (convert both to lowercase and remove spaces).
        - Compare `extractedYear` with `vehicle.year`.
      - [x] If any discrepancy is found (e.g. brand/model mismatch, or year difference):
        - Create and persist a new `CaseAlert` of type `'VEHICLE_DISCREPANCY'` with `criticality = 'WARNING'` and message: `"Écart détecté: L'expertise indique [Extracted Brand] [Extracted Model] ([Extracted Year]) alors que le contrat spécifie [Vehicle Brand] [Vehicle Model] ([Vehicle Year])."`
        - This alert will show up dynamically on the dashboard and case feed.

- [x] Task 3. Next.js Vehicle Details & Linkage Form (AC: #1)
  - [x] Create Vehicle details card view in `frontend/src/app/(dashboard)/cases/[id]/components/` or on the details tab:
    - [x] Display linked vehicle characteristics (VIN, License Plate, Brand, Model, Year).
    - [x] If no vehicle is registered for the contract:
      - Render an empty-state container prompting the user to register the vehicle asset.
      - Add a button opening a drawer or modal containing the Vehicle registration form.
      - On successful form submission (`POST /api/v1/contracts/{contractId}/vehicle`), show `notification.success` toast and refresh page details.

- [x] Task 4. Unit & Integration Testing (AC: #1, #2)
  - [x] Write integration tests in `AIValuationServiceTest.java` verifying that mismatched brand or model strings in the AI webhook callback trigger a `VEHICLE_DISCREPANCY` alert, and matching ones do not.
  - [x] Write tests verifying that registering a vehicle successfully persists it under the active tenant's schema context.

## Dev Notes

### Technical Requirements
- **Tenant Scope Enforcement:** In `VehicleService.java`, enforce database query boundaries by matching `tenantId` to the thread-local context.
- **Fuzzy Mismatch Thresholds:** Keep comparison rules flexible (ignore casing and whitespace variations) to avoid triggering unnecessary alerts for small typos.

### File Structure Requirements
- Spring Boot Service: `backend/src/main/java/com/leasrecover/modules/cases/VehicleService.java`
- Next.js UI component: `frontend/src/features/cases/components/VehicleDetailsCard.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L653-L670)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L479-L480)
- Alerts Scheduler: [4-3-proactive-deadline-dormancy-alerts-engine.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/implementation-artifacts/4-3-proactive-deadline-dormancy-alerts-engine.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Mockito warning about JVM dynamic loading agent.
- Compilation errors due to missing imports in `AIValuationServiceTest.java` (resolved).

### Completion Notes List

- Designed and implemented Java DTOs (`VehicleCreateRequest`, `VehicleResponse`) and backend Service (`VehicleService`).
- Exposed REST mappings `POST /api/v1/contracts/{contractId}/vehicle` and `GET /api/v1/contracts/{contractId}/vehicle` in `ContractController` secured by role check.
- Integrated fuzzy discrepancy engine in `AIValuationService` successful webhook callbacks to fire `VEHICLE_DISCREPANCY` warnings if extracted vehicle details mismatch.
- Formulated Next.js API proxy route and developed the premium `<VehicleDetailsCard />` UI.
- Implemented and successfully ran 14 JUnit tests spanning `VehicleServiceTest` and `AIValuationServiceTest`.

### File List

- [NEW] [VehicleCreateRequest.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/dto/VehicleCreateRequest.java)
- [NEW] [VehicleResponse.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/dto/VehicleResponse.java)
- [NEW] [VehicleService.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/VehicleService.java)
- [NEW] [route.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/app/api/contracts/%5Bid%5D/vehicle/route.js)
- [NEW] [VehicleDetailsCard.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/features/cases/components/VehicleDetailsCard.js)
- [NEW] [VehicleServiceTest.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/test/java/com/leasrecover/modules/cases/VehicleServiceTest.java)
- [MODIFY] [ContractService.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/contract/ContractService.java)
- [MODIFY] [ContractController.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/contract/ContractController.java)
- [MODIFY] [AIValuationService.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/java/com/leasrecover/modules/cases/AIValuationService.java)
- [MODIFY] [page.js](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/frontend/src/app/%28dashboard%29/cases/%5Bid%5D/page.js)
- [MODIFY] [AIValuationServiceTest.java](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/test/java/com/leasrecover/modules/cases/AIValuationServiceTest.java)
