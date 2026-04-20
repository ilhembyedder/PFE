---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-pfe-2026-02-26.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'pfe'
user_name: 'IlhemBENYEDDER'
date: '2026-03-08'
lastStep: 8
status: 'complete'
completedAt: '2026-03-09'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

41 functional requirements across 8 categories covering identity & access management (FR01–FR06), tenant configuration (FR07–FR11), case management (FR12–FR17), 5-phase recovery workflow (FR18–FR22), document management (FR23–FR26), AI valuation module (FR27–FR32), dashboard & alerts (FR33–FR37), and traceability & compliance (FR38–FR41).

Architecturally, these requirements decompose into 6 major system components:
1. **Auth & RBAC Service** — Authentication, role-based access, tenant-scoped session management
2. **Tenant Configuration Store** — Per-tenant configurable parameters (legal delays, AI thresholds, dormancy, branding)
3. **Case Management Core** — Domain model for recovery cases, CRUD, reassignment, notes, audit trail
4. **Workflow Engine** — 5-phase state machine with conditional transitions, deadline tracking, alert generation
5. **Document & AI Pipeline** — File upload/storage, LLM/NLP extraction service (async), comparison engine, reliability indicator
6. **Dashboard & Alert System** — Priority-first case listing, persistent alerts with auto-dismiss, filtering/search

**Non-Functional Requirements:**

22 NFRs organized across performance (5), security (7), scalability (3), reliability (4), maintainability (2), and accessibility (1).

Key architecture-driving NFRs:
- **Performance:** AI pipeline < 30s, 1000 cases < 2s load, phase transitions < 1s
- **Security:** AES-256 at rest, TLS 1.2+, zero-tolerance tenant isolation, immutable logs, bcrypt passwords
- **Scalability:** 300–1000+ active cases/tenant, new tenant by config only, AI module independently scalable
- **Reliability:** 99.5% uptime, zero-exception deadline alerts, AI failure with graceful recovery
- **Maintainability:** AI module updatable independently, configurations changeable without redeployment

**Scale & Complexity:**

- Primary domain: Full-stack web (React SPA + backend services + AI pipeline)
- Complexity level: **High** — Multi-tenant fintech SaaS + LLM/NLP + dual-jurisdiction regulatory compliance + workflow state machine
- Estimated architectural components: 6 major services/modules

### Technical Constraints & Dependencies

| Constraint | Source | Impact |
|---|---|---|
| **React + Ant Design v5** | UX Specification | Frontend technology locked — SPA architecture |
| **LLM/NLP for document extraction** | PRD FR27-FR32 | Requires AI/ML infrastructure, model hosting or API access |
| **Dual legal jurisdiction** | PRD domain requirements | RGPD (Europe) + Loi organique n°63-2004 (Tunisia) — configurable compliance |
| **Immutable audit trail** | PRD FR17, FR38-FR40, NFR11 | Append-only storage, separated from transactional DB |
| **Multi-tenant zero-tolerance isolation** | PRD NFR07 | DB-level isolation strategy required (not just row-filtering) |
| **Solo developer (PFE context)** | PRD project scoping | Architecture must be implementable by a single developer within PFE timeline |
| **Standalone + modular deployment** | Product brief business objectives | API design must anticipate modular integration (V2) |
| **Desktop-first SPA** | UX Specification | No native mobile, no offline, no PWA for MVP |
| **Async AI processing with progress** | UX Specification + NFR01 | Backend must support staged progress reporting (3 stages) |

### Cross-Cutting Concerns Identified

1. **Tenant Isolation** — Every layer (data, auth, file storage, config, logs) must enforce tenant boundaries. This is the #1 architectural constraint that touches all components.

2. **Audit Trail** — Every state mutation across all features must be logged immutably with actor, timestamp, and before/after data. Separated from transactional storage.

3. **RBAC Authorization** — Enforced at API boundary level, scoped by tenant + role. 3 roles with distinct permission matrices (Super Admin / Admin / Gestionnaire).

