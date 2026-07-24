# Story 7.3: Polymorphic Document Consultation & Attachment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to upload and consult administrative documents at the Client, Contract, or Vehicle level independently from any Recovery Case,  
so that I have a centralized, accessible digital vault for documents (Kbis, copies of the contract, gray cards) prior to and during any recovery procedure.

## Acceptance Criteria

1. **Given** I am viewing a Client, Contract, or Vehicle detail page  
   **When** I want to consult existing documents  
   **Then** I see a dedicated "Documents" tab listing all relevant administrative files (e.g. Identity documents for Client, Gray Card for Vehicle).

2. **Given** I upload a new document to a Vehicle  
   **When** the upload completes  
   **Then** the document is physically vaulted and logically associated with the `vehicle_id` (leaving `case_id` null), making it consultable at any point regardless of the recovery case phase.

## Tasks / Subtasks

- [x] Task 1. Spring Boot Polymorphic Document Upload Service (AC: #2)
  - [x] Update `DocumentUploadService.java` or implement new helper methods:
    - [x] `storeEntityDocument(MultipartFile file, String entityType, UUID entityId, String uploaderEmail)`:
      - Resolve `uploader` user via email.
      - Save the file physically in the tenant directory `${upload.dir}/${tenantId}/${fileName}`.
      - Instantiate a new `Document` entity. Generate UUID v7, set `tenantId` and uploader details.
      - Parse `entityType` and map the target ID:
        - If `entityType === 'client'`: Validate client presence, set `client_id = entityId`.
        - If `entityType === 'contract'`: Validate contract presence, set `contract_id = entityId`.
        - If `entityType === 'vehicle'`: Validate vehicle presence, set `vehicle_id = entityId`.
      - Force `case_id = null` and `phase_uploaded_in = null` (representing administrative file status).
      - Save `Document` record in the database.

- [x] Task 2. Generic Spring Boot REST Controller (AC: #1, #2)
  - [x] Implement `POST /api/v1/documents` in `DocumentController.java` (or generic endpoint):
    - Accepts `@RequestParam("file") MultipartFile file`, `@RequestParam("entityType") String entityType`, `@RequestParam("entityId") UUID entityId` and the header `X-User-Email`.
    - Secure to `GESTIONNAIRE` role and return JSend success envelope wrapping the `DocumentResponse`.
  - [x] Implement `GET /api/v1/documents` in `DocumentController.java`:
    - Accepts `@RequestParam("entityType") String entityType`, `@RequestParam("entityId") UUID entityId`.
    - Returns a JSend envelope containing a list of `DocumentResponse` filtered by the matching foreign key (e.g. `client_id == entityId` and `is_deleted = false`).

- [x] Task 3. Reusable Next.js Entity Document Vault Component (AC: #1, #2)
  - [x] Create `EntityDocumentVault.js` in `frontend/src/features/cases/components/` or common directory:
    - [x] Props: accepts `entityType` (`'client'`, `'contract'`, or `'vehicle'`) and `entityId`.
    - [x] Query `GET /api/v1/documents?entityType=...&entityId=...` on component mount to retrieve list.
    - [x] Render a file list showing the original filename, upload date, and a download button.
    - [x] Render an Ant Design `<Upload>` component to upload files directly to `POST /api/v1/documents?entityType=...&entityId=...`.
    - [x] Show `notification.success` toast on upload success and refresh list.
  - [x] Mount the `EntityDocumentVault` component inside Client, Contract, and Vehicle details tab panels.

- [x] Task 4. Unit & Integration Testing (AC: #1, #2)
  - [x] Write integration tests in `DocumentUploadServiceTest.java` verifying that uploading files to `entityType = 'vehicle'` correctly sets `vehicle_id`, leaving `case_id` and `phase_uploaded_in` null.
  - [x] Write controller tests verifying JSend success outputs and role validations.
  - [x] Scaffolding E2E tests verifying files can be uploaded and viewed under Client/Contract/Vehicle lists respectively.

## Dev Notes

### Technical Requirements
- **Referential Integrity Validation:** Always verify the target entity (Client, Contract, or Vehicle) exists in the active tenant schema prior to saving the document relation.
- **Physical Storage Isolation:** Organize files on disk using the tenant UUID subfolder pattern. Use generic file names to prevent directory traversal attacks.

### File Structure Requirements
- Spring Boot Controller: `backend/src/main/java/com/leasrecover/modules/cases/DocumentController.java`
- Next.js Component: `frontend/src/features/cases/components/EntityDocumentVault.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L671-L685)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L496-L498)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L109-L131)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Dynamic loading warning handled correctly during maven tests.
- PowerShell array-parameter parser issue in `-Dtest` resolved by adding quoting.

### Completion Notes List

- Implemented database mapping and finder methods for clients, contracts, and vehicles in the general `Document` entity and repository.
- Created `storeEntityDocument` and `getDocumentsForEntity` inside `DocumentUploadService.java` with uploader validation (role `GESTIONNAIRE`, tenant matching) and referential integrity check.
- Added general download logic using `loadDocumentAsResource(UUID)` supporting direct entity-level downloads.
- Exposed the general REST endpoints (`POST`, `GET`, and `download`) in `DocumentController.java`.
- Set up BFF Next.js route proxies at `/api/documents` and `/api/documents/[docId]/download` to seamlessly handle multi-part file uploads, list requests, and binary download streams.
- Designed `EntityDocumentVault.js` using Ant Design for drag-and-drop file uploads and responsive list views.
- Created premium Details Drawers for Clients and Contracts inside `leasing/page.js` to view metadata and mount the `EntityDocumentVault` tabs for Clients, Contracts, and Vehicles.
- Wrote extensive Unit and MockMvc integration tests for services, controllers, and React components, all passing 100%.

### File List

- `backend/src/main/java/com/leasrecover/modules/cases/Document.java`
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/dto/DocumentResponse.java`
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentUploadService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentController.java`
- `backend/src/main/java/com/leasrecover/modules/contract/dto/ContractResponse.java`
- `backend/src/test/java/com/leasrecover/modules/cases/DocumentUploadServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/DocumentControllerTest.java`
- `frontend/src/app/api/documents/route.js`
- `frontend/src/app/api/documents/[docId]/download/route.js`
- `frontend/src/features/cases/components/EntityDocumentVault.js`
- `frontend/src/app/(dashboard)/leasing/page.js`
- `frontend/src/__tests__/EntityDocumentVault.test.js`
