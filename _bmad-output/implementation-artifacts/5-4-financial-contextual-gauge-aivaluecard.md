# Story 5.4: Financial Contextual Gauge (AIValueCard)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to consult the final AI estimation result clearly displayed on my dossier via a comparative visual card,  
so that I can make an immediate, informed decision whether to proceed to the Sales phase or flag an issue.

## Acceptance Criteria

1. **Given** the AI pipeline has completed its run successfully  
   **When** I view the Dossier detail screen  
   **Then** the `AIValueCard` is boldly displayed (UX-DR2, FR31).  
   **And** it visually juxtaposes the [Market Value], [Initial Residual], and [Diff] using semantic coloring derived from the calculated risk indicator.

## Tasks / Subtasks

- [x] Task 1. Spring Boot Endpoint for Fetching Valuation (AC: #1)
  - [x] Implement `getValuationByCaseId(UUID caseId)` in `AIValuationService.java` or `CaseService.java` returning `CaseValuationResponse` DTO mapping fields.
  - [x] Add endpoint `GET /api/v1/cases/{id}/valuation` in `CaseController.java`:
    - Secure access to `GESTIONNAIRE` role.
    - Return JSend success envelope containing the valuation DTO.

- [x] Task 2. Next.js AIValueCard Component Scaffolding (AC: #1, #2)
  - [x] Create `AIValueCard.js` under `frontend/src/features/cases/components/` (UX-DR2):
    - [x] Support loading state: If `isLoading` prop is true, render a skeleton loader (using Ant Design's `<Skeleton>` or custom CSS pulse).
    - [x] Format currencies: Convert cents integers (`marketValueCents`, `initialResidualValueCents`, `deviationValueCents`) to decimals (divided by 100) formatting numbers to locale (`fr-TN` or `fr-FR`).
    - [x] Grid Layout: Juxtapose three panels:
      - **Valeur de Marché (Estimée):** Decimals + Currency (e.g. `18 400,00 TND`).
      - **Valeur Résiduelle Initiale:** Decimals + Currency (e.g. `22 000,00 TND`).
      - **Écart (Différence):** Display value and percentage (e.g. `-3 600,00 TND (-16.36%)`).
    - [x] Semantic Coloring: Style the card borders and badge text dynamically:
      - `'RELIABLE'`: Use brand success color `#10B981` (✅ Estimation Fiable).
      - `'MODERATE_RISK'`: Use brand warning color `#F59E0B` (⚠️ Écart Modéré).
      - `'CRITICAL_RISK'`: Use brand critical color `#EF4444` (🚨 Écart Critique).
    - [x] Add slide-up entrance animation using CSS transitions:
      ```css
      @keyframes slideUp {
          from {
              transform: translateY(20px);
              opacity: 0;
          }
          to {
              transform: translateY(0);
              opacity: 1;
          }
      }
      .ai-value-card {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      ```

- [x] Task 3. Case Detail View Integration (AC: #1)
  - [x] In `frontend/src/app/(dashboard)/cases/[id]/page.js`, fetch the case's valuation:
    - [x] Only fetch and render `AIValueCard` if case phase is `SAISIE` or later.
    - [x] Hook into the active SSE progress stream (from Story 5.2):
      - If progress is active: Set `isLoading={true}` on the card.
      - Once success message is received or fetch resolves: Pass data to `AIValueCard` and set `isLoading={false}`.

- [x] Task 4. Unit & Integration Testing (AC: #1, #2)
  - [x] Write frontend unit tests in `AIValueCard.test.js` verifying:
    - Currency numbers are divided by 100 and formatted properly.
    - Correct CSS classes or inline style hex codes are applied matching the `reliabilityIndicator` states.
    - Slide-up animation class is present on mount.

## Dev Notes

### Technical Requirements
- **Visual Exclusive Scope:** Do not render this card on the global dashboard; display it exclusively inside the targeted Case Details screen to prevent cognitive overload.
- **Micro-Animations:** Use smooth bezier transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) for UI animations to ensure the interface feels premium and alive.

### File Structure Requirements
- Next.js component: `frontend/src/features/cases/components/AIValueCard.js`
- Case detail update: `frontend/src/app/(dashboard)/cases/[id]/page.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L569-L581)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L472-L475)
- UI Specifications: [ux-design-specification.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/ux-design-specification.md#L96)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- None

### Completion Notes List

- Implemented backend CaseValuationResponse DTO, AIValuationService getValuationByCaseId method, and CaseController GET endpoint with role checks and tenant validation.
- Created premium visual AIValueCard Next.js React component with glassmorphism, animations, loading skeleton state, and French local currency formatting.
- Integrated the card into the case details page to render in SAISIE or later phases and hook into the live SSE progress stream.
- Wrote frontend Jest unit tests in AIValueCard.test.js and JUnit integration tests in CaseControllerTest.java.
- **Code Review Fixes (Claude Sonnet):**
  - H1: Fixed SSE loading state race condition — wrapped inner fetch in `try/finally` to guarantee `setValuationLoading(false)` always executes. Also added `setValuationLoading(false)` in the SSE outer catch block.
  - M1: Eliminated duplicated inline valuation fetch logic in `fetchData()` — replaced with a call to the standalone `fetchValuation()` function.
  - M2: Added 404 vs 500 distinction in `fetchValuation()` — expected "no valuation yet" (404) is silently ignored; unexpected server errors are logged to the console for debugging.
  - M3: Removed internal `id` field from `CaseValuationResponse` DTO to avoid unnecessary implementation detail leakage to the frontend.
  - L1+L2: Added missing unit tests for `null` data rendering and all three reliability indicator label states (RELIABLE, MODERATE_RISK, CRITICAL_RISK tested separately).

### File List

- [NEW] `backend/src/main/java/com/leasrecover/modules/cases/dto/CaseValuationResponse.java`
- [MODIFY] `backend/src/main/java/com/leasrecover/modules/cases/AIValuationService.java`
- [MODIFY] `backend/src/main/java/com/leasrecover/modules/cases/CaseController.java`
- [MODIFY] `backend/src/test/java/com/leasrecover/modules/cases/CaseControllerTest.java`
- [NEW] `frontend/src/features/cases/components/AIValueCard.js`
- [MODIFY] `frontend/src/app/globals.css`
- [NEW] `frontend/src/app/api/cases/[id]/valuation/route.js`
- [MODIFY] `frontend/src/app/(dashboard)/cases/[id]/page.js`
- [NEW] `frontend/src/__tests__/AIValueCard.test.js`