4. **Error Handling & Resilience** — AI pipeline failures require graceful degradation with user-facing recovery paths. Deadline alerts must survive system restarts.

5. **Configurable Business Rules** — Legal delays, alert thresholds, AI sensitivity, dormancy periods — all tenant-configurable without code changes or redeployment.

6. **Asynchronous Processing** — AI pipeline decoupled from request/response cycle. Requires job management, progress tracking, and result delivery mechanism.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application with 3-service architecture:
- **Frontend:** Next.js 16 (JavaScript, App Router) + Ant Design v5
- **Backend API:** Spring Boot 4.0.3 (Java 21) — REST API + business logic
- **AI Service:** FastAPI (Python) — LLM/NLP document processing pipeline
- **Database:** PostgreSQL 18
- **Deployment:** Docker-based containerized solution

### Technology Versions (Verified March 2026)

| Component | Version | Status |
|---|---|---|
| Next.js | 16.1 (stable) | Turbopack default, React 19.2, App Router |
| Spring Boot | 4.0.3 (stable) | Spring Framework 7, Jakarta EE 11, Virtual Threads, Spring AI Core |
| FastAPI | 0.135.1 | Async-native, auto-docs, Pydantic v2 |
| PostgreSQL | 18.3 | Async I/O, virtual generated columns |
| Java | 21 (minimum) | LTS, required by Spring Boot 4 |
| Ant Design | 5.x (latest stable) | CSS-in-JS design tokens, React 19 compatible |
| Docker | Latest stable | Multi-stage builds, compose orchestration |

### Client Requirements Constraints

- **Next.js** (frontend): Client requirement — non-negotiable
- **Spring Boot 4** (backend, Java ≥ 21): Client requirement — non-negotiable
- **Python** (AI module): Preferred for NLP/LLM pipeline — accepted by client

### Starter Options Selected

#### Frontend: Next.js 16 via `create-next-app`

**Initialization Command:**

```bash
npx -y create-next-app@latest ./frontend --js --app --eslint --no-tailwind --src-dir --use-npm --import-alias "@/*"
```

**Architectural Decisions Provided:**
- **Language:** JavaScript (ES modules)
- **Routing:** App Router (file-system based, supports layouts, loading states, error boundaries)
- **Bundler:** Turbopack (default in v16, replaces Webpack)
- **Linting:** ESLint pre-configured
- **Structure:** `src/` directory with `app/` router
- **Styling:** None pre-installed (Ant Design v5 CSS-in-JS to be added)

**Post-initialization additions:**
- `antd` + `@ant-design/nextjs-registry` for SSR-compatible Ant Design
- `next/font/google` for Inter typography
- Global `ConfigProvider` with LeasRecover design tokens
- Custom theme configuration file

#### Backend: Spring Boot 4.0.3 via Spring Initializr

**Initialization:** Via start.spring.io

**Configuration:**
- **Build:** Maven
- **Language:** Java 21
- **Spring Boot:** 4.0.3
- **Group:** com.leasrecover
- **Artifact:** backend

**Dependencies:**
- Spring Web (REST API)
- Spring Data JPA (ORM + multi-tenant data access)
- PostgreSQL Driver
- Spring Security (auth + RBAC)
- Flyway Migration (schema versioning per tenant)
- Spring Boot Actuator (health + metrics)
- Validation (request validation)
- Spring Boot DevTools
- Lombok
- Configuration Processor

**Architectural Decisions Provided:**
- **Runtime:** Virtual Threads (Spring Boot 4 default — high concurrency without thread pool overhead)
- **ORM:** Hibernate via Spring Data JPA
- **Schema migration:** Flyway (per-tenant schema management)
- **Security:** Spring Security with configurable auth chain
- **API structure:** Controller → Service → Repository pattern
- **Config:** Externalized configuration via application.yml + custom properties

#### AI Service: FastAPI (Python) — Manual Scaffold

**No CLI generator needed.** FastAPI projects are scaffolded manually with a standard structure:

