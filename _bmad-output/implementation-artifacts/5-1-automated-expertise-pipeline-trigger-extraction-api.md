# Story 5.1: Automated Expertise Pipeline Trigger & Extraction API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As the System,  
I want to automatically trigger the external FastAPI AI pipeline when an expertise report is uploaded during the "Saisie du véhicule" phase,  
so that the system can begin extracting the core data (Market Value, Brand, Model) securely without manual user intervention.

## Acceptance Criteria

1. **Given** the Dossier is actively in the `Saisie du véhicule` phase  
   **When** a Gestionnaire uploads a file tagged as "Expertise Report"  
   **Then** the Spring Boot backend securely triggers an asynchronous request to the FastAPI service (FR25).  
   **And** the FastAPI service extracts the target data metrics (FR27) and returns them to the main API.

## Tasks / Subtasks

- [x] Task 1. FastAPI Project Initialization & Dependency Setup (AC: #2)
  - [x] Initialize Python environment in `ai-service/` using a standard `requirements.txt`:
    - Dependencies: `fastapi==0.135.1`, `uvicorn[standard]`, `pydantic[email]>=2.0`, `requests`, `python-multipart`.
  - [x] Implement `main.py` to bootstrap FastAPI with CORS configurations enabling bridge network requests from the Spring Boot container.
  - [x] Implement `config.py` in `app/core/` to resolve environment variables.

- [x] Task 2. FastAPI Document Extraction Endpoint & Pydantic Models (AC: #2)
  - [x] Create Pydantic schema models in `app/schemas/`:
    - `ExtractionRequest`: capturing metadata variables (`caseId`, `tenantId`, `webhookUrl`).
    - Configured Pydantic models with `alias_generator` to serialize input/output fields to `camelCase` (matching the API standard).
  - [x] Scaffolding REST endpoint `POST /api/extract` in `app/api/routes/extraction.py`:
    - Accepts form-data file `file: UploadFile` and JSON metadata (`caseId: UUID`, `tenantId: UUID`, `webhookUrl: HttpUrl`).
    - Validate that the file is a PDF. If not, throw HTTP 400.
    - Spawn a Python `BackgroundTasks` thread to process the extraction asynchronously.
    - Return HTTP `202 Accepted` immediately with a payload `{ "status": "success", "message": "Extraction process scheduled in the background" }`.

- [x] Task 3. FastAPI Background Extraction Service (AC: #2)
  - [x] Implement `llm_extraction.py` under `app/services/`:
    - Define the background task mapping (accepting file bytes, case ID, tenant ID, and webhook URL).
    - Stub or mock the PDF parsing and LLM API call for the MVP:
      - Simulate a 3-second delay, then trigger a webhook callback to `webhookUrl` with progress=30 (Message: "Lecture du document...").
      - Simulate another 3-second delay, then trigger a webhook callback with progress=70 (Message: "Extraction des données...").
      - Extract metadata values (Brand, Model, Year, Mileage, Condition, Market Value in cents).
      - Final callback (progress=100) sending the extracted fields in the payload:
        ```json
        {
          "caseId": "...",
          "tenantId": "...",
          "status": "SUCCESS",
          "stage": "CALCULATION",
          "progress": 100,
          "message": "Calcul d'écart complété.",
          "data": {
            "brand": "BMW",
            "model": "520d",
            "year": 2020,
            "mileage": 87000,
            "condition": "Bon état",
            "marketValueCents": 1840000,
            "currencyCode": "EUR"
          }
        }
        ```
    - Ensure a `try-catch` block catches failures (e.g. LLM timeout) and issues a `status = 'FAILED'` webhook callback.

- [x] Task 4. Spring Boot Extraction Trigger Integration (AC: #1)
  - [x] Create `AIValuationRepository.java` in `com.leasrecover.modules.cases` extending `JpaRepository` mapping the `ai_valuation` table.
  - [x] Scaffolding `AIValuation.java` entity class extending `BaseEntity`.
  - [x] Update `DocumentUploadService.java` to detect expertise report triggers:
    - [x] When a document is uploaded: If the `phaseUploadedIn` is `'SAISIE'` (or `'SAISIE_VEHICULE'`) and the file tag is `'EXPERTISE_REPORT'`:
      - Initialize a new `AIValuation` entity, set UUID v7, set `tenantId`, `caseId`, `documentId`, and set `status = 'PENDING'`. Save the entity.
      - Trigger an asynchronous call (e.g. using Spring Boot's `@Async` or virtual thread executor) to `POST http://ai-service:8000/api/extract` using `WebClient` or `RestTemplate`.
      - Parameters: Pass the PDF file bytes, case ID, tenant ID, and the local Spring Boot webhook URL (`http://backend:8080/api/v1/internal/webhooks/ai-progress`).
      - Handle client exceptions: If the API call fails to trigger, update `AIValuation` status to `'FAILED'`.

- [x] Task 5. Unit & Integration Testing (AC: #1, #2)
  - [x] Write Python tests in `ai-service/tests/test_extraction.py` using `TestClient` verifying file validation rules and background task spawning.
  - [x] Write integration tests in `DocumentUploadServiceTest.java` mocking the FastAPI HTTP response to assert Spring Boot creates the `AIValuation` record in `PENDING` state and successfully fires the POST request.

## Dev Notes

### Technical Requirements
- **Docker Compose Networking:** Schedulers and REST clients must utilize Docker host names (e.g. `http://ai-service:8000/` and `http://backend:8080/`) rather than `localhost` when communicating between containers in the Docker bridge network.
- **Transactional Independence:** The FastAPI asynchronous trigger should run *outside* the file upload database transaction. If the network call to the AI service fails, the document must remain saved in the database.
- **Scale constraints:** Ensure the FastAPI background thread pool is bounded to prevent resource exhaustion when multiple files are uploaded concurrently.

### File Structure Requirements
- FastAPI application entry: `ai-service/main.py`
- FastAPI extraction routes: `ai-service/app/api/routes/extraction.py`
- Spring Boot entity: `backend/src/main/java/com/leasrecover/modules/cases/AIValuation.java`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L525-L540)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L487-L490)
- Database schema: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L149-L174)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Mockito RestTemplate mock mismatch resolved by updating `CaseControllerTest.java` to use the 5-parameter signature.
- `RestTemplate` missing import in `DocumentUploadServiceTest.java` resolved.

### Completion Notes List

- Bootstrap Python FastAPI service under `ai-service/` with required dependencies (FastAPI, uvicorn, Pydantic, requests, python-multipart, httpx) and CORS support.
- Implement ExtractionRequest schema and REST endpoint `POST /api/extract` to validate file types (PDF) and parameters, and schedule background extraction task.
- Implement mock background extraction task that sleep-simulates states (Lecture -> Extraction -> Calcul) and issues webhook callback requests to Spring Boot.
- Implement JPA entity `AIValuation` extending `BaseEntity` and repository `AIValuationRepository` mapping the `ai_valuation` table.
- Implement automatic trigger detection and async virtual-thread execution logic in `DocumentUploadService.java` to call FastAPI extraction endpoint upon uploading documents under `SAISIE` phase.
- Write full Python unit tests (`ai-service/tests/test_extraction.py`) and Java integration tests (`DocumentUploadServiceTest.java`, `CaseControllerTest.java`) and verify they all pass.
- Address and resolve Senior Developer Code Review findings (ThreadContext JPA schema resolution on async thread, Case database phase validation, REST timeouts, externalized Webhook URL, security config permitting webhook calls, and async test assertion timeout).

### File List

- `ai-service/requirements.txt`
- `ai-service/app/core/config.py`
- `ai-service/app/schemas/extraction.py`
- `ai-service/app/services/llm_extraction.py`
- `ai-service/app/api/routes/extraction.py`
- `ai-service/app/main.py`
- `ai-service/tests/test_extraction.py`
- `backend/src/main/java/com/leasrecover/modules/cases/AIValuation.java`
- `backend/src/main/java/com/leasrecover/modules/cases/AIValuationRepository.java`
- `backend/src/main/java/com/leasrecover/modules/cases/DocumentUploadService.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- `backend/src/test/java/com/leasrecover/modules/cases/DocumentUploadServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java`
- `backend/src/main/resources/application.yml`
- `backend/src/main/java/com/leasrecover/config/SecurityConfig.java`

## Senior Developer Review (AI)

- **Status**: APPROVED
- **Reviewer**: AI Adversarial Reviewer / Sonia (Karim config)
- **Date**: 2026-07-02
- **Summary**: Conducted adversarial code review. Found 2 High/Critical and 4 Medium issues. All identified issues have been successfully fixed and verified:
  1. **Thread Context Routing**: Fixed critical thread local schema exception in `DocumentUploadService` by setting and clearing `TenantContextHolder` context variables on the virtual thread spawned by `CompletableFuture.runAsync`.
  2. **Phase Validation**: Fixed AC phase validation by checking `recoveryCase.getCurrentPhase() == RecoveryPhase.SAISIE` inside `isExpertiseReportTrigger` instead of just checking the requested `phaseStr` folder parameter.
  3. **Security Bypass**: Added request pattern exception in `SecurityConfig.java` to exempt `/api/v1/internal/webhooks/**` from stateless JWT requirements.
  4. **Infinite Timeout**: Configured `RestTemplate` in `DocumentUploadService` with connect and read timeouts (5000ms) to prevent resource leaks.
  5. **Hardcoded webhook URL**: Externalized the FastAPI callback webhook URL as `app.ai-service.webhook-url` in `application.yml`.
  6. **Async Test Flakiness**: Added `timeout(2000)` verification check on the mock `RestTemplate` in `DocumentUploadServiceTest.java` to block-assert successful execution of the async task in the background.
