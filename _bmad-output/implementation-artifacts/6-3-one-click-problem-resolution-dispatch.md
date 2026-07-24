# Story 6.3: One-Click Problem Resolution Dispatch

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire,  
I want to click directly on a dashboard alert to be instantly routed to the exact action or view required on that dossier,  
so that I don't waste time navigating nested menus to resolve an urgent compliance issue.

## Acceptance Criteria

1. **Given** I see a critical `AlertCard` on my dashboard (e.g., "Mise en demeure deadline approaching")  
   **When** I click the primary Call-To-Action on the card  
   **Then** I am routed deeply into that specific Dossier exactly on the tab or view necessary to resolve the friction (e.g., the exact phase action step) (FR35).

## Tasks / Subtasks

- [x] Task 1. AlertCard CTA Contextual Link Builder (AC: #1)
  - [x] Update `AlertCard.js` under `frontend/src/features/cases/components/` to build context-aware URLs:
    - [x] If `alertType === 'DORMANCY'`: Set target URL to `/cases/${caseId}?tab=notes&focus=noteInput` (routing to case annotations to resolve dormancy).
    - [x] If `alertType === 'DEADLINE'`: Set target URL to `/cases/${caseId}?tab=details&focus=stepper` (routing to phase progression stepper).
    - [x] If `alertType === 'MISSING_PREREQUISITE'`: Set target URL to `/cases/${caseId}?tab=documents&focus=uploadZone` (routing directly to document uploads).
  - [x] Bind the CTA button `"Résoudre l'alerte"` to navigate to the generated URL using Next.js App Router navigation (`router.push`).

- [x] Task 2. Next.js Case Details Context-Aware Tab Initializer (AC: #1)
  - [x] Update case detail page `page.js` in `frontend/src/app/(dashboard)/cases/[id]/`:
    - [x] Import `useSearchParams` hook from `next/navigation`.
    - [x] On component mount: Read the `tab` query parameter:
      - [x] If `tab === 'notes'`: Set active tab state to notes.
      - [x] If `tab === 'documents'`: Set active tab state to documents.
      - [x] Default to details tab.

- [x] Task 3. Auto-Focus Page Actions (AC: #1)
  - [x] Implement focus hooks inside the case detail page view tabs:
    - [x] If `focus === 'noteInput'`: Use a React ref on the Ant Design Input textarea and trigger `.focus()` automatically when notes render.
    - [x] If `focus === 'uploadZone'`: Use `.scrollIntoView({ behavior: 'smooth' })` to focus scroll down to the drag-and-drop file upload component.

- [x] Task 4. E2E/Integration Testing (AC: #1)
  - [x] Scaffolding E2E tests verifying that:
    - [x] Clicking the CTA on a dormancy alert card successfully redirects the user to the case detail page, switches the active tab pane to "Notes", and focuses the cursor inside the text area input field.
    - [x] Clicking the CTA on a deadline alert redirects, opens the main details tab, and highlights the stepper.

## Dev Notes

### Technical Requirements
- **Frictionless UI Navigation:** All layout shifts and tab switches must resolve smoothly. Avoid using hard page refreshes when executing transitions to preserve local states.
- **Reference Cleanliness:** Verify that URLs fallback safely if query parameters are missing or malformed.

### File Structure Requirements
- Next.js Component: `frontend/src/features/cases/components/AlertCard.js`
- Next.js Detail View update: `frontend/src/app/(dashboard)/cases/[id]/page.js`

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L625-L637)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L479-L480)
- UI Specifications: [ux-design-specification.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/ux-design-specification.md#L223)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Frontend test execution log: file:///C:/Users/IlhemBENYEDDER/.gemini/antigravity/brain/fa602dd2-5107-424e-ad81-6106c4038066/.system_generated/tasks/task-270.log
- Backend test execution log: file:///C:/Users/IlhemBENYEDDER/.gemini/antigravity/brain/fa602dd2-5107-424e-ad81-6106c4038066/.system_generated/tasks/task-278.log

### Completion Notes List

- Updated `AlertCard.js` handleAction callback to construct context-aware target URLs based on the active `alertType` ('DORMANCY' redirects to notes & noteInput focus, 'DEADLINE' redirects to details & stepper focus, 'MISSING_PREREQUISITE' redirects to documents & uploadZone focus).
- Updated the Next.js Case Details page (`page.js`) to parse `tab` query parameters on load and dynamically switch the active tab key.
- Wrapped the case details page component default export in a `React.Suspense` block to prevent Next.js static rendering warnings.
- Added React refs and scroll hooks on the notes form, upload zone, and phase stepper components.
- Auto-focused input fields or auto-scrolled/highlighted sections depending on the `focus` parameter value.
- Updated `AlertCard.test.js` and `cases-details.test.js` to mock and verify navigation query params, tab switching, and focused elements.
- [Code Review] Fixed route path in `AlertCard.js` from `/dashboard/cases/${caseId}` to `/cases/${caseId}` to align with Next.js App Router route groups and prevent 404 navigation errors. Updated `AlertCard.test.js` assertions.

### File List

- `frontend/src/features/cases/components/AlertCard.js` [MODIFY]
- `frontend/src/app/(dashboard)/cases/[id]/page.js` [MODIFY]
- `frontend/src/__tests__/AlertCard.test.js` [MODIFY]
- `frontend/src/__tests__/cases-details.test.js` [MODIFY]