```
ai-service/
├── app/
│   ├── main.py              # FastAPI application entry
│   ├── api/
│   │   └── routes/
│   │       └── extraction.py # Document extraction endpoint
│   ├── core/
│   │   └── config.py         # Settings and env vars
│   ├── services/
│   │   ├── pdf_parser.py     # PDF text extraction
│   │   └── llm_extraction.py # LLM-based field extraction
│   └── models/
│       └── schemas.py        # Pydantic request/response models
├── requirements.txt
├── Dockerfile
└── tests/
```

**Key dependencies:**
- `fastapi==0.135.1` + `uvicorn[standard]`
- `python-multipart` (file uploads)
- `PyPDF2` or `pdfplumber` (PDF parsing)
- `openai` or `anthropic` SDK (LLM API client)
- `pydantic` (data validation)

**Architectural Decisions Provided:**
- **Async:** Native async/await for non-blocking I/O
- **API docs:** Auto-generated Swagger UI + ReDoc
- **Validation:** Pydantic v2 models for all request/response schemas
- **Deployment:** Single async worker with Uvicorn

### Docker Compose Orchestration

**Project structure:**

```
leasrecover/
├── frontend/              # Next.js 16
│   └── Dockerfile
├── backend/               # Spring Boot 4
│   └── Dockerfile
├── ai-service/            # FastAPI Python
│   └── Dockerfile
├── docker-compose.yml     # Service orchestration
├── docker-compose.dev.yml # Development overrides
└── .env                   # Environment variables
```

**Services defined:**
- `frontend` — Next.js dev server (port 3000)
- `backend` — Spring Boot API (port 8080)
- `ai-service` — FastAPI (port 8000)
- `postgres` — PostgreSQL 18 (port 5432)

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Multi-tenant data isolation strategy (Shared Database, Separate Schema)
- Authentication boundaries & token management (Next.js BFF + HttpOnly JWT)
- Service-to-Service communication for AI extraction (REST + Webhooks/SSE)

**Important Decisions (Shape Architecture):**
- Audit Trail implementation pattern (Hibernate Envers)
- Next.js data fetching strategy (React Server Components + Server Actions)
- Monitoring & CI/CD baseline (Spring Boot Actuator + Docker Logging + GitHub Actions)

**Deferred Decisions (Post-MVP):**
- External GraphQL / Public Extensibility APIs
- Horizontal scaling with load balancers (Docker Compose is sufficient for MVP)
- Advanced centralized logging (ELK / Prometheus)

### Data Architecture

- **Multi-Tenancy Strategy:** Shared Database, Separate Schema per Tenant. This approach ensures zero-tolerance data isolation without the immense overhead of managing entirely separate PostgreSQL database instances. Spring Boot 4's `AbstractRoutingDataSource` and Flyway migrations will be configured to switch and maintain these schemas.
- **Audit Trail System:** Hibernate Envers (v7.2). This framework integrates directly into Spring Data JPA, ensuring that every entity modification is automatically versioned into suffix tables (e.g., `_AUD`) without custom logic vulnerabilities. Immutability is satisfied natively at the ORM layer.

### Authentication & Security

- **Authentication Method:** Stateless JWT Tokens utilizing an Access/Refresh token pattern.
- **Session Management (BFF Pattern):** Stored as strict `HttpOnly`, `Secure`, `SameSite=Strict` cookies by the Next.js 16 Backend-For-Frontend (API Routes/Server Actions). The frontend client code never has access to the tokens, preventing XSS attacks. The Spring Boot backend remains purely stateless, extracting tokens passed from the Next.js server.
- **Authorization:** Handled at the Spring Security (API boundary) layer using method-level and URL-level expressions matching the 3 PRD roles (`Super Admin`, `Admin`, `Gestionnaire`).

### API & Communication Patterns

