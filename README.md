# LeasRecover

> Multi-tenant SaaS platform that digitizes the vehicle **recovery / repossession workflow** for leasing companies — from pre-litigation through to case closure — with an automated appraisal-report valuation module at its core.

**Status:** MVP feature-complete per the BMad sprint tracker (7 epics, 26 stories, all marked `done`).
**Before you deploy or demo anything, read [`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md).** There are 10 critical findings, including committed credentials and a simulated AI pipeline.

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Domain glossary](#2-domain-glossary)
3. [Personas and roles](#3-personas-and-roles)
4. [The 5-phase workflow](#4-the-5-phase-workflow)
5. [Architecture](#5-architecture)
6. [Repository map](#6-repository-map)
7. [Backend reference](#7-backend-reference)
8. [Frontend reference](#8-frontend-reference)
9. [AI service reference](#9-ai-service-reference)
10. [Running the project](#10-running-the-project)
11. [Things that will bite you on day one](#11-things-that-will-bite-you-on-day-one)

---

## 1. What this project is

### Context

LeasRecover is a **PFE** (*projet de fin d'études* — final-year engineering thesis) by **Ilhem Benyedder**. It was specified using the **BMad Method**, and every planning and implementation artifact lives in [`_bmad-output/`](_bmad-output/). Those documents are the authoritative specification — **read them before the code**:

| Document | What it gives you |
|---|---|
| `_bmad-output/planning-artifacts/product-brief-pfe-2026-02-26.md` | Why the product exists, personas, MVP scope, out-of-scope list |
| `_bmad-output/planning-artifacts/prd.md` | 41 functional requirements (FR01–FR41) + 22 non-functional (NFR01–NFR22) |
| `_bmad-output/planning-artifacts/architecture.md` | Intended technical design *(⚠️ see [drift table](docs/CODE_REVIEW.md#7-architecture-doc-drift) — reality diverges)* |
| `_bmad-output/planning-artifacts/epics.md` | 7 epics broken into stories |
| `_bmad-output/planning-artifacts/mcd.md`, `class_diagram.md` | Data model |
| `_bmad-output/planning-artifacts/ux-design-specification.md` | UI/UX spec, component-level |
| `_bmad-output/implementation-artifacts/*.md` | One file per story with acceptance criteria — **the best source for "why is this code like this"** |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Story completion tracker |

Read them in this order: **product-brief → prd → architecture → ux-design-specification**.

### The business problem

Leasing companies today track repossession cases in **Excel files and paper**. The process fragments badly at one specific point:

When a leased vehicle is repossessed, an **external appraiser** produces an unstructured PDF report. Someone must manually read the estimated market value out of it and compare it against the **initial residual value** written into the original leasing contract. That comparison is what drives the sale-price decision and the accounting provision.

Consequences measured in the product brief:

- **Financial loss** — over- and under-valued vehicles lead to badly calibrated sale decisions and insufficient provisions.
- **Bad decisions** — without a systematic market-vs-residual comparison, managers cannot judge the quality of past financial estimates.
- **Missed legal deadlines** — no automatic alerting on statutory delays (formal notice, seizure, sale).

Target volume: **40–80 active cases per manager**, **300–1000+ per leasing company**.

### The solution

A configurable, multi-tenant web platform that:

1. **Digitizes the full recovery workflow** — 5 sequential phases with state tracking, deadline alerts, and a complete immutable history per case.
2. **Automates the valuation** — uploading the appraisal report triggers extraction of the key fields, computes the deviation against the contract's residual value, and renders a reliability indicator (✅ reliable / ⚠️ moderate / 🚨 critical).
3. **Gives a unified command center** — priority-first case list, actionable critical alerts, filtering by phase / status / alert level.
4. **Is configurable per tenant** — branding, statutory delays per phase, dormancy threshold, and AI deviation thresholds, all changeable without redeployment.

The "aha" moment from the brief: *upload the report → the platform instantly shows market value 18 500 € vs. residual 22 000 €, deviation −16% ⚠️ — 3 seconds instead of 30 minutes.*

> ⚠️ **The automated extraction is currently simulated.** See [§9](#9-ai-service-reference) and [C7 in the code review](docs/CODE_REVIEW.md#c7--the-ai-service-is-entirely-simulated).

### Explicitly out of MVP scope

Automatic generation of legal documents · direct appraiser access · legal-counsel access · per-tenant workflow customisation (the 5 phases are standardised for everyone) · RNVP / vehicle-registration API connectors · advanced analytics · API integration into third-party leasing suites.

---

## 2. Domain glossary

The codebase and UI are predominantly **French**. Keep these terms in French — they map 1:1 onto identifiers.

| Term | Meaning |
|---|---|
| **Dossier de recovery / recovery case** | The central aggregate. One case = one defaulting contract being recovered. Entity: `RecoveryCase`. |
| **Valeur résiduelle initiale** | The residual value fixed in the original leasing contract. The reference point for every comparison. Stored in cents: `RecoveryCase.initialResidualValueCents`. |
| **Rapport d'expertise** | The appraisal report PDF produced by an external vehicle expert. Uploading one during phase `SAISIE` triggers the AI pipeline. |
| **Valeur de marché estimée** | The market value extracted from the appraisal report. `AIValuation.estimatedMarketValueCents`. |
| **Écart / deviation** | `marketValue − residualValue`, stored both as a signed cents amount and as an absolute percentage. |
| **Indicateur de fiabilité** | `RELIABLE` / `MODERATE_RISK` / `CRITICAL_RISK`, derived from the deviation percentage against the tenant's configured thresholds (defaults: 10% and 20%). |
| **Dormance** | A case with no action for longer than the tenant's configured threshold (default 30 days). Raises a `DORMANCY` alert. |
| **Délai légal** | Statutory maximum duration for a phase, configured per tenant per phase (defaults: 15 / 30 / 45 / 60 days). Raises `DEADLINE` alerts. |
| **Tenant** | One leasing company. Gets its own PostgreSQL schema. |
| **Gestionnaire** | Recovery manager — the primary day-to-day user. |
| **Mise en demeure** | Formal notice of default. Phase 2. |
| **Saisie** | Vehicle seizure/repossession. Phase 3. |

---

## 3. Personas and roles

### Personas (from the product brief)

**Sonia B., 34 — Chargée de Recouvrement.** Juggles 30–60 active cases at different stages. Currently loses time hunting through Excel, manually extracting appraisal values, and reconstructing case history for her manager. She has no automatic alerting on legal deadlines.

**Karim T., 40 — Administrateur Plateforme.** Configures the environment before the managers arrive: user accounts, alert thresholds, statutory delays, branding.

**The valuation module** is treated as a **non-human system actor** in the spec — triggered by an upload, it analyses, extracts, compares, computes, and emits the reliability indicator with no human intervention.

### Roles in code

| Role | Scope | Can do |
|---|---|---|
| `SUPER_ADMIN` | Platform, cross-tenant. Lives in the `public` schema (`super_admin` table). | Create / list / deactivate tenants. **Explicitly barred from tenant case data** — enforced in `TenantFilter` (satisfies NFR12). |
| `ADMIN` | One tenant | Everything a Gestionnaire can do, plus: branding, statutory delays, dormancy threshold, AI thresholds, user CRUD. Gated on `/api/v1/admin/**`. |
| `GESTIONNAIRE` | One tenant | Cases: create, read, update, assign, annotate, upload documents, advance phases, export PDF. Clients, contracts, vehicles. |

Roles are stored as **plain strings** on `AppUser.role`, not an enum. Authorization is enforced in three unrelated places — see [High-severity findings](docs/CODE_REVIEW.md#-high).

---

## 4. The 5-phase workflow

`RecoveryPhase` (`backend/src/main/java/com/leasrecover/modules/cases/RecoveryPhase.java`) is a hardcoded linear chain. There is **no backward transition, no skipping, and no reopen**.

```
PRE_CONTENTIEUX  ──►  MISE_EN_DEMEURE  ──►  SAISIE  ──►  VENTE  ──►  CLOTURE
   (pre-           (formal notice        (vehicle      (sale)     (closure,
    litigation)     of default)           seizure)                 terminal)
```

### What each transition does

| Transition | Gate | Side effects |
|---|---|---|
| `→ MISE_EN_DEMEURE` | **None — hook is an empty stub** | Sends a notification email to the client (`EmailService`, fire-and-forget, swallows failures) |
| `→ SAISIE` | **None — hook is an empty stub** | Uploading an appraisal report in this phase triggers the AI pipeline |
| `→ VENTE` | ✅ **Implemented** — requires at least one `AIValuation` with status `SUCCESS` for the case | — |
| `→ CLOTURE` | **None — hook is an empty stub** | — |
| from `CLOTURE` | Throws `IllegalStateException` → surfaces as **HTTP 500** *(bug, should be 409)* | — |

Every successful transition sets `currentPhase`, `phaseStartedAt`, `lastActionAt`, and **auto-resolves any open `DEADLINE` alert** for the case.

`GET /api/v1/cases/{id}/prerequisites` returns `{ nextPhase, isBlocked, missingPrerequisites[] }` — the frontend uses this to lock the stepper (`ConditionalPhaseStepper`) and render an `InlineBlocker`.

### Alerts

| Type | Criticality | Rule | Auto-heals when |
|---|---|---|---|
| `DORMANCY` | `CRITICAL` | `now > (lastActionAt ?? createdAt) + dormancyThresholdDays` | Case is updated, assigned, annotated, or a document is uploaded |
| `DEADLINE` | `WARNING` | `now > phaseExpiry − 2 days` *(the 2-day window is hardcoded)* | Phase advances |
| `DEADLINE` | `CRITICAL` | `now > phaseStartedAt + phaseLegalDelays[phase]` | Phase advances |
| `VEHICLE_DISCREPANCY` | `WARNING` | Extracted brand/model/year ≠ the vehicle on record | A later extraction matches |

`AlertEngineScheduler` runs daily at 02:00 (`app.alerts.cron`, default `0 0 2 * * *`), iterating every active tenant. `VEHICLE_DISCREPANCY` is raised inline by `AIValuationService`, not by the scheduler.

---

## 5. Architecture

```
                        ┌──────────────────────────┐
                        │  Browser                 │
                        │  (no JWT ever reaches it)│
                        └────────────┬─────────────┘
                                     │  HttpOnly, SameSite=Strict cookie
                                     │  session_token = AES-256-GCM(JWT)
                                     │  fetch /api/*
                        ┌────────────▼─────────────┐
                        │  Next.js 16      :3000   │   frontend/
                        │  App Router + BFF        │   29 route handlers decrypt the
                        │  middleware.js guard     │   cookie and re-issue the call
                        └────────────┬─────────────┘
                                     │  Authorization: Bearer <JWT>
                                     │  X-Tenant-ID, X-User-Email
                                     │  /api/v1/*
                        ┌────────────▼─────────────┐
                        │  Spring Boot 4.0.3 :8080 │   backend/
                        │  JwtAuthenticationFilter │
                        │  → TenantFilter          │
                        │  → TenantContextHolder   │
                        └───┬──────────────────┬───┘
                            │                  │  multipart PDF
              JDBC, schema  │                  │  + caseId, tenantId, webhookUrl
              switched per  │                  ▼
              request       │      ┌───────────────────────┐
                            │      │  FastAPI       :8000  │   ai-service/
                            │      │  POST /api/extract    │
                            │      │  → 202 Accepted       │
                            │      └───────────┬───────────┘
                            │                  │  3 webhooks (30% / 70% / 100%)
                            │                  │  POST /api/v1/internal/
                            │◄─────────────────┘       webhooks/ai-progress
                ┌───────────▼──────────┐
                │  PostgreSQL 16 :5432 │
                │  public + tenant_<id>│
                └──────────────────────┘

   SSE path:  backend  ──text/event-stream──►  Next.js BFF  ──►  browser
              GET /api/v1/cases/{id}/valuation-progress
                    proxied at /api/cases/{id}/progress
```

### Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Frontend | Next.js | **16.1.6** | App Router, Turbopack. **Plain JavaScript — no TypeScript.** |
| | React | 19.2.3 | Every page is `'use client'`; no Server Components, no Server Actions |
| | Ant Design | **6.3.5** | + `@ant-design/nextjs-registry` for SSR style extraction. *(Spec said v5.)* |
| | Styling | inline `style={{}}` | No Tailwind, no CSS modules in use. No design-token file. |
| | Testing | Jest 30 + jsdom + RTL 16 | via `next/jest` |
| Backend | Spring Boot | **4.0.3** | Spring Framework 7, Jakarta EE 11, virtual threads |
| | Java | **21** | LTS, required by Boot 4 |
| | Persistence | Spring Data JPA + Hibernate 7, **Envers**, **Flyway** | Envers is applied to `RecoveryCase` only |
| | Security | Spring Security + JJWT 0.12.5 | HS256, 24h token, BCrypt passwords |
| | Other | OpenPDF 2.0.2, Spring Mail, Actuator, Lombok | PDF export, SMTP notification |
| AI | FastAPI | 0.135.1 | Python 3.11 |
| | | | **No LLM / OCR / PDF library is installed.** |
| DB | PostgreSQL | **16** | *(Spec said 18; compose pins 16 with a comment explaining why.)* |
| Infra | Docker Compose | — | `docker-compose.yml` + `docker-compose.dev.yml` override |

### Multi-tenancy — schema per tenant

This is the single most important thing to understand about the backend.

**Model:** one PostgreSQL database. The `public` schema holds `tenant`, `super_admin`, `global_configuration`. Every tenant gets its own schema named `tenant_<uuid with dashes stripped>`.

**Request lifecycle:**

1. **`JwtAuthenticationFilter`** (`@Order(1)`, also registered inside the Spring Security chain) reads `Authorization: Bearer …`, validates it, and puts a `UserPrincipal{userId, email, tenantId, role, name}` into the `SecurityContext` with a single authority `ROLE_<role>`.
2. **`TenantFilter`** (`@Order(2)`) then:
   - forces schema `public` for `/api/v1/super-admin/**` and passes through;
   - otherwise reads `tenantId` / `email` from the principal (falling back to the `X-Tenant-ID` / `X-User-Email` **headers** if `app.security.allow-header-fallback` is true — **it defaults to true**, see [C4](docs/CODE_REVIEW.md#c4--header-fallback-authentication-is-on-by-default));
   - returns 403 if a super-admin tries to reach tenant data (NFR12);
   - verifies the tenant exists and is `ACTIVE`;
   - sets `TenantContextHolder` (two ThreadLocals: schema name + tenant UUID);
   - loads the `AppUser` **inside the tenant schema**, 403 if missing or `INACTIVE`;
   - requires DB role `ADMIN` for `/api/v1/admin/**`;
   - **always clears both ThreadLocals in `finally`**.
3. **`TenantIdentifierResolver`** reads the ThreadLocal (defaulting to `"public"` if unset) and **`TenantConnectionProvider`** calls `connection.setSchema(...)` on acquisition, resetting to `public` on release. Wired via `JpaConfig`'s `HibernatePropertiesCustomizer`.
4. Services *additionally* re-check `entity.getTenantId()` against the context as defence in depth.

> **Ordering caveat:** `TenantFilter` runs *after* the whole Spring Security authorization chain. That is why every tenant and role rule had to be re-implemented inside the filter and again inside the services. It works, but it is why authorization is scattered.

**Migrations:**
- `db/migration/public/` runs automatically at boot (`spring.flyway.locations`).
- `db/migration/tenant/` runs **programmatically, only inside `TenantProvisioningService.provisionTenant()`**. There is no loop that migrates already-existing tenants — see [C9](docs/CODE_REVIEW.md#c9--tenant-migrations-never-reach-existing-tenants).

### Audit trail

Hibernate **Envers**. Only `RecoveryCase` carries `@Audited` (with `@AuditOverride` excluding the `BaseEntity` columns and relations marked `NOT_AUDITED`). Revisions land in `recovery_case_aud` + `revinfo`; `AuditRevisionListener` stamps the acting user's email from `UserContextHolder`, which `TenantFilter` populates.

`CaseHistoryService` reads revisions via `AuditReaderFactory`, diffs consecutive ones into `HistoryEventResponse` objects, and merges in `Note` records to produce the timeline shown in the UI and rendered into the PDF export.

Notes, documents, valuations, alerts and users are **not** audited.

### The AI pipeline, step by step

1. Manager uploads a PDF on the case's **Documents** tab while the case is in phase `SAISIE`.
2. `DocumentUploadService.isExpertiseReportTrigger()` fires only if **all** of: case phase is `SAISIE`, the form `phase` field is `SAISIE`/`SAISIE_VEHICULE`, and either `tag == "EXPERTISE_REPORT"` or (no tag and the filename contains `expertise` or `rapport`).
3. The file is written to disk, a `Document` row and an `AIValuation` row with `status = PENDING` are saved.
4. On a **virtual thread**, a `RestTemplate` multipart POST goes to `${AI_SERVICE_URL}/api/extract` carrying `file`, `caseId`, `tenantId`, `webhookUrl` (5s connect/read timeouts).
5. FastAPI validates the PDF, returns **202**, and runs the extraction as a `BackgroundTask`.
6. FastAPI posts three webhooks to `${AI_SERVICE_WEBHOOK_URL}`:
   `PENDING/READING/30%` → `PENDING/EXTRACTION/70%` → `SUCCESS/CALCULATION/100%` with the extracted data. On error: `FAILED/EXTRACTION/100%`.
7. `InternalWebhookController` derives the tenant schema from `payload.tenantId`, sets the context, and calls `AIValuationService.processWebhookCallback`.
8. On `SUCCESS`: the latest `PENDING` valuation is filled in, the deviation is computed against `initialResidualValueCents`, the reliability band is resolved against the tenant thresholds, and a `VEHICLE_DISCREPANCY` alert is raised or resolved by comparing brand/model/year against the vehicle on record.
9. Every step is pushed to the browser as an **SSE** `progress` event from `ValuationProgressService` (in-memory emitter map, 120s timeout), proxied by the BFF at `/api/cases/{id}/progress`.
10. The UI (`AIUploadZone`) narrates the stages and, on success, refetches `/api/cases/{id}/valuation` to render `AIValueCard`.

---

## 6. Repository map

```
PFE/
├── README.md                        ← you are here
├── docs/CODE_REVIEW.md              ← issue register, read before changing anything
├── docker-compose.yml               ← postgres + backend + frontend + ai-service
├── docker-compose.dev.yml           ← volume mounts + hot reload overrides
├── .env.example                     ← ⚠️ incomplete, see §10
├── .gitignore                       ← allowlist style: ignores /* then re-adds paths
│
├── _bmad-output/                    ← THE SPECIFICATION. Start here.
│   ├── planning-artifacts/          product-brief · prd · architecture · epics
│   │                                mcd · class_diagram · use-case-diagrams
│   │                                ux-design-specification (+ .html)
│   │                                implementation-readiness-report
│   └── implementation-artifacts/    26 story files (1-1 … 7-3) + sprint-status.yaml
│
├── backend/                         SPRING BOOT 4.0.3 · Java 21 · Maven
│   ├── pom.xml
│   ├── Dockerfile                   ⚠️ runs `mvnw spring-boot:run`, not a jar
│   └── src/
│       ├── main/java/com/leasrecover/
│       │   ├── LeasRecoverApplication.java
│       │   ├── _common/
│       │   │   ├── audit/           AuditRevisionEntity · AuditRevisionListener
│       │   │   ├── dto/             JSendResponse<T> {status, data, message}
│       │   │   ├── entity/          BaseEntity (id, version, createdBy, isDeleted,
│       │   │   │                                deletedAt, createdAt, updatedAt)
│       │   │   └── util/            UuidCreator (UUID v7)
│       │   ├── config/
│       │   │   ├── SecurityConfig · JpaConfig · FileStorageConfig
│       │   │   └── tenant/          TenantConnectionProvider
│       │   │                        TenantIdentifierResolver · TenantFilter
│       │   ├── core/
│       │   │   ├── GlobalExceptionHandler  (@ControllerAdvice)
│       │   │   ├── tenant/          TenantContextHolder (ThreadLocal)
│       │   │   └── user/            UserContextHolder   (ThreadLocal, for Envers)
│       │   └── modules/
│       │       ├── auth/            AuthController · JwtService
│       │       │                    JwtAuthenticationFilter · UserPrincipal
│       │       ├── superadmin/      SuperAdmin · SuperAdminTenantController
│       │       ├── tenant/          Tenant · TenantConfig
│       │       │                    TenantProvisioningService
│       │       │                    AdminProvisioningService
│       │       │                    TenantBrandingController · TenantConfigController
│       │       ├── users/           AppUser · UserManagementService
│       │       │                    AdminUserManagementController
│       │       ├── client/          Client + CRUD
│       │       ├── contract/        Contract + CRUD
│       │       ├── cases/           ★ the core — 30 files
│       │       │   RecoveryCase · RecoveryPhase · Vehicle · Document · Note
│       │       │   AIValuation · CaseAlert
│       │       │   CaseController (also hosts InternalWebhookController
│       │       │                   and DashboardAlertController)
│       │       │   DocumentController
│       │       │   CaseService · CaseSpecification · CaseHistoryService
│       │       │   CasePrerequisiteService · CaseAlertService
│       │       │   AlertEngineService · AlertEngineScheduler
│       │       │   AIValuationService · DocumentUploadService
│       │       │   VehicleService · PdfExportService
│       │       └── notification/    EmailService · ValuationProgressService (SSE)
│       │                            AiProgressPayload
│       ├── main/resources/
│       │   ├── application.yml      ⚠️ contains committed SMTP credentials
│       │   └── db/migration/
│       │       ├── public/          V1__init_global_schema · V1.1__seed_super_admin
│       │       └── tenant/          V1__init_tenant_schema
│       │                            V2__add_case_audit_tables
│       │                            V3__add_case_alerts_table
│       └── test/java/…              29 files, ~185 tests
│
├── frontend/                        NEXT.JS 16 · JavaScript · Ant Design 6
│   ├── package.json · next.config.mjs · jsconfig.json · jest.config.js
│   ├── Dockerfile                   ⚠️ runs `npm run dev`
│   └── src/
│       ├── middleware.js            route guard (cookie decrypt only)
│       ├── app/
│       │   ├── layout.js · page.js  root layout + redirect to /login
│       │   ├── globals.css · page.module.css   (the latter is unused)
│       │   ├── (auth)/login/
│       │   ├── (admin)/             layout + tenants/
│       │   ├── (dashboard)/         layout + cases/ · cases/new/ · cases/[id]/
│       │   │                        leasing/ · settings/{tenant,compliance}/
│       │   └── api/                 ★ 29 BFF route handlers — see §8
│       ├── components/ui/           InlineBlocker
│       ├── features/cases/components/
│       │                            AIUploadZone · AIValueCard · AlertCard
│       │                            ConditionalPhaseStepper
│       │                            EntityDocumentVault · VehicleDetailsCard
│       ├── lib/                     crypto.js (AES-GCM cookie sealing)
│       │                            branding-context.js
│       └── __tests__/               10 files
│
└── ai-service/                      FASTAPI · Python 3.11
    ├── requirements.txt · Dockerfile
    ├── app/
    │   ├── main.py                  app factory, CORS, /health
    │   ├── api/routes/extraction.py POST /api/extract
    │   ├── core/config.py           ⚠️ defined but never imported anywhere
    │   ├── schemas/extraction.py    Pydantic, camelCase alias generator
    │   └── services/llm_extraction.py  ⚠️ SIMULATED — no LLM, no PDF parsing
    └── tests/test_extraction.py     3 tests
```

---

## 7. Backend reference

Base path: **`/api/v1`**. All JSON responses use the **JSend envelope**: `{ "status": "success", "data": … }`. Binary responses (PDF export, document download) bypass the envelope.

### Endpoints

The **Role** column shows what is **actually enforced in code** — which is not always what you would expect. See [S-7 in the review](docs/CODE_REVIEW.md#-high).

#### Auth
| Method | Path | Role |
|---|---|---|
| `POST` | `/auth/login` | public — omit `tenantId` in the body to log in as super-admin |

#### Super admin (`hasRole("SUPER_ADMIN")` at the security-chain level; schema forced to `public`)
| Method | Path |
|---|---|
| `GET` | `/super-admin/tenants` |
| `POST` | `/super-admin/tenants` — provisions schema + Flyway + admin user + default config |
| `PUT` | `/super-admin/tenants/{id}/deactivate` |

#### Tenant administration (`/admin/**` requires DB role `ADMIN`, enforced in `TenantFilter`)
| Method | Path |
|---|---|
| `GET` | `/admin/tenant` |
| `PUT` | `/admin/tenant/branding` |
| `GET` `PUT` | `/admin/tenant/config` — dormancy threshold + `phaseLegalDelays` map |
| `GET` `PUT` | `/admin/tenant/config/thresholds` — AI moderate/critical percentages |
| `POST` `GET` | `/admin/users` |
| `GET` `PUT` | `/admin/users/{id}` |
| `PUT` | `/admin/users/{id}/deactivate` |

#### Cases
| Method | Path | Role enforced |
|---|---|---|
| `POST` | `/cases` | GESTIONNAIRE \| ADMIN |
| `GET` | `/cases?page&size&sortBy&phase&status&alertLevel` | GESTIONNAIRE \| ADMIN |
| `GET` `PUT` | `/cases/{id}` | ⚠️ none |
| `PUT` | `/cases/{id}/assign` | ⚠️ none (target must be a GESTIONNAIRE) |
| `GET` | `/cases/assignees` | ⚠️ none |
| `POST` `GET` | `/cases/{id}/notes` | ⚠️ none |
| `GET` | `/cases/{id}/history` | ⚠️ none — Envers timeline |
| `GET` | `/cases/{id}/export` | ⚠️ none — `application/pdf` |
| `POST` | `/cases/{id}/next-phase` | GESTIONNAIRE \| ADMIN |
| `GET` | `/cases/{id}/prerequisites` | ⚠️ none |
| `GET` | `/cases/alerts`, `/cases/{id}/alerts` | ⚠️ none |
| `POST` `GET` | `/cases/{id}/documents` — multipart `file`, `phase`, `tag?` | POST: GESTIONNAIRE \| ADMIN · GET: none |
| `GET` | `/cases/{id}/documents/{docId}/download` | ⚠️ none |
| `GET` | `/cases/{id}/valuation` | GESTIONNAIRE \| ADMIN |
| `GET` | `/cases/{id}/valuation-progress` | ⚠️ **none** — SSE `text/event-stream` |

#### Business objects
| Method | Path |
|---|---|
| `POST` `GET` | `/clients` · `/contracts` |
| `GET` `PUT` `DELETE` | `/clients/{id}` · `/contracts/{id}` (DELETE = soft delete) |
| `POST` `GET` | `/contracts/{contractId}/vehicle` (POST is an upsert) |
| `POST` `GET` | `/documents?entityType=client\|contract\|vehicle&entityId=…` |
| `GET` | `/documents/{docId}/download` |
| `GET` | `/dashboard/alerts/priority` — top 5, CRITICAL first then oldest |

#### Internal
| Method | Path | Auth |
|---|---|---|
| `POST` | `/internal/webhooks/ai-progress` | ⚠️ **`permitAll` — completely unauthenticated** |

### Data model

**`public` schema**

| Table | Key columns |
|---|---|
| `tenant` | `name`, `logo_url`, `data_retention_months` *(captured, never enforced)*, `status` |
| `super_admin` | `email` (unique), `password_hash`, `status` |
| `global_configuration` | created by migration V1 but **has no entity, repository, or usage** |

**Per-tenant schema `tenant_<uuid>`**

| Table | Notes |
|---|---|
| `tenant_config` | PK = `tenant_id`. `ai_deviation_moderate`, `ai_deviation_critical`, `dormancy_threshold_days`, `phase_legal_delays` (**JSONB** `Map<String,Integer>`). Does **not** extend `BaseEntity`. |
| `app_user` | `email` + `tenant_id` unique. `role` and `status` are free strings. `last_login` exists but is **never written**. |
| `client` | `full_name_or_company`, `registration_number`, `contact_email`, `contact_phone`, `address` |
| `contract` | `@ManyToOne client` (NOT NULL), `reference_number`, `start_date`, `end_date`, `status` |
| `vehicle` | `@ManyToOne contract` (NOT NULL), `vin`, `license_plate`, `brand`, `model`, `year`. Effectively 1:1 per contract but **not constrained as such**. |
| `recovery_case` | **`@Audited`**. `@ManyToOne contract` (NOT NULL), `@ManyToOne assignee` (nullable), `initial_residual_value_cents`, `currency_code`, `current_phase` (enum as STRING), `phase_started_at`, `last_action_at`, `status` |
| `document` | Polymorphic by **four nullable FKs** — `recovery_case`, `client`, `contract`, `vehicle`. Plus `uploader`, `file_name`, `file_url` (relative path), `phase_uploaded_in` |
| `note` | `recovery_case`, `author`, `content` |
| `ai_valuation` | `recovery_case`, `document`, `extracted_*`, `estimated_market_value_cents`, `deviation_value_cents`, `deviation_percentage` `NUMERIC(5,2)`, `reliability_indicator`, `status` (`PENDING`/`SUCCESS`/`FAILED`), `processed_at` |
| `case_alert` | `case_id` is a **raw UUID, not a relation**. `alert_type`, `criticality`, `message`, `is_resolved`, `resolved_at` |
| `revinfo`, `recovery_case_aud` | Envers |

**`BaseEntity`** supplies `id` (UUID v7, assigned manually — no `@GeneratedValue`), `version` (`@Version`), `createdBy` (`@CreatedBy` — but **no `AuditorAware` bean exists, so it is always NULL**), `isDeleted`, `deletedAt`, `createdAt`, `updatedAt`.

### Notable services

| Service | Responsibility |
|---|---|
| `CaseService` (583 lines) | Case creation (find-or-create client → contract → vehicle → case), read/update/assign, notes, phase advance + email, prerequisites, paged listing |
| `CaseSpecification` | JPA `Specification` — always ANDs `tenantId`, optional phase/status filters, `IN`-subquery on `AIValuation` for the reliability filter, join-fetches contract→client and assignee |
| `CasePrerequisiteService` | One real rule (`→ VENTE`); three empty `// Hook:` stubs |
| `AlertEngineService` / `Scheduler` | Daily cron across all active tenants; upserts one unresolved alert per `(caseId, alertType)` with WARNING→CRITICAL escalation |
| `CaseAlertService` | Interactive healing — resolves DORMANCY on activity, DEADLINE on phase advance |
| `AIValuationService` | Webhook handling, deviation maths, reliability banding, vehicle-discrepancy check, SSE dispatch |
| `DocumentUploadService` | 10 MB limit, MIME allowlist (`pdf`, `jpeg`, `jpg`, `png`), disk storage at `${leasrecover.upload.dir}/{tenantId}/{uuid}{ext}`, path-traversal hardening on download, AI trigger |
| `PdfExportService` | OpenPDF A4 export: header band, two-column client/contract + vehicle/finance grids, chronological 4-column history table |
| `CaseHistoryService` | Envers revision diffing merged with notes |
| `ValuationProgressService` | In-memory `ConcurrentHashMap<UUID, SseEmitter>`, 120s timeout |
| `EmailService` | **Real** `JavaMailSender`, synchronous, swallows all exceptions. One caller: the `→ MISE_EN_DEMEURE` transition. |

---

## 8. Frontend reference

### ⚠️ Read this first: the rewrite aliasing

`next.config.mjs` defines four rewrites:

```
/dashboard         → /cases
/dashboard/:path*  → /:path*
/admin             → /tenants
/admin/:path*      → /:path*
```

**Every page therefore has two URLs** — the filesystem one (`/cases`) and the prefixed alias (`/dashboard/cases`). The navigation uses the aliases; `middleware.js` only matches the aliases. The un-prefixed real routes are **unguarded**. This is [C5](docs/CODE_REVIEW.md#c5--frontend-route-guard-can-be-bypassed) and it is the first thing to fix.

### Pages

| Route (alias) | Real path | What it does |
|---|---|---|
| `/login` | `(auth)/login` | Email + password + tenant UUID. A `Switch` toggles "Super Admin" mode which nulls `tenantId`. Redirects to `/admin/tenants` or `/dashboard`. |
| `/admin/tenants` | `(admin)/tenants` | Super-admin registry. Table of tenants; modal provisions a tenant + its first admin; popconfirm deactivates. |
| `/dashboard` **and** `/dashboard/cases` | `(dashboard)/cases` | **Command Center** — priority alert banners (`AlertCard`) + server-paginated, sorted, filtered case table. *Note: these two nav entries resolve to the same page; there is no distinct dashboard.* |
| `/dashboard/cases/new` | `(dashboard)/cases/new` | 5-card creation form. An optional existing-contract picker pre-fills client/contract/vehicle. Converts the residual value to cents. |
| `/dashboard/cases/[id]` | `(dashboard)/cases/[id]` | **1201 lines — the centerpiece.** Header actions (advance phase / edit / export PDF) → `InlineBlocker` → `ConditionalPhaseStepper` → `AIValueCard` → stats card → 4 tabs (details / notes / history / documents). Opens an SSE connection when the phase is `SAISIE`. Reads `?tab=` and `?focus=` for deep links from alerts. |
| `/dashboard/leasing` | `(dashboard)/leasing` | **1075 lines.** Two-tab CRUD registry for Clients and Contracts, with four drawers (forms + detail views embedding `EntityDocumentVault` and `VehicleDetailsCard`). |
| `/dashboard/settings` | — | Redirect stub → `/dashboard/settings/tenant` |
| `/dashboard/settings/tenant` | `(dashboard)/settings/tenant` | Branding: name + logo URL. Updates the live sidebar via `branding-context`. |
| `/dashboard/settings/compliance` | `(dashboard)/settings/compliance` | Dormancy threshold + 4 phase delays + 2 AI thresholds. Saves via two parallel PUTs. |

### The BFF pattern

**Session sealing** (`src/lib/crypto.js`): the backend JWT is encrypted with **AES-256-GCM** (key = SHA-256 of `BFF_COOKIE_SECRET`) and stored as `IV_HEX:CIPHER_HEX`. Because GCM is authenticated, a successful `decrypt()` is itself an integrity check — a forged cookie cannot decrypt. It uses `crypto.subtle`, which is why the Edge-runtime middleware can import it.

**Cookies set at login:**

| Cookie | httpOnly | secure | sameSite | maxAge | Contents |
|---|---|---|---|---|---|
| `session_token` | ✅ true | prod only | `strict` | 24h | AES-GCM ciphertext of the JWT |
| `user_session` | ❌ **false** | prod only | `strict` | 24h | Plaintext `{userId, role, name, tenantId}` — ⚠️ see [C6](docs/CODE_REVIEW.md#c6--role-escalation-into-the-admin-ui) |

**`middleware.js`** decrypts `session_token` for `/dashboard/*` and `/admin/*`; on failure it redirects to `/login` and deletes both cookies. It does **not** verify the JWT signature, check `exp`, or check roles.

**The proxy idiom** — repeated verbatim in 26 of the 29 route handlers:

```js
const sessionTokenCookie = request.cookies.get('session_token');
if (!sessionTokenCookie) return 401;
const token = await decrypt(sessionTokenCookie.value);
if (!token) return 401;
const payload  = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
fetch(`${backendUrl}/api/v1/…`, { headers: {
  Authorization : `Bearer ${token}`,
  'X-Tenant-ID' : payload.tenantId,
  'X-User-Email': payload.sub,
}});
```

The JWT payload is base64-decoded but **never signature-verified** — the BFF trusts it because the cookie was sealed server-side. Extracting this into a `lib/bff.js` helper would remove roughly 500 duplicated lines.

### Route handlers

| BFF path | Methods | Proxies to |
|---|---|---|
| `/api/auth/login` | POST | `/auth/login`, then sets both cookies |
| `/api/auth/logout` | POST | *(local cookie clear only — no backend revocation)* |
| `/api/auth/session` | GET | *(echoes the `user_session` cookie)* |
| `/api/admin/tenant` | GET, PUT | `/admin/tenant`, `/admin/tenant/branding` |
| `/api/admin/tenant/config` | GET, PUT | `/admin/tenant/config` |
| `/api/admin/tenant/config/thresholds` | GET, PUT | `/admin/tenant/config/thresholds` |
| `/api/super-admin/tenants` | GET, POST | `/super-admin/tenants` |
| `/api/super-admin/tenants/[id]/deactivate` | PUT | `/super-admin/tenants/{id}/deactivate` |
| `/api/cases` | GET, POST | `/cases` (GET forwards the full querystring) |
| `/api/cases/assignees` | GET | `/cases/assignees` |
| `/api/cases/[id]` | GET, PUT | `/cases/{id}` |
| `/api/cases/[id]/assign` | PUT | `/cases/{id}/assign` |
| `/api/cases/[id]/documents` | GET, POST | `/cases/{id}/documents` (pipes `FormData`) |
| `/api/cases/[id]/documents/[docId]/download` | GET | binary passthrough |
| `/api/cases/[id]/export` | GET | `/cases/{id}/export` → forces `application/pdf` |
| `/api/cases/[id]/history` | GET | `/cases/{id}/history` |
| `/api/cases/[id]/next-phase` | POST | `/cases/{id}/next-phase` |
| `/api/cases/[id]/notes` | GET, POST | `/cases/{id}/notes` |
| `/api/cases/[id]/prerequisites` | GET | `/cases/{id}/prerequisites` |
| `/api/cases/[id]/progress` | GET | `/cases/{id}/valuation-progress` — **SSE re-stream** |
| `/api/cases/[id]/valuation` | GET | `/cases/{id}/valuation` |
| `/api/clients`, `/api/clients/[id]` | GET, POST, PUT, DELETE | `/clients…` |
| `/api/contracts`, `/api/contracts/[id]` | GET, POST, PUT, DELETE | `/contracts…` |
| `/api/contracts/[id]/vehicle` | GET, POST | `/contracts/{id}/vehicle` |
| `/api/dashboard/alerts/priority` | GET | `/dashboard/alerts/priority` |
| `/api/documents` | GET, POST | `/documents` |
| `/api/documents/[docId]/download` | GET | binary passthrough |

### Components

| Component | Purpose |
|---|---|
| **`AIUploadZone`** | PDF-only drop zone for the appraisal report. Appends `tag: 'EXPERTISE_REPORT'` when the phase is `SAISIE`. Opens the SSE stream and narrates the pipeline (📄 Lecture → 🔍 Extraction → 📊 Calcul → ✅). Has a **15-second no-event timeout that is treated as success**, so the UI still works when the pipeline is down. Renders a retry button on `FAILED`. |
| **`AIValueCard`** | Three-panel grid: market value, initial residual value, signed deviation. Colour/label/icon driven by `RELIABLE` / `MODERATE_RISK` / `CRITICAL_RISK`. Formats cents via `Intl.NumberFormat('fr-TN')`. Skeleton while loading, `null` when there is no valuation. |
| **`AlertCard`** | Red (CRITICAL) or amber (WARNING) banner. Its "action" button is the **deep-link dispatcher**: `DORMANCY` → `?tab=notes&focus=noteInput`, `DEADLINE` → `?tab=details&focus=stepper`, `MISSING_PREREQUISITE` → `?tab=documents&focus=uploadZone`. |
| **`ConditionalPhaseStepper`** | Ant `Steps` over the 5 phases. When the next transition is blocked, it swaps that step's title for a red lock icon inside a `Tooltip` listing every missing prerequisite. |
| **`EntityDocumentVault`** | Polymorphic document list + upload for `client` / `contract` / `vehicle`. Client-side validation mirrors the backend (10 MB, PDF/JPEG/PNG). |
| **`VehicleDetailsCard`** | Read-only vehicle grid, or an empty state with a "Lier le Véhicule" CTA. The modal `POST`s to `/contracts/{id}/vehicle` for both create and update (the backend upserts). |
| **`InlineBlocker`** | Red `Alert` listing missing prerequisites with a CTA link. Returns `null` on an empty list, so it can be rendered unconditionally. Also reused as a generic form-error banner on the leasing page. |
| **`branding-context`** | React context holding `{name, logoUrl}` so the settings page can update the sidebar live. Mounted only in the dashboard layout. |

Both layouts implement a **15-minute idle auto-logout** (`NEXT_PUBLIC_IDLE_TIMEOUT`), satisfying FR06/NFR08.

---

## 9. AI service reference

### Endpoints

**`GET /health`** → `{"status":"success","data":{"status":"up"}}`

**`POST /api/extract`** — `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `file` | file — must be a PDF (checked by extension **or** content-type) | ✅ |
| `caseId` | UUID | ✅ |
| `tenantId` | UUID | ✅ |
| `webhookUrl` | URL | ✅ |

Returns **`202 Accepted`** immediately: `{"status":"success","message":"Extraction process scheduled in the background"}`. The work runs as a FastAPI `BackgroundTask`.

### Webhook contract (AI service → backend)

Three POSTs to `webhookUrl`, matching `AiProgressPayload` on the Java side:

```jsonc
{ "caseId": "...", "tenantId": "...",
  "status": "PENDING",  "stage": "READING",     "progress": 30,
  "message": "Lecture du document...", "data": null }

{ "status": "PENDING",  "stage": "EXTRACTION",  "progress": 70,
  "message": "Extraction des données...", "data": null }

{ "status": "SUCCESS",  "stage": "CALCULATION", "progress": 100,
  "data": { "brand": "BMW", "model": "520d", "year": 2020,
            "mileage": 87000, "condition": "Bon état",
            "marketValueCents": 1840000, "currencyCode": "EUR" } }
```

On error, a single `{"status":"FAILED","stage":"EXTRACTION","progress":100,"message":"Le document est illisible ou n'est pas un rapport d'expertise valide."}`.

### 🚨 The extraction is simulated

**There is no LLM call, no OCR, no PDF parsing, and no prompt anywhere in this service.** `requirements.txt` contains no `openai`, `anthropic`, `pdfplumber`, `PyPDF2`, or `pytesseract`. The pipeline in `app/services/llm_extraction.py` is:

```
time.sleep(3) → webhook 30%
time.sleep(3) → webhook 70%
time.sleep(3) → webhook 100% with the hardcoded BMW payload above
```

The uploaded `file_bytes` are used **only** for an emptiness check. Every case in the system therefore receives an identical €18 400 valuation for a 2020 BMW 520d — which also means the `VEHICLE_DISCREPANCY` alert fires for essentially every non-BMW case.

This was **deliberate**: story `5-1-automated-expertise-pipeline-trigger-extraction-api.md:41` says *"Stub or mock the PDF parsing and LLM API call for the MVP"*, and lines 42–63 specify exactly these sleep timings and this literal payload. The implementation matches the story precisely. But the product brief presents this module as the core differentiator, so **building the real extraction is the single highest-value remaining piece of work**.

`app/core/config.py` defines a `Settings` class that is **never imported anywhere**; all values are hardcoded in `main.py`. The service reads **zero environment variables** — the `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` entries in `.env.example` reach nothing.

---

## 10. Running the project

### Prerequisites

Docker + Docker Compose · JDK 21 · Node.js 20+ · Python 3.11

### Option A — full Docker stack

```bash
cp .env.example .env
docker-compose up -d
```

> ⚠️ **This does not currently work end to end.** The frontend reads `BACKEND_URL` but compose sets `BACKEND_API_URL`; `JWT_SECRET` is never passed through; uploads have no volume. See [§11](#11-things-that-will-bite-you-on-day-one).

### Option B — recommended for development

Run Postgres (and optionally the AI service) in Docker, everything else natively for hot reload.

```bash
# 1. Database
docker-compose up -d postgres

# 2. Backend  →  http://localhost:8080
cd backend && ./mvnw spring-boot:run

# 3. AI service  →  http://localhost:8000  (docs at /docs)
cd ai-service
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 4. Frontend  →  http://localhost:3000
cd frontend && npm install && npm run dev
```

Hot-reload override for the containerised path:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Environment variables

**Documented in `.env.example`:**

| Variable | Default | Used by |
|---|---|---|
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_PORT` | `leasrecover` / `postgres` / `postgres` / `5432` | postgres, backend |
| `JWT_SECRET` | ⚠️ placeholder — **must be replaced** | backend |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | backend |
| `BACKEND_PORT` | `8080` | backend |
| `SPRING_PROFILES_ACTIVE` | `dev` | ⚠️ *no `application-dev.yml` exists* |
| `FRONTEND_PORT` | `3000` | frontend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | ⚠️ **read by nothing** |
| `AI_SERVICE_PORT` | `8000` | ai-service |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | placeholders | ⚠️ **read by nothing** |

**Used by the code but *missing* from `.env.example`:**

| Variable | Default | Used by |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8080` | **all 26 frontend BFF handlers** |
| `BFF_COOKIE_SECRET` | insecure hardcoded fallback outside production | `frontend/src/lib/crypto.js` |
| `NEXT_PUBLIC_IDLE_TIMEOUT` | `900000` (15 min) | both frontend layouts |
| `AI_SERVICE_URL` | `http://localhost:8000` | backend |
| `AI_SERVICE_WEBHOOK_URL` | `http://backend:8080/api/v1/internal/webhooks/ai-progress` | backend |
| `UPLOAD_DIR` | `./uploads` | backend |
| `SPRING_MAIL_*` | ⚠️ **committed Gmail credentials** in `application.yml` | backend |
| `app.security.allow-header-fallback` | ⚠️ **`true`** | backend `TenantFilter` |
| `app.alerts.cron` | `0 0 2 * * *` | backend `AlertEngineScheduler` |

Create `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:8080
BFF_COOKIE_SECRET=<32+ character random string>
NEXT_PUBLIC_IDLE_TIMEOUT=900000
```

### First login

Flyway seeds a super-admin (`db/migration/public/V1.1__seed_super_admin.sql`) with the email **`superadmin@example.com`** and a **committed bcrypt hash** — change this before any real deployment.

1. Open `http://localhost:3000` → redirects to `/login`.
2. Toggle **Super Admin**, log in with the seeded account.
3. Create a tenant at `/admin/tenants`, supplying the first admin's email and password. Note the tenant UUID.
4. Log out, and log back in with the tenant UUID + that admin's credentials.
5. Create a client → contract → vehicle from `/dashboard/leasing`, then a case from `/dashboard/cases/new`.

### Tests

```bash
cd backend    && ./mvnw test                      # 29 files, ~185 tests
cd frontend   && npm test                         # 10 files
cd ai-service && python -m unittest discover tests # 3 tests
```

> ⚠️ `backend/src/test/java/com/leasrecover/backend/InsertAdminUser.java` is not a test — it opens a **real JDBC connection and inserts an admin user** when you run `mvn test`. Delete it. `DemoApplicationTests` is `@Disabled`, so there is **no Spring context-load test at all**.

There is **no CI pipeline** (`.github/workflows/` does not exist) despite the architecture document specifying GitHub Actions.

---

## 11. Things that will bite you on day one

A short list of traps. The full analysis, with `file:line` references and fixes, is in **[`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md)**.

| Symptom | Cause |
|---|---|
| Docker stack starts but the UI can't reach the API | Frontend reads `BACKEND_URL`; compose sets `BACKEND_API_URL` (and includes `/api/v1`, which the code appends again) |
| Uploading a file >1 MB returns HTTP 500 | `spring.servlet.multipart.max-file-size` is unset ⇒ Boot's 1 MB default, while the service checks 10 MB |
| All uploaded documents vanish after `docker-compose restart` | `uploads/` is container-local with **no volume mount** |
| Editing or deleting a client / contract / vehicle silently fails | `params` is destructured without `await` in 3 route files ⇒ the backend receives `/clients/undefined` |
| Every AI valuation is a 2020 BMW 520d worth €18 400 | The AI service is simulated ([§9](#9-ai-service-reference)) |
| A `VEHICLE_DISCREPANCY` alert on nearly every case | Same cause |
| You can reach `/cases` or `/tenants` without logging in | `middleware.js` only matches the `/dashboard/*` and `/admin/*` aliases |
| A newly added tenant Flyway migration doesn't apply | Tenant migrations run **only** at provisioning time |
| Advancing a case past `CLOTURE` returns 500 | `IllegalStateException` is not mapped; should be 409 |
| The app "logs you in" then throws 401s everywhere | The middleware never checks the JWT `exp` claim |
| `mvn test` mutates your database | `InsertAdminUser.java` |

### Before any real deployment

1. **Rotate the Gmail app password** committed in `backend/src/main/resources/application.yml` and purge it from git history.
2. **Set a real `JWT_SECRET`** and pass it through compose — without it, tokens are signed with a publicly known default.
3. **Authenticate `/api/v1/internal/webhooks/**`** — it is currently `permitAll` on a host-published port.
4. **Set `app.security.allow-header-fallback: false`.**
5. **Change the seeded super-admin credentials.**

---

## Conventions

- **Database:** `snake_case`, singular table names.
- **API:** REST, `camelCase` JSON on every boundary regardless of backend language, **JSend envelope** (`{status, data}` / `{status, message}`), ISO 8601 UTC timestamps.
- **Money:** always stored and transported in **cents** as `Long`. Divide by 100 only at the render layer.
- **Java:** `PascalCase` classes, `camelCase` methods, strict Controller → Service → Repository. Business logic belongs in the service layer.
- **React:** `PascalCase` components, `camelCase` functions. UI primitives in `src/components/ui`, domain code in `src/features`.
- **Python:** `PascalCase` Pydantic models, `snake_case` functions.
- **IDs:** UUID v7 via `UuidCreator` (though a few call sites still use `UUID.randomUUID()`).

---

## Where to go next

- **Understanding the "why":** `_bmad-output/planning-artifacts/product-brief-pfe-2026-02-26.md`
- **Requirement traceability:** `_bmad-output/planning-artifacts/prd.md` (FR01–FR41) and the coverage matrix in `implementation-readiness-report-2026-03-23.md`
- **Why a given piece of code exists:** find the matching story in `_bmad-output/implementation-artifacts/`
- **What to fix and in what order:** [`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md)
