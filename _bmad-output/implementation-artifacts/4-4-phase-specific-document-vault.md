# Story 4.4: Phase-Specific Document Vault

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to upload and consult case documents specifically bound to a recovery phase,  
so that my legal paperwork is neatly organized and traceable over the entire case history.

## Acceptance Criteria

1. **Given** I am in a specific phase (e.g., "Mise en demeure")  
   **When** I upload a relevant document (PDF, images)  
   **Then** the document is physically vaulted and logically associated with both the `case_id` and the `phase_uploaded_in` column (FR23).

2. **Given** the case has multiple historical documents  
   **When** I view the dossier's document tab  
   **Then** I can see all documents correctly grouped by the phase they were uploaded in (FR24).

## Tasks / Subtasks

- [x] Task 1. Backend Local Storage Configuration & Properties (AC: #1)
  - [x] Add storage configuration property `leasrecover.upload.dir` in `application.yml` (defaulting to a local path like `./uploads/` which can be mapped to Docker persistent volumes).
  - [x] Create a configuration bean or initializer `FileStorageConfig.java` in `com.leasrecover.config` to verify the upload directory exists and is writeable on application startup.

- [x] Task 2. Scaffolding Document Repository & Upload Service (AC: #1, #2)
  - [x] Create `DocumentRepository.java` in `com.leasrecover.modules.cases` extending `JpaRepository` supporting queries like `findAllByCaseIdAndIsDeletedFalse`.
  - [x] Implement `DocumentUploadService.java` in `com.leasrecover.modules.cases`:
    - [x] `storeDocument(UUID caseId, MultipartFile file, String phaseStr, String uploaderEmail)`:
      - Retrieve the target `RecoveryCase` and uploader `AppUser` via context.
      - Validate file type: Only allow PDF and standard images (JPEG, PNG). Reject files exceeding 10MB.
      - Generate a secure file name using `UUID.randomUUID()` combined with the file extension to prevent collision attacks.
      - Build target storage path nested by tenant UUID: `${upload.dir}/${tenantId}/${fileName}`. Save the bytes to the disk.
      - Scaffolding a new `Document` entity:
        - Set ID using `UuidCreator.createUuidV7()`.
        - Set `tenantId`, `caseId`, `uploader`, `fileName` (original name), `fileUrl` (pointing to the retrieval endpoint), and `phaseUploadedIn` (using the `phaseStr` value).
        - Save `Document` record in the database.

- [x] Task 3. Spring Boot REST Controllers for Document Vault (AC: #1, #2)
  - [x] Create response DTO `DocumentResponse.java` in `com.leasrecover.modules.cases.dto` returning: `id`, `fileName`, `fileUrl`, `phaseUploadedIn`, `uploaderName` (first + last name), `createdAt` (ZonedDateTime).
  - [x] Add REST endpoints in `CaseController.java`:
    - `POST /api/v1/cases/{id}/documents` -> Accepts `@RequestParam("file") MultipartFile file`, `@RequestParam("phase") String phase` and the uploader header `X-User-Email`. Returns the saved `DocumentResponse` wrapped in JSend success.
    - `GET /api/v1/cases/{id}/documents` -> Fetches all case documents. Returns a JSend envelope containing a list of `DocumentResponse` items.
    - `GET /api/v1/cases/{id}/documents/{docId}/download` -> Resolves the file from the local storage disk and returns the binary stream via `ResponseEntity<Resource>` with headers `Content-Disposition: attachment; filename="..."` and the correct Content-Type (e.g. `application/pdf`).
    - Secure all endpoints to `GESTIONNAIRE` role.

- [x] Task 4. Next.js Document Tab & Ant Design Upload UI (AC: #1, #2)
  - [x] In the case detail page (`frontend/src/app/(dashboard)/cases/[id]/page.js`), implement the **Documents** Tab.
  - [x] Group and render documents by the 5 phases (using Ant Design `<Collapse>`):
    - [x] Pré-contentieux
    - [x] Mise en demeure
    - [x] Saisie du véhicule
    - [x] Vente
    - [x] Clôture
  - [x] In each phase's section, display a list of uploaded documents showing filename, uploader name, upload date, and a clickable link pointing to the download endpoint.
  - [x] Provide an `<Upload>` drag-and-drop zone under the current active phase section, enabling users to upload files directly.
  - [x] On file upload completion, display a toast `notification.success({ message: "Fichier ajouté au dossier." })` and reload the document list.

- [x] Task 5. Unit & Integration Testing (AC: #1, #2)
  - [x] Write integration tests in `DocumentUploadServiceTest.java` verifying that invalid files (e.g. executables, large files) are rejected and that successful uploads save files to disk and records to the database.
  - [x] Write controller tests verifying JSend envelope outputs and proper HTTP file download headers.
  - [x] Scaffolding E2E tests verifying files can be uploaded and appear correctly under their corresponding phase container.

## Dev Notes

### Technical Requirements
- **Directory Security:** Ensure uploaded files are stored outside the web root to prevent arbitrary code execution attacks.
- **Tenant Path Isolation:** Organize files on disk into subfolders by tenant UUID to enforce physical separation of binary data files on the storage system.
- **Transactional Consistency:** Store files to disk *before* committing the database transaction. If the database save fails, ensure the uploaded disk file is cleaned up (deleted) to prevent orphaned storage waste.

### File Structure Requirements
- Spring Boot Service: `backend/src/main/java/com/leasrecover/modules/cases/DocumentUploadService.java`
- Next.js Upload components: `frontend/src/app/(dashboard)/cases/[id]/components/` or `frontend/src/features/cases/components/`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L510-L524)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L496-L498)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L109-L131)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (Thinking)

### Debug Log References

- Name clash: `PdfExportService.java` used `Document` as variable name (`com.lowagie.text.Document`) which shadowed our new `com.leasrecover.modules.cases.Document` entity after introduction. Fixed by renaming variable to `pdfDoc` and adding explicit `import com.lowagie.text.Document`.
- UnnecessaryStubbingException: `@MockitoSettings(strictness = Strictness.LENIENT)` added to `DocumentUploadServiceTest` because `fileStorageConfig.getUploadDir()` was stubbed in `@BeforeEach` but not called in early-rejection tests.

### Completion Notes List

- All 27 tests pass (17 CaseControllerTest + 10 DocumentUploadServiceTest). BUILD SUCCESS.
- Upload validation enforces: PDF/JPEG/PNG only, ≤10 MB, non-empty files, GESTIONNAIRE role, tenant isolation.
- Transactional safety: disk file is cleaned up if DB save fails (verified by test + WARN log confirming cleanup ran).
- Documents tab in frontend uses Ant Design `<Collapse>` grouped by the 5 recovery phases with `<Dragger>` upload zone under the active phase only.
- API proxy routes created at `/api/cases/[id]/documents/route.js` and `/api/cases/[id]/documents/[docId]/download/route.js`.

### File List

- `backend/src/main/resources/application.yml` — MODIFIED (Added `leasrecover.upload.dir`)
- `backend/src/main/java/com/leasrecover/config/FileStorageConfig.java` — NEW
- `backend/src/main/java/com/leasrecover/modules/cases/Document.java` — NEW (JPA entity)
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentRepository.java` — NEW
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentUploadService.java` — NEW
- `backend/src/main/java/com/leasrecover/modules/cases/dto/DocumentResponse.java` — NEW
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java` — MODIFIED (document endpoints + DocumentUploadService injection)
- `backend/src/main/java/com/leasrecover/modules/cases/PdfExportService.java` — MODIFIED (fixed Document variable name clash → pdfDoc)
- `backend/src/test/java/com/leasrecover/modules/cases/DocumentUploadServiceTest.java` — NEW (10 tests)
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java` — MODIFIED (added 3 document controller tests)
- `frontend/src/app/(dashboard)/cases/[id]/page.js` — MODIFIED (Documents tab with DocumentsTab component)
- `frontend/src/app/api/cases/[id]/documents/route.js` — NEW
- `frontend/src/app/api/cases/[id]/documents/[docId]/download/route.js` — NEW