- **Frontend to API Gateway:** RESTful APIs over HTTPS with OpenAPI 3 / Swagger documentation generated by SpringDoc. Next.js 16 Server Actions will handle mutations by performing secured internal `fetch` calls to the Spring API.
- **Backend to AI Service (Async Pipeline):** The Spring Boot backend initiates processing via synchronous REST to FastAPI. The AI Service runs the heavy LLM extraction asynchronously and reports the 3-stage progress back to a webhook on the Spring Boot server. Spring Boot proxies these progress updates to the Next.js frontend using Server-Sent Events (SSE), fulfilling the PRD UI loading requirements.

### Frontend Architecture

- **App Framework:** Next.js 16.1 (App Router).
- **Data Mutability and Fetching:** React Server Components (RSC) will be used for all data loading, eliminating traditional `useEffect` fetch waterfalls. Next.js Server Actions will handle form submissions and mutations, avoiding the need for dedicated global state managers like Redux.
- **UI Component Library:** Ant Design v5 with CSS-in-JS design tokens.

### Infrastructure & Deployment

- **Deployment Orchestration:** Docker-based containerization using `docker-compose.yml` for local and staging environments, ensuring parity for the Next.js, Spring Boot, FastAPI, and PostgreSQL containers.
- **Monitoring:** Spring Boot Actuator exposes health and metric endpoints. Logging relies on standard console/JSON output captured natively by Docker's logging driver. 
- **CI/CD pipeline:** GitHub Actions will perform build validation, run test suites, and provide simple linting/formatting checks.

### Decision Impact Analysis

**Implementation Sequence:**
1. Database initialization and Flyway multi-tenant schema routing.
2. Spring Boot Security layer and JWT creation.
3. Next.js 16 configuration for BFF cookie handling and RSC data fetching.
4. FastAPI AI Pipeline extraction endpoint and Spring Boot Webhook/SSE integration.

**Cross-Component Dependencies:**
- The Webhook/SSE strategy requires Spring Boot to maintain active connections (Virtual Threads are perfect for this) while FastAPI processes the documents.
- Changing the RBAC roles requires synchronized updates in both the Spring Security configuration and the Next.js Route Guards.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
1. Cross-language data case formatting (JSON/Database serialization).
2. Inter-service API Response standard formatting.
3. Universal error handling and propagating exceptions to the Next.js UI.
4. Database naming vs Application naming mismatch.

### Naming Patterns

**Database Naming Conventions:**
- **Exclusively `snake_case`:** All tables (`recovery_cases`), columns (`created_at`), and foreign keys (`tenant_id`). Plural for tables, singular for columns. Index conventions: `idx_tablename_columnname`.

**API Naming Conventions:**
- **Endpoints:** RESTful convention. Plural resources, nested for hierarchy: `/api/v1/tenants/{tenantId}/cases/{caseId}`.
- **Query Params:** Always `camelCase` to match the frontend standard (e.g., `?sortBy=date_desc`).

**Code Naming Conventions:**
- **Next.js (TS/React):** Files are `kebab-case` (`user-dashboard.tsx`). Components are `PascalCase` (`UserDashboard`). Functions/Variables are `camelCase`.
- **Spring Boot (Java):** Classes/Interfaces are `PascalCase`. Methods and properties are `camelCase`.
- **FastAPI (Python):** Classes are `PascalCase` (Pydantic Models). Methods/functions and variables are `snake_case`.

### Structure Patterns

**Project Organization:**
- **Next.js:** App Router model. UI components in `src/components`, domain-specific features in `src/features`.
- **Spring Boot:** Strict Controller -> Service -> Repository layers. Business logic MUST reside in the Service layer.

**File Structure Patterns:**
- **Shared Type Definitions:** Because the frontend and backend are separate languages, the Spring API will generate an OpenAPI 3 specification, which the Next.js frontend will use to auto-generate TypeScript interfaces. Hand-coding identical types across repos is prohibited.

### Format Patterns

