# Story 5.2: Asynchronous AI Pipeline & 3-Stage Feedback UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to reliably see what the AI is doing while I wait for the expertise report to be analyzed,  
so that I don't feel like the platform has frozen during the processing latency.

## Acceptance Criteria

1. **Given** an expertise report has just been uploaded  
   **When** the FastAPI backend processes the document  
   **Then** Server-Sent Events (SSE) or WebSockets dispatch state changes back to the Next.js client.  
   **And** the `AIUploadZone` component visually narrates the progression exactly through the 3 expected states (Lecture -> Extraction -> Calcul) (UX-DR4).

## Tasks / Subtasks

- [x] Task 1. Spring Boot Webhook Endpoint & SSE Emitter Map (AC: #1)
  - [x] Implement `ValuationProgressService.java` in `com.leasrecover.modules.notification` managing active connections:
    - Keep a thread-safe map `private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();`
    - Define method `registerEmitter(UUID caseId)` returning a `SseEmitter` (set timeout to 120,000ms, register `onCompletion` and `onTimeout` callbacks to remove the emitter from the map).
    - Define method `sendProgress(UUID caseId, Object payload)` to look up the emitter and send event:
      ```java
      emitter.send(SseEmitter.event().name("progress").data(payload));
      ```
  - [x] Implement endpoint `GET /api/v1/cases/{id}/valuation-progress` in `CaseController.java`:
    - Calls `valuationProgressService.registerEmitter(caseId)` and returns the emitter.
  - [x] Implement webhook endpoint `POST /api/v1/internal/webhooks/ai-progress` in `CaseController.java`:
    - Accepts the progress update payload from FastAPI.
    - Dispatches the payload to `valuationProgressService.sendProgress(caseId, payload)`.
    - If status is `'SUCCESS'` or `'FAILED'`, update the corresponding `AIValuation` status in the database, commit the write, and call `emitter.complete()` to close the stream.

- [x] Task 2. Next.js BFF Proxy API Route (BFF Pattern Hook) (AC: #1)
  - [x] Create BFF route handler at `frontend/src/app/api/cases/[id]/progress/route.js`:
    - Handles GET requests.
    - Reads session auth cookies, retrieves the target tenant ID, and forwards them as headers to the Spring Boot endpoint `GET http://backend:8080/api/v1/cases/{id}/valuation-progress`.
    - Returns a `ReadableStream` to the browser, piping the incoming SSE byte chunks directly to the client.
    - *Rationale:* Browser native `EventSource` API does not support custom headers. Proxying SSE via Next.js BFF secures tokens in HTTP cookies and prevents exposing session tokens in query parameters.

- [x] Task 3. Next.js Upload & SSE Hook (AC: #1, #2)
  - [x] Scaffolding `AIUploadZone.js` in `frontend/src/features/cases/components/` (UX-DR4):
    - [x] Add drag-and-drop file upload interface accepting `.pdf` documents.
    - [x] On file upload completion, initiate `EventSource` connection to `/api/cases/${caseId}/progress`.
    - [x] Parse incoming JSON chunks and update state:
      - `progress <= 30`: Display `📄 Lecture du document...` and progress percentage (0-30%).
      - `progress > 30 && progress <= 70`: Display `🔍 Extraction des données...` and progress percentage (30-70%).
      - `progress > 70 && progress < 100`: Display `📊 Calcul...` and progress percentage (70-99%).
      - `progress == 100`: Display extraction completion success and close the SSE connection.
    - [x] Render dynamic Ant Design `<Progress>` bar updating its percentage live.

- [x] Task 4. Unit & Integration Testing (AC: #1, #2)
  - [x] Write integration tests in `ValuationProgressServiceTest.java` verifying that multiple concurrent SSE emitters register, stream individual payloads, and close without leaks.
  - [x] Write tests in the Next.js API route verifying that unauthenticated requests to `/api/cases/[id]/progress` are blocked, and verified sessions successfully stream mock backend events.

## Dev Notes

### Technical Requirements
- **Loom/Virtual Threads Compatibility:** Spring Boot 4 virtual threads process blocking SSE connections with negligible memory footprint. Emitters must be closed on timeout or client disconnect to avoid mapping leaks.
- **SSE Data Formatting:** Ensure the SSE event payload contains exactly valid JSON strings containing `caseId`, `progress`, `stage`, and `message`.

### File Structure Requirements
- Spring Boot Service: `backend/src/main/java/com/leasrecover/modules/notification/ValuationProgressService.java`
- Next.js BFF route: `frontend/src/app/api/cases/[id]/progress/route.js`
- Next.js UI component: `frontend/src/features/cases/components/AIUploadZone.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L541-L554)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L487-L490)
- UI Specifications: [ux-design-specification.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/ux-design-specification.md#L373-L400)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- No compilation or test failures occurred during verification.

### Completion Notes List

- Implement `ValuationProgressService` managing active SSE emitter connections with a thread-safe ConcurrentHashMap and callbacks for timeout/completion/error.
- Expose the progress SSE stream endpoint `GET /api/v1/cases/{id}/valuation-progress` and the internal FastAPI progress webhook `POST /api/v1/internal/webhooks/ai-progress` in `CaseController.java`.
- Create a Next.js BFF proxy API route at `frontend/src/app/api/cases/[id]/progress/route.js` that verifies cookies, extracts tenant ID and user email, and pipes the backend SSE connection.
- Scaffold the `AIUploadZone.js` frontend React component with a drag-and-drop PDF upload zone, progress stream EventSource connection, 3-stage user interface feedback narration (Lecture, Extraction, Calcul), and active Ant Design `<Progress>` bar.
- Write and run comprehensive backend integration tests in `ValuationProgressServiceTest.java` and frontend Jest tests in `progress-route.test.js`, passing 100% of test suites with 0 regressions.

### File List

- `backend/src/main/java/com/leasrecover/modules/notification/ValuationProgressService.java`
- `backend/src/main/java/com/leasrecover/modules/notification/AiProgressPayload.java`
- `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- `backend/src/test/java/com/leasrecover/modules/notification/ValuationProgressServiceTest.java`
- `frontend/src/app/api/cases/[id]/progress/route.js`
- `frontend/src/features/cases/components/AIUploadZone.js`
- `frontend/src/__tests__/progress-route.test.js`

## Senior Developer Review (AI)

- **Status**: APPROVED
- **Reviewer**: AI Adversarial Reviewer / Sonia (Karim config)
- **Date**: 2026-07-02
- **Summary**: Conducted adversarial code review. All tasks, files, and acceptance criteria were validated.
  - **Verification**: Backend and frontend tests pass 100% with no regressions. Code quality is high, implementing proper error handling, thread safety, and resource cleanups.