**API Response Formats:**
- **Standard Envelope (JSend pattern):** ALL API responses from Spring Boot and FastAPI must follow an envelope structure. 
  - Success: `{ "status": "success", "data": <payload> }`
  - Error: `{ "status": "error", "error": { "code": 404, "message": "Not Found", "details": [...] } }`

**Data Exchange Formats:**
- **Cross-Boundary JSON:** Regardless of the backend language (Java or Python), ALL JSON crossing the network MUST be perfectly formatted `camelCase`. FastAPI Pydantic models must be configured with `alias_generator` to output `camelCase`.
- **Dates & Times:** Exclusively sent and parsed as **ISO 8601 UTC** strings across all services (`YYYY-MM-DDTHH:mm:ss.sssZ`).

### Communication Patterns

**State Management Patterns:**
- **Frontend (Next.js):** Avoid Redux/Zustand where unnecessary. Global client state is primarily managed natively by Next.js navigation and React Server Components caching. Local state uses `useState`. Server actions handle mutations and execute `revalidatePath`.

### Process Patterns

**Error Handling Patterns:**
- **Spring Boot:** Globally managed via a single `@ControllerAdvice` to catch all exceptions and format them into the Standard Envelope. No raw stack traces will leak.
- **FastAPI:** A global exception handler will catch all unhandled exceptions and format them identically to the Spring Boot Envelope.
- **Next.js:** Next.js Server Actions MUST catch network exceptions and return a serializable error object (`{ error: string }`) instead of throwing unhandled exceptions to the client context. Server components use `error.tsx` boundaries.

### Enforcement Guidelines

**All AI Agents MUST:**
- Adhere strictly to the JSend API Envelope structure when creating a new API endpoint.
- Serialize all JSON API responses to `camelCase` regardless of the internal backend language.
- Throw structured Exceptions caught by the global error handler, never manually build HTTP Error Responses in the Controller layer.

**Pattern Examples**

**Good Examples:**
```json
// Correct Standardized API Success Response
{
  "status": "success",
  "data": {
    "caseId": "123e4567-e89b-12d3...",
    "createdAt": "2026-03-09T08:01:00.000Z"
  }
}
```

**Anti-Patterns:**
```json
// WRONG: Inconsistent case (snake_case in JSON), no envelope
{
  "case_id": "123e4567-e89b-12d3...",
  "created_at": "2026-03-09T08:01:00.000Z"
}
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
pfe/
├── README.md
├── docker-compose.yml              # Core orchestration
├── docker-compose.dev.yml          # Local override with mapped ports/volumes
├── .env.example                    # Template for secrets
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions pipeline
│
├── frontend/                       # NEXT.JS 16 APP
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── public/                     # Static assets
│   └── src/
│       ├── app/                    # App Router configuration
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── error.tsx           # Global error boundary
│       │   ├── (auth)/             # Route group: /login, /forgot-password
│       │   ├── (dashboard)/        # Route group: /dashboard, /cases, /settings
│       │   ├── (admin)/            # Route group: /admin/tenants, /admin/users, system config
│       │   └── api/                # BFF Route Handlers (Auth callbacks, SSE proxy)
│       ├── components/             # Reusable UI components
│       │   ├── ui/                 # Ant Design wrapped components
│       │   ├── layout/             # Sidebar, Header, etc.
│       │   └── forms/              # Reusable form components
│       ├── features/               # Domain-specific logic
│       │   ├── cases/              # Recovery Case specific components & actions
│       │   ├── tenants/            # Tenant management & config components
│       │   ├── users/              # User administration & role management
│       │   └── auth/               # Login/Role logic
│       ├── lib/                    # Utilities
│       │   ├── api.ts              # Spring Boot Fetch wrapper with JWT injection
│       │   ├── actions.ts          # Centralized Server Actions
│       │   └── types.ts            # Generated from Spring OpenAPI spec
│       └── middleware.ts           # Next.js Route Guard (JWT checking)
│
├── backend/                        # SPRING BOOT 4.0.3 API
│   ├── pom.xml
│   ├── src/main/
│   │   ├── java/com/leasrecover/
│   │   │   ├── LeasRecoverApplication.java
│   │   │   ├── config/             # Security, Async, OpenAPI configs
│   │   │   ├── core/               # Global exceptions, multi-tenant context filter
│   │   │   ├── modules/            # Domain Modules
│   │   │   │   ├── auth/           # JWT Generation, Security Context
│   │   │   │   ├── tenant/         # Tenant settings, routing datasource
│   │   │   │   ├── superadmin/     # Platform administration, Tenant provisioning
│   │   │   │   ├── users/          # Admin CRUD for Users and Role assignments
│   │   │   │   ├── cases/          # Case CRUD, Workflow State Machine
│   │   │   │   ├── document/       # File upload, FastAPI orchestrator
│   │   │   │   └── notification/   # Alerts and SSE controllers
│   │   │   └── _common/            # Shared DTOs, Utilities
│   │   └── resources/
│   │       ├── application.yml     # Configuration
│   │       └── db/migration/       # Flyway SQL scripts
│   └── src/test/                   # Unit & Integration Tests
│
└── ai-service/                     # FASTAPI PYTHON
    ├── requirements.txt
    ├── main.py                     # App entrypoint
    ├── app/
    │   ├── api/                    # Routers (endpoints)
    │   ├── core/                   # Config and Error Handlers
    │   ├── services/               # LLM Extraction logic, PDF parsing
    │   └── schemas/                # Pydantic models (camelCase configured)
    └── tests/
```

### Architectural Boundaries

**API Boundaries:**
- The Next.js frontend ONLY talks to the Spring Boot REST API for business logic, and its own internal BFF (`/api/*`) for auth cookies and Server-Sent Events proxies.
- The Spring Boot backend exposes a unified REST API protected by Spring Security (Bearer JWT). It maintains the PostgreSQL connection.
- The FastAPI service is completely isolated behind the Docker bridge network. It does NOT connect to PostgreSQL. It exposes a single POST endpoint for document extraction, and expects a webhook URL to ping back.

**Component Boundaries (Frontend):**
- **Strict Separation:** UI Components (`src/components/ui`) must never contain data-fetching logic or Server Actions. Domain Features (`src/features`) compose UI components and inject Server Actions/RSC data.

**Service Boundaries (Backend):**
- Domain logic is isolated in `modules/`. For example, the `document` module does not write directly to `cases` tables; it emits a domain event or calls a `CaseService` interface to update workflow state. 

**Data Boundaries:**
- **Tenant Context Boundary:** Every incoming HTTP request passes through a TenantFilter in Spring Boot, setting a `TenantContextHolder` ThreadLocal (compatible with Virtual Threads). All Repositories append `schema=TenantContext.get()` dynamically. 
- Fast API never touches tenant DB schemas, it receives pure bytes (the PDF) and tenant rules via HTTP, completely stateless.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- Identity & Access (FR01–FR06)
  - Next.js: `src/features/auth/`, `src/middleware.ts`
  - Spring Boot: `modules/auth/`
- Case Management & Workflow (FR12–FR22)
  - Next.js: `src/features/cases/`
  - Spring Boot: `modules/cases/`
- AI Valuation Pipeline (FR27–FR32)
  - Next.js: `src/features/cases/components/extraction-progress.tsx` (SSE listener)
  - Spring: `modules/document/` (Webhook receiver, SSE emitter)
  - FastAPI: `app/services/llm_extraction.py`
- Traceability & Audit (FR38–FR40)
  - Spring Boot: Automatic via Hibernate Envers, mapped to `_AUD` tables natively.
- Dashboard & Alerts (FR33–FR37)
  - Next.js: `src/app/(dashboard)/page.tsx`
  - Spring Boot: `modules/notification/`
- Administration & Platform Management
  - Next.js: `src/app/(admin)/`, `src/features/users/`
  - Spring Boot: `modules/users/`, `modules/tenant/`

### Integration Points

**Internal Communication:**
- **Synchronous Data Read/Write:** Next.js Server Actions execute `fetch("http://backend:8080/api/v1/...")` inside Docker.
- **Asynchronous Processing:** Spring Boot POSTs PDF to `http://ai-service:8000/api/extract`. AI Service returns `202 Accepted`. AI Service later POSTs progress updates to `http://backend:8080/api/v1/internal/webhooks/ai-progress`.

### File Organization Patterns

**Configuration Files:**
- All secrets are injected via `.env` files into docker-compose, traversing down as environment variables into `next.config.ts`, `application.yml`, and `main.py`. Hardcoding is strictly forbidden.

**Asset Organization:**
- Next.js static assets live in `frontend/public/assets`.
- User-uploaded PDF documents are stored in a dedicated persistent Docker volume mapped to the Spring Boot container (or an S3-compatible service if configured), never in the application source tree.

### Development Workflow Integration

- Local development will use `docker-compose.dev.yml` to spin up PostgreSQL and FastAPI, but developers will run Next.js and Spring Boot natively on their host machines (`npm run dev` and `./mvnw spring-boot:run`) to leverage instantaneous hot-reloading.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
The tripartite architecture (Next.js 16 App Router, Spring Boot 4.x, FastAPI) is highly cohesive. Next.js handles the BFF pattern perfectly, shielding the stateless Spring API, which in turn acts as a robust orchestrator for the stateless Python AI worker. Docker provides the connective tissue ensuring reproducible networking.

**Pattern Consistency:**
The mandated `camelCase` standard across all JSON boundaries successfully mitigates the primary risk of polyglot architectures (casing mismatches). The unified JSend API envelope guarantees frontend components don't crash from varying error topologies.

**Structure Alignment:**
The App Router directory structure naturally aligns with a feature-driven domain, matching Spring Boot's modular Domain-Driven Design (DDD) approach. 

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
All core modules (Auth, Cases, Tenants, Notifications, AI Pipeline) have dedicated directory trees and defined execution flow paths in both the frontend and backend. 

**Functional Requirements Coverage:**
- FR07-FR11 (Multi-tenancy): Solved deeply at the ORM layer with Spring's `AbstractRoutingDataSource`.
- FR17, FR38-FR40 (Traceability): Solved deeply at the ORM layer with Hibernate Envers.
- FR27-FR32 (AI Valuation): Solved via Webhooks + Server Sent Events bypassing long-polling bottlenecks.

**Non-Functional Requirements Coverage:**
- Security constraints (HttpOnly JWTs, Tenant context boundaries) are structurally enforced. Performance requirements are met by leveraging React Server Components (shipping zero JS for table views) and Java 21 Virtual Threads (handling thousands of SSE connections cheaply).

### Implementation Readiness Validation ✅

**Decision Completeness:**
All critical dependencies are locked to specific modern versions (Next 16, Spring 4, Java 21, Postgres 18).

**Structure Completeness:**
A rigid project tree dictating where components, API routes, configurations, and domain logic must live has been finalized. 

**Pattern Completeness:**
Conflict points have been removed through explicit edicts regarding database naming conventions (`snake_case`), error bubbling, and state management.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH - The architecture directly addresses the highest-risk PRD elements (AI latency, zero-tolerance tenant isolation) with proven, modern design patterns.

**Key Strengths:**
- Extremely secure multi-tenancy model without the cost of separate DBs.
- Modern React payload size minimization via Server Components.
- Highly scalable long-running task management via Webhooks/SSE.

**Areas for Future Enhancement:**
- Introduction of an API Gateway (like Kong/Traefik) if moving to a Kubernetes cluster.
- Externalization of SSE to a WebSocket edge service (like Socket.io or AWS API Gateway) if concurrent user load exceeds single-instance limits.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Initialize the three distinct codebases (`frontend/`, `backend/`, `ai-service/`) utilizing the terminal commands defined in the Starter Template Analysis section, and establish the `docker-compose.yml` network.
