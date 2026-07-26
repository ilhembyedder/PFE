# LeasRecover — Code Review & Issue Register

**Review date:** 2026-07-26
**Commit reviewed:** `abf4319` (merge of PR #1 from `ilhembyedder/S1`)
**Scope:** complete read of `backend/` (133 Java files), `frontend/` (60+ files), `ai-service/` (8 files), all infra config, and all 20 BMad planning/implementation artifacts.
**Method:** static read-only review. No code was executed and no files were modified.

For project context, architecture and setup instructions see [`../README.md`](../README.md).

---

## Contents

1. [Executive summary](#1-executive-summary)
2. [🔴 Critical findings](#2--critical-findings)
3. [🟠 High findings](#3--high-findings)
4. [🟡 Medium findings](#4--medium-findings)
5. [Dead and unfinished code](#5-dead-and-unfinished-code)
6. [Test suite audit](#6-test-suite-audit)
7. [Architecture-doc drift](#7-architecture-doc-drift)
8. [Remediation roadmap](#8-remediation-roadmap)

### Severity definitions

| | Meaning |
|---|---|
| 🔴 **Critical** | Exploitable security hole, leaked credential, or a defect that makes a core advertised capability nonexistent. Fix before any deployment or demo. |
| 🟠 **High** | Broken functionality, a real security weakness, or data loss. Fix before the next milestone. |
| 🟡 **Medium** | Correctness, performance, maintainability and quality debt. Schedule deliberately. |

---

## 1. Executive summary

The project is **feature-broad and structurally sound**. The multi-tenant schema-per-tenant design is implemented properly at the Hibernate level, the BFF cookie-sealing pattern is genuinely well done (AES-256-GCM, `HttpOnly`, `SameSite=Strict`, no token ever reaching the browser), Envers auditing works, and the backend has ~185 tests. The 41 PRD functional requirements are, on paper, all covered.

The problems fall into three clusters:

1. **Secrets and authentication.** Live credentials are committed, the JWT secret defaults to a publicly known placeholder in Docker, one endpoint is entirely unauthenticated, and a header-based authentication fallback is enabled by default. The frontend route guard can be bypassed outright.
2. **The AI module does not exist.** The product's stated core differentiator returns a hardcoded response for every input. This was a deliberate MVP stub per story 5-1, but it is not marked as such anywhere in the code or docs.
3. **Deployment is broken.** The Docker path cannot work as configured: a mismatched environment variable name, a missing volume for uploads, dev servers shipped as production images, and TLS verification disabled in both Dockerfiles.

Authorization is the weakest structural area: there is **no `@EnableMethodSecurity` and zero `@PreAuthorize` in the entire backend**. Role checks are ~10 copy-pasted string comparisons spread across three unrelated layers, and roughly 13 case endpoints were simply missed.

### The ten critical findings

| ID | Finding | Primary location |
|---|---|---|
| [C1](#c1--live-smtp-credentials-committed-to-the-repository) | Live Gmail SMTP credentials committed as YAML defaults | `application.yml:36-37` |
| [C2](#c2--jwt-signed-with-a-publicly-known-default-secret) | JWT signed with the public default secret in Docker; short secrets silently zero-padded | `application.yml:51`, `JwtService:25-34` |
| [C3](#c3--the-ai-webhook-is-completely-unauthenticated) | AI webhook is `permitAll`, and the DB schema is chosen from the request body | `SecurityConfig:36`, `CaseController:284-306` |
| [C4](#c4--header-fallback-authentication-is-on-by-default) | `app.security.allow-header-fallback` defaults to `true` | `TenantFilter:42,77-85` |
| [C5](#c5--frontend-route-guard-can-be-bypassed) | Middleware matcher misses the real (un-aliased) routes | `middleware.js:32`, `next.config.mjs:3-22` |
| [C6](#c6--role-escalation-into-the-admin-ui) | Role is read from a client-writable cookie; BFF admin routes have no role check | `auth/login/route.js:69-75`, `auth/session/route.js` |
| [C7](#c7--the-ai-service-is-entirely-simulated) | No LLM, no OCR, no PDF parsing — hardcoded output for every upload | `llm_extraction.py:23-67` |
| [C8](#c8--ssrf-and-unbounded-upload-in-the-ai-service) | SSRF via attacker-controlled `webhookUrl`; unbounded file read; no auth | `llm_extraction.py:92`, `extraction.py:38` |
| [C9](#c9--tenant-migrations-never-reach-existing-tenants) | Tenant Flyway migrations run only at provisioning time | `TenantProvisioningService:39-45` |
| [C10](#c10--default-super-admin-credentials-committed) | Super-admin seeded with a committed bcrypt hash | `V1.1__seed_super_admin.sql:5` |

---

## 2. 🔴 Critical findings

### C1 — Live SMTP credentials committed to the repository

**Location:** `backend/src/main/resources/application.yml:36-37`

The Spring Mail configuration carries a personal Gmail address and a **working 16-character Google app password** as the property *defaults*:

```yaml
username: ${SPRING_MAIL_USERNAME:<a personal gmail address>}
password: ${SPRING_MAIL_PASSWORD:<a working 16-character app password>}
```

The literal values are deliberately not reproduced here. They are visible at the location above, and duplicating a live credential into a second tracked file only widens the exposure and gives secret scanners a second hit.

**Impact:** anyone with repository access can send mail as that account. The credential is in git history, so deleting the line is not sufficient.

**Fix:**
1. Revoke the app password at <https://myaccount.google.com/apppasswords> **today**.
2. Remove the defaults — leave `${SPRING_MAIL_USERNAME}` with no fallback so startup fails loudly when unset.
3. Purge from history (`git filter-repo` or BFG) and force-push, or — if history rewriting is unacceptable for a thesis submission — at minimum revoke and document the incident.
4. Add `SPRING_MAIL_USERNAME` / `SPRING_MAIL_PASSWORD` to `.env.example` and `docker-compose.yml`.

---

### C2 — JWT signed with a publicly known default secret

**Locations:** `application.yml:51` · `docker-compose.yml` (backend `environment:` block) · `modules/auth/JwtService.java:25-34`

Two compounding problems.

**(a)** The secret defaults to the literal placeholder `replace_me_with_a_secure_base64_encoded_256bit_key`, and `docker-compose.yml` **never passes `JWT_SECRET`** to the backend container. Every Docker deployment therefore signs tokens with a value published in this repository. An attacker can mint a token with `role: SUPER_ADMIN` and any `tenantId`, defeating authentication and tenant isolation entirely.

**(b)** `getSigningKey()` pads short secrets rather than rejecting them:

```java
if (keyBytes.length < 32) {
    byte[] padded = new byte[32];
    System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
    keyBytes = padded;                 // a 4-char secret becomes a "valid" 256-bit key
}
```

**Fix:**
- Throw `IllegalStateException` at startup if the secret is absent, equal to the placeholder, or shorter than 32 bytes. Delete the padding branch.
- Pass `JWT_SECRET: ${JWT_SECRET:?JWT_SECRET is required}` in compose so the stack refuses to start without it.
- While you are in this file, add `iss` and `aud` claims and validate them; consider a refresh-token pattern (the architecture doc specifies one, but only a single non-revocable 24-hour token exists).

---

### C3 — The AI webhook is completely unauthenticated

**Locations:** `config/SecurityConfig.java:36` · `modules/cases/CaseController.java:284-306`

```java
.requestMatchers("/api/v1/internal/webhooks/**").permitAll()
```

There is no shared secret, no HMAC signature, no IP allowlist, and no network policy. `docker-compose.yml` publishes port 8080 to the host.

Worse, the handler **derives the database schema from the untrusted request body**:

```java
String schema = "tenant_" + payload.getTenantId().toString().replace("-", "");
TenantContextHolder.setTenantId(schema);
```

**Impact:** an unauthenticated attacker can POST `{"caseId":…, "tenantId":…, "status":"SUCCESS", "data":{"marketValueCents":…}}` to:
- write forged valuations into **any tenant's schema**,
- flip valuation status, unblocking the `→ VENTE` transition,
- create or resolve `VEHICLE_DISCREPANCY` alerts,
- push arbitrary payloads to any connected SSE client.

**Fix:**
- Add an HMAC-SHA256 signature header computed over the raw body with a shared secret, verified before any processing. Reject on mismatch with 401.
- Do not publish port 8080 to the host in production; keep the backend on the Docker bridge network only.
- Cross-check `payload.tenantId` against the tenant recorded on the `AIValuation` row rather than trusting it to select the schema.
- Make the handler idempotent (see [H-4](#h-4-race-the-ai-call-fires-before-its-transaction-commits)).

---

### C4 — Header-fallback authentication is on by default

**Locations:** `config/tenant/TenantFilter.java:42, 77-85` · consumed in `CaseController:43,316`, `DocumentController:26`, `ClientController:28`, `ContractController:33`

```java
@Value("${app.security.allow-header-fallback:true}")
private boolean allowHeaderFallback;
```

The property is **not set in `application.yml` or anywhere else**, so it is `true` everywhere. When the `SecurityContext` principal is not a `UserPrincipal`, the filter accepts `X-Tenant-ID` and `X-User-Email` **from the client**.

Combined with C3 (a `permitAll` route that still passes through this filter), this is a tenant-impersonation lever. It is unnecessary in production: the Next.js BFF already forwards a real `Authorization: Bearer` header on every call.

**Fix:**
- Default to `false`, and set it explicitly to `false` in `application.yml`.
- This will break `CaseControllerTest`, which relies on `@WithMockUser` producing a `String` principal. Fix the tests by constructing a real `UserPrincipal` — do not weaken the default to keep the suite green.

---

### C5 — Frontend route guard can be bypassed

**Locations:** `frontend/src/middleware.js:32` · `frontend/next.config.mjs:3-22`

`next.config.mjs` rewrites four prefixed aliases onto the real filesystem routes:

```
/dashboard → /cases     /dashboard/:path* → /:path*
/admin     → /tenants   /admin/:path*     → /:path*
```

But the middleware only matches the aliases:

```js
export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
```

`http://host/cases`, `/leasing`, `/settings`, and `/tenants` are **directly reachable and entirely unguarded**. The only remaining protection is a client-side session fetch inside the layouts, which renders the shell before redirecting.

The application itself links to the unguarded paths — `AlertCard.js:33,35,37,39` and `InlineBlocker.js:33` all point at `/cases/${caseId}`.

**Fix (pick one):**
- **Preferred:** delete the rewrites entirely and use one canonical URL set. The aliasing serves no purpose and also causes [M-15](#m-15-dashboard-and-cases-are-the-same-page).
- **Minimal:** extend the matcher to `['/dashboard/:path*', '/admin/:path*', '/cases/:path*', '/leasing/:path*', '/settings/:path*', '/tenants/:path*']`.

Also add an `exp` check — see [H-9](#h-9-middleware-never-validates-the-jwt-exp-claim).

---

### C6 — Role escalation into the admin UI

**Locations:** `frontend/src/app/api/auth/login/route.js:69-75` · `api/auth/session/route.js:4,14` · `api/super-admin/tenants/route.js:4,31` · `api/super-admin/tenants/[id]/deactivate/route.js:4`

Login sets a second cookie with `httpOnly: false`:

```js
cookieStore.set('user_session', JSON.stringify({ userId, role, name, tenantId }), {
  httpOnly: false, ...
});
```

`/api/auth/session` simply parses and echoes that cookie back — it **never consults the sealed `session_token`**. The admin layout gates on the result (`(admin)/layout.js:51`).

So `document.cookie = 'user_session={"role":"SUPER_ADMIN",...}'` grants entry to the super-admin console. Independently, the BFF's `/api/super-admin/*` and `/api/admin/tenant*` handlers perform **no role check at all** — any valid `session_token` is forwarded.

**Impact:** UI-level privilege escalation. The backend still rejects the underlying data calls (the real JWT is untouched), so this is not direct data compromise — but the admin console becomes reachable, and the BFF is not defending its own trust boundary.

**Fix:**
- Rewrite `/api/auth/session` to decrypt `session_token` and derive the session from the JWT payload.
- Make `user_session` `httpOnly: true`, or delete it and have the client call `/api/auth/session`.
- Add explicit role assertions in the `super-admin` and `admin/tenant` route handlers.

---

### C7 — The AI service is entirely simulated

**Location:** `ai-service/app/services/llm_extraction.py:11-87`

There is **no LLM call, no OCR, no PDF parsing, and no prompt** anywhere in the service. `requirements.txt` contains no `openai`, `anthropic`, `pdfplumber`, `PyPDF2`, `pytesseract`, or `langchain`. The "pipeline" is:

```python
time.sleep(3);  send_webhook(... PENDING/READING/30 ...)
time.sleep(3);  send_webhook(... PENDING/EXTRACTION/70 ...)
time.sleep(3);  send_webhook(... SUCCESS/CALCULATION/100, data={
                     "brand": "BMW", "model": "520d", "year": 2020,
                     "mileage": 87000, "condition": "Bon état",
                     "marketValueCents": 1840000, "currencyCode": "EUR" })
```

`file_bytes` is used **only** for an emptiness check at line 20. It is never parsed, never checked for the `%PDF-` magic bytes, never written to disk.

**Impact:**
- Every case in the system receives an identical €18 400 valuation for a 2020 BMW 520d. The deviation, the reliability indicator, and the `→ VENTE` gate are therefore all meaningless.
- Because the extracted vehicle is always a BMW, `AIValuationService`'s brand/model/year comparison raises a `VEHICLE_DISCREPANCY` alert on essentially **every non-BMW case**.
- The product brief presents this module as the primary differentiator, and MVP success criterion #1 is *"the AI module correctly extracts data from 10+ real appraisal reports with >90% accuracy"*. That criterion is currently unmeetable.

**Context — this was deliberate.** Story `_bmad-output/implementation-artifacts/5-1-automated-expertise-pipeline-trigger-extraction-api.md:41` says *"Stub or mock the PDF parsing and LLM API call for the MVP"*, and lines 42–63 specify exactly these sleep timings and this literal payload. The implementation matches the story byte for byte. The defect is not that it was stubbed — it is that **nothing in the code, the README, or the API docs says so**, so a reader (or a demo audience) reasonably concludes the feature works.

**Fix:**
- **Short term (today):** mark it loudly. Add a module docstring, a startup log line, and a `X-Simulated: true` response header. This is now documented in [`../README.md` §9](../README.md#9-ai-service-reference).
- **Real fix:** implement genuine extraction — `pdfplumber` for text (plus `pytesseract` for scans), then a structured LLM call with a real prompt and a Pydantic-validated response schema. Keep the simulator behind a `SIMULATE_EXTRACTION=true` flag for offline development and tests.

---

### C8 — SSRF and unbounded upload in the AI service

**Locations:** `ai-service/app/services/llm_extraction.py:90-97` · `app/api/routes/extraction.py:8,17,38`

**(a) No authentication.** `POST /api/extract` has no API key, no shared secret, no mTLS, and no dependency guard. `docker-compose.yml:57-58` publishes port 8000 to the host.

**(b) SSRF.** `webhookUrl` is fully attacker-controlled and passed straight to `requests.post()`. Pydantic's `HttpUrl` validates *syntax only* — it happily accepts `http://169.254.169.254/latest/meta-data/`, `http://postgres:5432/`, or `http://backend:8080/api/v1/internal/webhooks/ai-progress`. There is no scheme or host allowlist, no private/link-local/loopback blocking, no DNS-rebinding protection, and `requests` follows redirects by default (so an allowlist alone would be insufficient).

Chained with C3, an attacker can make the service forge valuation results against the backend from inside the Docker network.

**(c) Unbounded file read.** `file_bytes = await file.read()` has no size cap. A multi-gigabyte upload is read entirely into memory — a trivial OOM DoS. The Java side enforces 10 MB, but that protects only the backend path, not direct calls to port 8000.

**(d) The type check is trivially bypassable.** `extraction.py:17` uses a logical **OR**:

```python
if not (filename.lower().endswith('.pdf') or file.content_type == 'application/pdf'):
```

Renaming `payload.exe` to `payload.pdf` passes, as does sending any bytes with a spoofed `Content-Type`. No magic-byte verification.

**(e) Log leakage.** Lines 33, 47, 69 log the **entire payload**; line 96 logs the **full webhook URL** including any query string, so tokens embedded there land in plaintext logs.

**Fix:**
- Require a shared-secret header on `/api/extract`, verified with `hmac.compare_digest`.
- Replace the free-form `webhookUrl` with a configured backend base URL — the caller only needs to supply a path, if anything. If it must stay dynamic, allowlist the host, resolve DNS and reject private/link-local/loopback ranges, and set `allow_redirects=False`.
- Stream the upload with a hard size cap; reject before reading past the limit.
- Verify the `%PDF-` magic bytes.
- Redact URLs and payloads from logs; call `logging.basicConfig()` (it is currently never called, so most `logger.info` output is silently dropped anyway).

---

### C9 — Tenant migrations never reach existing tenants

**Locations:** `modules/tenant/TenantProvisioningService.java:39-45` · `application.yml:28-31`

Public migrations run automatically at boot. Tenant migrations run **only** inside `provisionTenant()`:

```java
Flyway.configure()
      .dataSource(dataSource)
      .schemas(schemaName)
      .locations("classpath:db/migration/tenant")
      .migrate();
```

There is no startup task that iterates existing tenant schemas.

**Impact:** adding `V4__*.sql` upgrades **nothing**. Only tenants provisioned *after* the deploy get the new schema. Every pre-existing tenant silently drifts and begins throwing SQL errors at runtime. With 3 tenant migrations already in the tree, this will bite on the very next schema change.

**Fix:** add an `ApplicationRunner` (or `@PostConstruct` on a dedicated bean) that queries `public.tenant` for active tenants and runs the same Flyway configuration against each schema, logging per-tenant results. Guard it behind a property so it can be disabled for local single-tenant work, and make a failure on one tenant not abort the others.

---

### C10 — Default super-admin credentials committed

**Location:** `backend/src/main/resources/db/migration/public/V1.1__seed_super_admin.sql:5`

The migration inserts `superadmin@example.com` with a fixed, committed bcrypt hash. Because it is a Flyway migration, this administrative account is created in **every environment**, including production, with a password whose hash is public.

**Fix:** either read the seed credentials from environment variables at first boot (a Java `ApplicationRunner` rather than a SQL migration), or keep the migration but force a password change on first login and document the default prominently. At minimum, change the hash and rotate the password before any deployment or demo.

---

## 3. 🟠 High findings

### Backend

#### H-1. Missing role checks on ~13 case endpoints

**Location:** `modules/cases/CaseController.java:125-265` and the corresponding `CaseService` methods

`POST /cases`, `GET /cases`, `next-phase` and `valuation` verify `GESTIONNAIRE | ADMIN`. These do **not**:

`GET /cases/{id}` · `PUT /cases/{id}` · `PUT /cases/{id}/assign` · `GET /cases/assignees` · `POST /cases/{id}/notes` · `GET /cases/{id}/notes` · `GET /cases/{id}/history` · `GET /cases/{id}/export` · `GET /cases/{id}/prerequisites` · `GET /cases/alerts` · `GET /cases/{id}/alerts` · `GET /cases/{id}/documents` · `GET /cases/{id}/documents/{docId}/download`

Tenant scoping *is* enforced on all of them, so this is not cross-tenant leakage. But any authenticated user of the tenant — whatever their role string — can read and mutate cases.

#### H-2. Authorization has no single enforcement point

**Location:** codebase-wide

There is **no `@EnableMethodSecurity` and zero `@PreAuthorize` / `@Secured` annotations in the entire backend.** Authorization lives in three unrelated places:

1. Ant matchers in `SecurityConfig:35-40`,
2. a string comparison inside `TenantFilter:140` for `/api/v1/admin/**`,
3. `!"GESTIONNAIRE".equals(role) && !"ADMIN".equals(role)` repeated roughly ten times across services and controllers.

This is precisely why H-1 happened. **Fix:** enable method security, introduce a `Role` enum, annotate every controller method, and delete the hand-rolled comparisons.

#### H-3. SSE endpoint has no authorization and no tenant isolation

**Locations:** `CaseController.java:267-270` · `modules/notification/ValuationProgressService.java:22,29-51`

```java
@GetMapping(value = "/{id}/valuation-progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamProgress(@PathVariable UUID id) {
    return valuationProgressService.registerEmitter(id);   // no checks whatsoever
}
```

No role check, no tenant check, no verification that the case exists or belongs to the caller. Emitters are stored in a single global `ConcurrentHashMap` keyed by the **bare `caseId` with no tenant qualifier**.

Any authenticated user, from any tenant, can subscribe to any case ID and receive its brand, model, market value and deviation.

**Fix:** verify the case belongs to the caller's tenant and that the caller has an appropriate role; key emitters by `(tenantId, caseId)`.

#### H-4. Race: the AI call fires before its transaction commits

**Location:** `modules/cases/DocumentUploadService.java:107, 211-213, 255-289`

`triggerAiExtraction` is invoked *inside* the `@Transactional storeDocument`. The AI service can post its webhook before the `AIValuation` row commits, so `processSuccessCallback` fails with "No PENDING AI valuation found" (404) and the valuation stays `PENDING` forever. The failure path (`updateValuationStatus`) has the same problem.

With the current 9-second simulated pipeline this rarely fires; with a fast real service, or under load, it will.

**Fix:** dispatch from `TransactionSynchronizationManager.registerSynchronization(...).afterCommit()`, or better, write an outbox row and have a separate poller dispatch it. Also make `processSuccessCallback` idempotent.

#### H-5. Multipart size limit mismatch → HTTP 500 instead of 413

**Locations:** `application.yml` (property absent) · `DocumentUploadService.java:51,148`

The service enforces a 10 MB limit, but `spring.servlet.multipart.max-file-size` is never configured, so Boot's **1 MB** default applies. Any upload over 1 MB throws `MaxUploadSizeExceededException`, which `GlobalExceptionHandler` does not handle → **HTTP 500** with a raw message.

**Fix:** set `spring.servlet.multipart.max-file-size: 10MB` and `max-request-size: 12MB`, and add an `@ExceptionHandler(MaxUploadSizeExceededException.class)` returning 413.

#### H-6. Tenant provisioning is not atomic

**Locations:** `TenantProvisioningService.java:23-56` · `AdminProvisioningService.java:26,47`

`provisionTenant` is `@Transactional`, but Flyway DDL runs on its own connection and the admin/config insert is `REQUIRES_NEW`. If the outer transaction rolls back after those steps, the schema and the ADMIN user survive while the `public.tenant` row disappears — leaving an orphan schema with unreachable users, and allowing the same tenant name to be re-provisioned.

**Fix:** make provisioning a explicit multi-step saga with compensating actions (drop the schema on failure), or move the whole operation outside a declarative transaction and manage state transitions explicitly (`PROVISIONING` → `ACTIVE` / `FAILED`).

#### H-7. `createCase` silently overwrites existing master data

**Location:** `modules/cases/CaseService.java:88-142`

The find-or-create logic looks up a client by registration number or email, then **unconditionally overwrites** its name, registration number, email, phone and address with whatever is in the request (`:103-108`). The same happens for the contract (`:121-124`) and the vehicle (`:137-141`).

Creating a case for an existing client can silently wipe or corrupt that client's record — including for other cases referencing it.

**Fix:** only populate fields on creation. On a match, either reuse the record as-is or require an explicit `updateExisting` flag.

#### H-8. Uploaded documents are lost on container restart

**Location:** `docker-compose.yml` (backend service)

Files are written to `${leasrecover.upload.dir:./uploads}` inside the container, and **no volume is mounted**. Every uploaded appraisal report, contract and photo disappears when the container is recreated.

**Fix:** add a named volume (`- uploads_data:/app/uploads`) and set `UPLOAD_DIR=/app/uploads`. Longer term, move to S3-compatible object storage as the architecture document anticipates.

#### H-9. Actuator is publicly exposed

**Location:** `config/SecurityConfig.java:40`

`/actuator/**` does not match `/api/v1/**`, so `.anyRequest().permitAll()` leaves `health`, `info` and `metrics` open. More importantly this is a **fail-open** design: any controller mounted outside `/api/v1` is public by default.

**Fix:** change the final rule to `.anyRequest().authenticated()` and explicitly permit only what must be public (`/actuator/health/liveness`, `/actuator/health/readiness`, `/error`).

#### H-10. Exception messages leak to clients

**Location:** `core/GlobalExceptionHandler.java:42-46`

The catch-all returns `ex.getMessage()` with HTTP 500 and logs nothing. SQL errors, constraint names, file paths and Hikari messages all reach the client, while the stack trace is lost to operators.

Unhandled exception types that will therefore surface as leaky 500s: `ConstraintViolationException`, `DataIntegrityViolationException`, `OptimisticLockingFailureException` (relevant — every entity has `@Version`), `MaxUploadSizeExceededException`, `MethodArgumentTypeMismatchException` (a malformed UUID in a path), `HttpMessageNotReadableException`, `AccessDeniedException`.

**Fix:** return a generic message plus a correlation ID, log the full stack trace at ERROR, and add dedicated handlers for the types above.

### Frontend

#### H-11. `params` not awaited → client/contract/vehicle mutations are broken

**Locations:** `api/clients/[id]/route.js:5,48,95` · `api/contracts/[id]/route.js:5,48,95` · `api/contracts/[id]/vehicle/route.js:5,48`

Next.js 16 makes `params` a Promise. These six call sites destructure it synchronously:

```js
const { id } = params;          // undefined
```

Every other dynamic route correctly does `const { id } = await params;`. The result is a backend call to `/api/v1/clients/undefined`.

**Impact: client edit, client delete, contract edit, contract delete, and vehicle create/update are all non-functional** from the leasing page.

**Fix:** `const { id } = await params;` in all six places. Add a route-handler test to catch regressions.

#### H-12. `BACKEND_URL` vs `BACKEND_API_URL` — Docker cannot reach the API

**Locations:** all 26 proxy handlers (e.g. `api/cases/route.js:32`) · `docker-compose.yml` (frontend `environment:`)

The code reads `process.env.BACKEND_URL`; compose sets `BACKEND_API_URL=http://backend:8080/api/v1`. The variable read is unset, so the fallback `http://localhost:8080` is used — which inside the frontend container points at the frontend itself. The compose value also already includes `/api/v1`, which the code appends again.

**Fix:** set `BACKEND_URL=http://backend:8080` in compose, drop `BACKEND_API_URL`, and add both `BACKEND_URL` and `BFF_COOKIE_SECRET` to `.env.example`.

#### H-13. Frontend Dockerfile ships the dev server and disables TLS

**Location:** `frontend/Dockerfile:7,11,13`

```dockerfile
RUN npm ci --strict-ssl=false          # supply-chain risk
ENV NEXT_TELEMETRY_DISABLED 1          # legacy syntax
CMD ["npm", "run", "dev"]              # dev server as "production"
```

No `next build`, no `next start`, no `output: 'standalone'`, no `.dockerignore`, runs as root.

The `npm run dev` command sets `NODE_ENV=development`, which means `lib/crypto.js:4`'s production guard never fires and **the container silently seals session cookies with the hardcoded fallback secret** — see H-14.

**Fix:** multi-stage build → `npm ci` → `next build` → runtime stage running `next start` as a non-root user. Remove `--strict-ssl=false`. Add `frontend/.dockerignore`.

#### H-14. Hardcoded fallback cookie secret

**Location:** `frontend/src/lib/crypto.js:4-8`

```js
if (process.env.NODE_ENV === 'production') throw new Error(...);
console.warn(...);
return 'a-default-extremely-secure-and-long-secret-key-32-chars';
```

The fallback is committed. Because of H-13 the production guard never triggers in the container.

**Fix:** throw whenever `BFF_COOKIE_SECRET` is missing, regardless of `NODE_ENV`. Document the variable and generate one in the setup instructions.

#### H-15. Middleware never validates the JWT `exp` claim

**Location:** `frontend/src/middleware.js:18`

`decrypt()` only proves the ciphertext is intact — it says nothing about expiry. A JWT that expired hours ago passes the guard, so the user gets the full UI followed by a wall of 401 notifications instead of a clean redirect to `/login`.

**Fix:** decode the payload and compare `exp` against `Date.now()/1000`; redirect and clear cookies when expired.

#### H-16. No error boundaries, and eight silent failures

**Location:** `frontend/src/app/**`

There is **no `error.js`, `loading.js`, `global-error.js`, or `not-found.js` anywhere**. An unhandled render error white-screens the application.

Fetch failures that are `console.error`'d with no user feedback: `cases/page.js:48-58` (priority alerts), `leasing/page.js:65-69` and `:87-91` (clients, contracts), `cases/new/page.js:32-34` (contract picker), `cases/[id]/page.js:364-366` and `:375-377` (prerequisites, documents), `(dashboard)/layout.js:70-72` (branding).

**Fix:** add `error.js` and `not-found.js` at `src/app/` and per route group; surface a notification or an inline error state at each of the eight sites.

#### H-17. Unencoded query interpolation in the documents proxy

**Location:** `frontend/src/app/api/documents/route.js:20-21,33`

```js
`${backendUrl}/api/v1/documents?entityType=${entityType}&entityId=${entityId}`
```

Neither value is passed through `encodeURIComponent`. A value containing `&` or `#` lets a caller inject or override backend query parameters.

**Fix:** `encodeURIComponent` both, and validate `entityType` against the allowed set before forwarding.

### AI service

#### H-18. Background tasks are not durable

**Location:** `ai-service/app/api/routes/extraction.py:41-47`

FastAPI `BackgroundTasks` live in the process. A restart, crash, or scale-down mid-flight silently drops the job. The backend's `AIValuation` row then stays `PENDING` **forever** and the frontend SSE stream never completes. There is no queue, no persistence, no idempotency key, and no dedup.

**Fix:** move to a durable queue (Celery / RQ / ARQ with Redis) with retries and an idempotency key. Add a backend reaper that fails valuations stuck in `PENDING` beyond a timeout so the UI can offer a retry.

#### H-19. Webhook failures are misreported as unreadable documents

**Location:** `ai-service/app/services/llm_extraction.py:72-87, 97`

`send_webhook` re-raises on failure. If the *stage-1* webhook fails, the outer `except` fires and sends a `FAILED` webhook with the message *"Le document est illisible ou n'est pas un rapport d'expertise valide."* — telling the user their PDF is broken when the real cause was a network or backend outage.

Worse: if the **`SUCCESS`** webhook throws after the backend has already processed it, the handler sends a `FAILED` webhook, corrupting the state of a case that actually succeeded.

Compounding this, `processSuccessCallback` runs inside `@Transactional`; a backend-side bug returns 500 to the AI service, which then flips the case to FAILED. **A backend bug therefore manifests to the user as "your document is unreadable."**

**Fix:** distinguish extraction failures from delivery failures. Retry webhook delivery with backoff; never send `FAILED` because a webhook could not be delivered; never send `FAILED` after `SUCCESS` has been sent. Use `logger.exception` to preserve stack traces (currently discarded at lines 73, 87, 96).

#### H-20. AI service Dockerfile: root user and disabled PyPI TLS

**Location:** `ai-service/Dockerfile:1,6`

```dockerfile
FROM python:3.11-slim                                    # unpinned, no digest
RUN pip install --trusted-host pypi.org \
                --trusted-host files.pythonhosted.org …  # disables TLS verification
```

No `USER`, no `HEALTHCHECK` (despite `/health` existing), no `.dockerignore`, no `PYTHONUNBUFFERED`, single worker with no `--workers`.

**Fix:** remove both `--trusted-host` flags, pin the base image by digest, add a non-root `USER`, add a `HEALTHCHECK` hitting `/health`, set `PYTHONUNBUFFERED=1`.

### Backend (addendum)

#### H-21. A residual value of zero produces a confident, false "reliable" valuation

*Found while specifying the valuation card. Not present in the original pass.*

**Locations:** `AIValuationService.java:131-144` · `CaseCreateRequest.java:60-62` · `CaseUpdateRequest.java:20-22`

```java
double deviationPercentage = 0.0;
if (initialResidualVal > 0) {
    deviationPercentage = ((double) Math.abs(deviationValueCents) / initialResidualVal) * 100.0;
}
// ...
if (deviationPercentage < moderate) {
    reliabilityIndicator = "RELIABLE";
}
```

When `initialResidualValueCents` is `0` or `null`, the percentage is never computed and stays at its initialiser of `0.0`. That value is then compared against the moderate threshold, `0.0 < 10.0` is true, and the case is labelled **`RELIABLE`**.

**This is reachable through the normal interface.** `@Min(value = 0)` explicitly permits zero, despite the validation message reading *"Initial residual value must be positive"*. A manager who enters `0` as the residual value, or leaves it at zero, and then uploads an appraisal report receives a green *Fiable* indicator on a comparison that was never performed.

**Why this ranks High rather than Medium.** Every other defect in this document either fails loudly or fails safe. This one fails *silently in the reassuring direction*, on the single screen the product exists to produce, and it feeds the prerequisite that gates the transition to `VENTE`. `PRODUCT.md` states the success condition as *"the valuation result is trusted enough to be acted on without re-checking the source PDF"*; this defect makes that trust actively dangerous.

**Fix:**
1. Change both DTOs to `@Positive`, and correct the message, which already claims that constraint.
2. Introduce a fourth reliability value, `NOT_COMPUTABLE`, returned whenever the residual is absent or non-positive. Do not fall through to a band.
3. Never derive a band from an uncomputed percentage. Guard on the computation, not on the value.
4. Treat `NOT_COMPUTABLE` as *not satisfying* the `→ VENTE` prerequisite. `CasePrerequisiteService` currently counts any valuation with status `SUCCESS`, so a zero-residual case can currently be advanced to sale on the strength of a meaningless comparison.

The corresponding interface behaviour is specified in `DESIGN_SCREENS.md` §5.

---

## 4. 🟡 Medium findings

### Correctness

| ID | Finding | Location |
|---|---|---|
| M-1 | **Three of four phase prerequisite hooks are empty stubs.** `checkMiseEnDemeurePrerequisites`, `checkSaisiePrerequisites`, `checkCloturePrerequisites` are empty method bodies with `// Hook:` comments — those transitions are always allowed. Only `→ VENTE` has a real rule. | `CasePrerequisiteService.java:51-61` |
| M-2 | **Advancing past `CLOTURE` returns HTTP 500.** `RecoveryPhase.getNextPhase()` throws `IllegalStateException`, unmapped by the handler. `getPrerequisites` catches it; `advancePhase` does not. Should be 409. | `RecoveryPhase.java:22`, `CaseService.java:347` |
| M-3 | **`missingPrerequisites` is discarded.** `PrerequisiteNotMetException` carries a structured list, but the handler emits only the comma-joined string, so the frontend cannot render a checklist. | `PrerequisiteNotMetException.java:10-17`, `GlobalExceptionHandler.java:18-27` |
| M-4 | **Unvalidated `sortBy` → 500 and property probing.** The parameter is split on `,` and passed to `Sort.by()` with only 5 aliases mapped. `?sortBy=assignee.passwordHash` reaches Hibernate; the resulting 500 message (leaked by H-10) confirms which properties exist. `page`/`size` are unbounded — `size=1000000` is a DoS. | `CaseController.java:84-121` |
| M-5 | **`updateCase` overwrites with nulls** and has no role check or optimistic-lock conflict surfacing. | `CaseService.java:181-221` |
| M-6 | **`CaseAlert` timestamps are set manually** on an entity that also has `@CreatedDate`/`@LastModifiedDate`; the auditing listener overwrites them, so "escalation timestamps" are not what the code assumes. | `AlertEngineService.java:150-151, 202-203` |
| M-7 | **`phaseLegalDelays` keys are never validated** against `RecoveryPhase`. A typo in the admin UI silently disables deadline alerts for that phase. | `AlertEngineService.java:102-107`, `TenantConfigController` |
| M-8 | **Alert scheduler has no distributed lock** and there is no unique constraint on `(case_id, alert_type, is_resolved)`. With 2+ instances every tenant is processed N times concurrently, producing duplicate alerts. (The healing code already uses `findAllBy…`, suggesting duplicates are known to occur.) | `AlertEngineScheduler.java:29`, `V3__add_case_alerts_table.sql` |
| M-9 | **`Vehicle` is `@ManyToOne` on contract but always queried as `Optional`.** A second row for the same contract causes `NonUniqueResultException`. No DB unique constraint. | `Vehicle.java:19-21`, `VehicleRepository.java:11` |
| M-10 | **Unchecked casts on webhook data.** `(Map<String,Object>) payload.getData()` and `((Number) data.get("year"))` — malformed JSON produces `ClassCastException` → 500. | `AIValuationService.java:102-123` |
| M-11 | **`GET /admin/tenant/config` lazily creates and saves defaults** — a non-idempotent write on a GET. | `TenantConfigController.java:37-38, 74` |
| M-12 | **`deactivateTenant` throws bare `RuntimeException`** → 500 instead of 404. `getAllTenants()` returns soft-deleted tenants and raw entities (leaking `version`, `isDeleted`, `createdBy`). | `TenantProvisioningService.java:61,67-69`, `SuperAdminTenantController` |
| M-13 | **Response-header injection via filename.** `originalFileName` is interpolated into `Content-Disposition` unquoted and unescaped. | `CaseController.java:262-263`, `DocumentController.java:91-93` |
| M-14 | **Upload type check trusts the client `Content-Type`** with no magic-byte sniffing; the extension comes from the client filename. (Path traversal *is* correctly handled at `:362` and `:569`.) | `DocumentUploadService.java:152-166, 446-460` |
| M-15 | **`/dashboard` and `/dashboard/cases` are the same page.** The rewrite means both nav items land on the case registry; there is no distinct dashboard, and `selectedKeys={[pathname]}` can never highlight correctly. | `(dashboard)/layout.js:143-163`, `next.config.mjs:6-8` |
| M-16 | **Invalid Ant Design v6 tag colour.** `color={isCritical ? 'red-solid' : 'orange-solid'}` — v6 replaced this with `color="red" variant="solid"`. `"red-solid"` is not a preset, so the tag renders unstyled. | `AlertCard.js:94` |
| M-17 | **`AIUploadZone` never resets `uploading` on failure.** No `finally`, so the dropzone stays hidden until the user clicks "Réessayer". | `AIUploadZone.js:19-20,159` |
| M-18 | **`useTenantBranding()` crashes outside its provider** — `createContext()` has no default value, so destructuring throws. Any unit test of the consuming components will fail. | `branding-context.js:5` |
| M-19 | **Sort change does not reset to page 1**, leaving the user on an out-of-range page. | `cases/page.js:104-120` |
| M-20 | **Stale-closure risk in both idle timers.** `resetTimer` is recreated every render but listeners are registered once; cleanup may remove a different reference and leak listeners. | `(dashboard)/layout.js:87-131`, `(admin)/layout.js:71-113` |
| M-21 | **Typo:** `'Résilé'` should be `'Résilié'` (spelled correctly at `:884` and `:1016`). | `leasing/page.js:455` |
| M-22 | **Dead code in the metadata re-validation block.** FastAPI's `Form(...)` coercion rejects bad UUIDs with 422 before the block is reached; only an invalid `webhookUrl` can trigger it, and that path is untested. | `extraction.py:25-35` |

### Performance

| Where | Problem |
|---|---|
| `AlertEngineService.java:49` | `findAll()` loads **every** case in the schema into memory, then filters by tenant in Java; then 2 alert lookups **per case** ⇒ 2N queries per scheduler run. |
| `ContractService.java:36-39,73` | `vehicleRepository.findByContract` called per contract in `getAllContracts` — classic N+1. |
| `CaseService.java:176,219,253,402` | Same lookup after nearly every case operation. |
| `CaseService.java:510` | `findById` inside the priority-alerts stream plus lazy `contract → client` traversal ⇒ up to 15 queries for 5 alerts. |
| `CaseService.java:550-565` | O(n²) in-lambda re-scan of the valuation list to pick the newest, instead of sorting once. |
| `CaseSpecification.java:52-58` | Join-fetch combined with `findAll(spec, pageable)` ⇒ Hibernate paginates **in memory**; the `Sort` on `contract.client.…` also creates a second implicit join alongside the fetch join. |
| `PdfExportService.java:59-60` | Re-runs the full `getCase` + Envers history the caller may already hold; renders CPU-bound PDF inside `@Transactional(readOnly=true)`. |
| **Schema** | **No indexes** on `recovery_case(tenant_id)`, `document(case_id)`, `note(case_id)`, `ai_valuation(case_id, status)`, `app_user(email)`, `contract(reference_number)`. Only `case_alert` has any. NFR02 requires 1000 cases in under 2 seconds. |
| `application.yml:15` | `show-sql: true` + `format_sql: true` in the only profile. |
| `CaseService.advancePhase:391` | Synchronous SMTP send **inside** the transaction — a hanging mail server holds a DB connection and a row lock. |
| `ai-service` | Blocking `def` handler occupies one of AnyIO's 40 threadpool workers for ~9s per extraction ⇒ effective ceiling around 4 extractions/second. |

### Validation

- `CaseCreateRequest` has **no validation at all** on `currencyCode`; `CaseUpdateRequest` only checks `@Size(3)`. Neither restricts to ISO-4217.
- `vehicleYear` has `@Min(1900)` but no upper bound.
- `contractEndDate` is never checked against `contractStartDate`.
- `TenantCreateRequest.adminPassword` has **no length or complexity rule**, although `UserCreateRequest` requires ≥8.
- The `phase` and `tag` request params on document upload are unvalidated free strings stored verbatim into `document.phase_uploaded_in`.
- `entityType` on `/api/v1/documents` is validated only by `if/else if` chains in two places.
- `contract.reference_number` has no uniqueness constraint, yet `CaseService:111` looks it up expecting one.
- `tenant.data_retention_months` is accepted and stored but **never enforced** — FR41/NFR19 are not actually satisfied.
- **Domain strings that should be enums:** `AppUser.role`, every `status` field, `CaseAlert.alertType` and `criticality`, `AIValuation.status`, `Contract.status`, `Document.phaseUploadedIn`.

### Maintainability

| Finding | Detail |
|---|---|
| **~500 duplicated lines in the BFF** | The same 20-line auth + JWT-decode preamble is copy-pasted into **26** route handlers. There is no `lib/bff.js`. Extracting a `withAuth(handler)` wrapper would make C6, H-11, H-15 and H-17 one-line fixes. |
| **Duplicated layout chrome** | The Sider + Header + logout block (~180 lines) and the idle-timeout effect (43 lines) are near-identical between `(dashboard)/layout.js` and `(admin)/layout.js`. |
| **Four representations of the 5 phases** | `cases/page.js:18-24` (with colours), `cases/[id]/page.js:28-34` (without), `ConditionalPhaseStepper.js:7-13` (index map) and `:18-39` (items). |
| **Three `formatDate` helpers** | `cases/page.js:169-180`, `leasing/page.js:331-342`, `tenants/page.js:128-141`. |
| **Three upload implementations** | `cases/[id]/page.js:39-81`, `AIUploadZone.js:19-76`, `EntityDocumentVault.js:43-102` — with three different validation rules. |
| **Duplicated Jest AntD polyfill** | A 44-line `matchMedia`/`MessageChannel`/`ResizeObserver` block repeated in 4 test files. Belongs in a shared `jest.setup.js`. |
| **Schema-name construction duplicated 6×** | `"tenant_" + uuid.replace("-","")` appears in `TenantFilter:120`, `AuthController:106`, `TenantProvisioningService:36`, `AlertEngineScheduler:41`, `CaseController:294`, `DocumentUploadService:258`. No shared helper. |
| **`resolveUserEmail` copy-pasted into 4 controllers** | `CaseController:53` and `:321`, `DocumentController:31`, `ClientController:34`, `ContractController:40`. |
| **Three controllers in one file** | `CaseController.java` also declares `InternalWebhookController` (`:284`) and `DashboardAlertController` (`:310`). |
| **Two controllers bypass the service layer** | `TenantConfigController` and `TenantBrandingController` talk directly to repositories, with no `@Transactional` around their read-then-write sequences. |
| **No design tokens** | The dark palette (`#060D1A`, `#0F172A`, `#3B82F6`, `#94A3B8`, `#F8FAFC`, `#1E293B`, `#EF4444`, `#10B981`, `#F59E0B`…) appears as inline string literals in **hundreds** of places. Two subtly different "primary" gradients coexist. |
| **Global CSS injected from client components** | Four `<style jsx global>` / `<style>` blocks override Ant Design internal classes (`.ant-table-tbody > tr > td`, `.ant-select-dropdown`, `.ant-tabs-tab`) — explicitly discouraged by AntD v6. Row height is forced three times with three different values (48/48/52px). |
| **Conflicting fonts** | `globals.css:22` sets `font-family: Arial` on `body`, contradicting the Inter class applied in `layout.js:15`. `globals.css` also declares a `prefers-color-scheme` light/dark scheme the always-dark AntD theme ignores. |
| **Undeclared dependencies** | `dayjs` and `@ant-design/icons` are imported in 14 files but are **not in `package.json`** — they resolve only as transitive deps of `antd`. Any antd change breaks the build. |
| **Unpinned Python dependencies** | 5 of 6 entries in `requirements.txt` are unpinned, with no lockfile. `pydantic[email]` pulls `email-validator` for an `EmailStr` that is never used. `httpx` is a test-only dependency shipped to production. |
| **Inconsistent ID generation** | UUID v7 via `UuidCreator` in most places, but `UUID.randomUUID()` in `UserManagementService:41`, `AdminProvisioningService:32,53`, `TenantProvisioningService:27`, `DocumentUploadService:166`. |
| **Inconsistent soft delete** | `Client`/`Contract` set `isDeleted`; users are only set `status=INACTIVE`; cases, documents and notes have **no delete path at all**. Deleting a client does not check for referencing contracts or cases ⇒ dangling references. |
| **Inconsistent error surfacing (frontend)** | Four patterns for the same job: `App.useApp().message`, `App.useApp().notification`, inline `<Alert>`, and `<InlineBlocker>`. |
| **Mixed indentation** | 4 spaces in most files, 2 in `AIValueCard.js`, `EntityDocumentVault.js`, `VehicleDetailsCard.js` and all tests. |

### Accessibility (NFR22 — WCAG AA recommended)

- Only 4 files contain any accessibility attribute at all.
- Icon-only buttons with **no `aria-label`**: `leasing/page.js:384-392, 393-398, 407-412, 465-473, 474-479, 488-493`.
- Raw `<img>` instead of `next/image` with a non-descriptive `alt="Logo"`: `tenants/page.js:150`, `(dashboard)/layout.js:219`.
- Invalid nested-interactive markup — a download `<a>` wrapping a `<Button>`: `cases/[id]/page.js:133-146`.
- **Colour is the sole carrier of meaning** for phase tags, reliability badges and alert criticality.
- `#64748B` on `#060D1A` is used for secondary text in dozens of places — **below WCAG AA** for small text.
- The focus-flash at `cases/[id]/page.js:279-285` mutates `outline` via direct DOM manipulation with no `aria-live` announcement.
- No skip link, no landmark roles beyond AntD defaults, no focus-trap management on the many Drawers.

### Internationalisation

There is **no i18n library, no locale files, and no translation layer**. All strings are hardcoded, overwhelmingly French — but inconsistently:

- `layout.js:14` declares **`<html lang="en">`** on an all-French UI.
- **The entire main navigation is English** — `'Dashboard'`, `'Cases'`, `'Settings'` — sitting next to a French item (`'Clients & Contrats'`). The admin nav is French.
- The case registry page title is **`"Command Center"`** with a French subtitle directly beneath it.
- `(admin)/layout.js:251` hardcodes the English job title `"Platform Editor"`.
- **Raw enum values are shown to users untranslated:** `ACTIVE`, `PRE_CONTENTIEUX`, `DORMANCY`, `DEADLINE`, `MISSING_PREREQUISITE`, `user.role`.
- AntD's `ConfigProvider` has **no `locale` prop**, so all built-in strings (pagination, date picker, `Empty`, `Popconfirm`) render in **English**. Three call sites hand-patch just the pagination label.
- Locale is hardcoded in 12 places: `toLocaleDateString('fr-FR')` ×8, `Intl.NumberFormat('fr-TN')` ×2, `toLocaleString('fr-FR')` ×3.
- The brand name is spelled three ways: `LeasRecover`, `LeaseRecover`, `leasrecover`.

### Configuration and infrastructure

- **Only one Spring profile.** No `application-dev.yml` or `application-prod.yml`, no `spring.profiles.active` — yet compose sets `SPRING_PROFILES_ACTIVE=dev`, a profile that does not exist.
- **Undocumented properties** read by code but absent from `application.yml`: `app.security.allow-header-fallback`, `app.alerts.cron`.
- **Compose omits** `JWT_SECRET`, `SPRING_MAIL_*`, `UPLOAD_DIR`, `AI_SERVICE_WEBHOOK_URL`, `BFF_COOKIE_SECRET` ⇒ insecure defaults everywhere.
- **`.env.example` documents three variables nothing reads** (`NEXT_PUBLIC_API_URL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) and **omits five that are required**.
- **Backend `Dockerfile` runs `./mvnw spring-boot:run`** — no `package`, no jar, no multi-stage build, no non-root user, DevTools active in "production", and it deliberately rewrites `https`→`http` for apk/Maven and passes `-Dmaven.wagon.http.ssl.insecure=true` (**MITM-able dependency download**).
- **No healthchecks** and no `depends_on: condition: service_healthy` — the backend can start before Postgres is ready.
- `ai-service/app/core/config.py` defines a `Settings` class that is **never imported**; the service reads **zero environment variables**.
- `spring-boot-configuration-processor` is on the annotation path but there is **no `@ConfigurationProperties` class** — all config is read via scattered `@Value`.
- **No CI pipeline.** `.github/workflows/` does not exist, despite `architecture.md:271` specifying GitHub Actions for build, test and lint.
- `frontend` `lint` script is a bare `eslint` with no target and no `--max-warnings 0`, so warnings never fail anything. There are ~8 `react-hooks/exhaustive-deps` violations and 2 `no-img-element` violations outstanding.
- No `mypy`, `ruff`, `.flake8`, or `pyproject.toml` in the AI service; no `pytest`, no `conftest.py`, no `__init__.py` anywhere (imports rely on PEP 420 namespace packages and the CWD).

---

## 5. Dead and unfinished code

| Item | Location |
|---|---|
| `AdminProvisioningService.provisionAdmin(...)` — never called; superseded by `provisionAdminAndConfig` | `AdminProvisioningService.java:26-45` |
| `AppUserRepository.findByEmail`, `SuperAdminRepository.findByEmail` — unused | `:11`, `:11` |
| `ClientRepository.findByContactEmailAndIsDeletedFalse`, `findAllByIsDeletedFalse` — unused | `ClientRepository.java:11,14` |
| `AIValuationRepository.findByRecoveryCaseId` — unused; the file also has a **duplicate `import java.util.UUID`** | `AIValuationRepository.java:6,10,14` |
| `ContractRepository.findAllByClientIdAndIsDeletedFalse`, `findAllByTenantIdAndStatusAndIsDeletedFalse` — unused | `:12,13` |
| `ContractResponse.fromEntity(Contract)` 1-arg overload — only self-referential | `ContractResponse.java:37-39` |
| `DocumentUploadService.storeDocument(4-arg)` — used only by tests | `:107-110` |
| `DocumentUploadService.setRestTemplate` — a production setter existing solely as a test seam; the field is non-final and mutable | `:68-73` |
| `CasePrerequisiteService` — three **empty stub methods** with `// Hook:` comments | `:51-61` |
| `CaseController` sort alias `reliabilityIndicator` silently falls back to `createdAt` | `CaseController.java:113-115` |
| `global_configuration` table created by migration but has **no entity, repository or usage** | `V1__init_global_schema.sql:31-41` |
| `tenant.data_retention_months` captured but never enforced (FR41 unmet) | `Tenant.java:22-23` |
| `AppUser.lastLogin` exposed in `UserResponse` but **never written** — no login audit trail | `AppUser.java:40-41` |
| `'COMPLETED'` valuation status accepted but never produced by any code | `CasePrerequisiteService.java:43` |
| Debug `System.out.println` left in production code (×2, fires on **every** connection acquisition) | `TenantConnectionProvider.java:31`, `TenantIdentifierResolver.java:14` |
| Hibernate-5 leftover `spring.jpa.properties.hibernate.multiTenancy: SCHEMA` — ignored by Hibernate 6+ | `application.yml:20` |
| POM metadata still says `demo` / "Demo project for Spring Boot"; empty `<license/>`, `<developer/>`, `<scm/>` | `pom.xml:14-28` |
| `ai-service/app/core/config.py` — `Settings` defined, `settings` never imported, `import os` unused | entire file |
| `app/services/pdf_parser.py` and `app/models/schemas.py` — mandated by `architecture.md:179-182`, **do not exist** | — |
| `frontend/src/app/page.module.css` — 141 lines, **zero references** | — |
| `frontend/public/{next,vercel,file,globe,window}.svg` — zero references | — |
| `frontend/README.md` — untouched `create-next-app` boilerplate | — |
| Unused imports across 8 frontend files (`Badge`, `Spin`, `Tooltip`, `FilterOutlined`, `SearchOutlined`, `InfoCircleOutlined`, `ExclamationCircleOutlined`, `CarOutlined`, `DollarOutlined`, `Panel`, `CalendarOutlined`, `Text`, `PaperClipOutlined`, `DeleteOutlined`, `CloseCircleOutlined`) | see `npm run lint` |
| `EntityDocumentVault` imports `DeleteOutlined` but **no delete UI exists** — documents cannot be removed | `EntityDocumentVault.js:5` |
| Dead `return false` after a `finally` block | `cases/[id]/page.js:79-81` |

---

## 6. Test suite audit

### Backend — 29 files, ~185 test methods, ~5 585 lines

**Well covered:** `CaseService` (18 tests including tenant-scope violations, prerequisite blocking, the MISE_EN_DEMEURE email, and rollback) · `CaseController` (24, including the webhook, SSE, PDF export and upload) · `DocumentUploadService` (14, including `.exe` rejection, size limits, orphan cleanup, tenant isolation and the AI trigger) · `AIValuationService` (9, covering all three reliability bands, zero/null residual values, and discrepancy alert creation + resolution) · `AlertEngineService` / `Scheduler` / healing (14) · `TenantFilter` (8) · `TenantConfigController` (11) · user management (14) · client/contract/vehicle services (19) · `JwtService` (3) · `AuthController` (5).

Style: Mockito unit tests for services; `@WebMvcTest` + `@Import(SecurityConfig, JwtAuthenticationFilter, TenantFilter)` for controllers. Boot 4 means the tests use Jackson 3 (`tools.jackson.databind.ObjectMapper`).

**Problems:**

| Issue | Detail |
|---|---|
| 🔴 **`InsertAdminUser.java` is not a test** | It is annotated `@Test` but **opens a JDBC connection to a real local database and INSERTs/UPDATEs an admin user** with a hardcoded bcrypt hash and a personal email. **It runs during `mvn test`.** Delete it. (`src/test/java/com/leasrecover/backend/InsertAdminUser.java:46-47`) |
| 🔴 **`PasswordHashGenerator.java` is not a test** | A `@Test` that prints bcrypt hashes for `admin`, `admin8`, `password`, `ilhem123`. Delete it. |
| 🔴 **No Spring context-load test** | `DemoApplicationTests` is `@Disabled`, so broken bean wiring ships green. |
| 🔴 **Zero integration tests against a real database** | No Testcontainers, no test resources. **Multi-tenancy (schema switching, `TenantConnectionProvider`, per-tenant Flyway), Envers auditing, and every JPQL/derived query are entirely untested.** These are the highest-risk parts of the system. |
| 🟠 **`CaseAuditingIntegrationTest` is misnamed** | It only exercises `UserContextHolder` and entity getters/setters, and even asserts that entities *do not* exist (`testRecoveryCaseAud_NoEntityExists`). |
| 🟠 **The suite depends on the insecure default** | `CaseControllerTest` relies on `allow-header-fallback` being `true`, because `@WithMockUser` yields a `String` principal. **Hardening [C4](#c4--header-fallback-authentication-is-on-by-default) will break the suite** — fix the tests, don't revert the default. |
| 🟠 **No negative test for the unauthenticated webhook**, no test for the SSE authorization gap, no concurrency or optimistic-locking test. |
| 🟡 **`DocumentUploadServiceTest` uses `@MockitoSettings(strictness = LENIENT)`**, masking unused-stub errors. |
| 🟡 **Untested classes** | `PdfExportService`, `CaseSpecification`, `EmailService`, `GlobalExceptionHandler`, `SuperAdminTenantController`, `AdminProvisioningService`, `JpaConfig`, `FileStorageConfig`, `UuidCreator`, and all `SecurityConfig` rules beyond 2 smoke tests. |

### Frontend — 10 files, ~1 884 lines

**Covered:** `middleware.js` (3) · `api/cases/[id]/progress` (3) · `AIUploadZone` (7, including SSE failure, retry and connection error) · `AIValueCard` (6) · `AlertCard` (5, all deep-link branches) · `EntityDocumentVault` (3) · `cases/page.js` (3) · `cases/new/page.js` (2) · `cases/[id]/page.js` (7) · `settings/compliance` (3).

**Gaps:**

- **28 of 29 BFF route handlers are untested** — including all of auth (`login`, `logout`, `session`), all of `super-admin`, all of `admin/tenant*`, `clients`, `contracts`, `documents`, `export`, and both binary-download proxies. Only `progress` has a test. **This is the highest-risk gap**, and it is why [C6](#c6--role-escalation-into-the-admin-ui) and [H-11](#h-11-params-not-awaited--clientcontractvehicle-mutations-are-broken) went unnoticed.
- **`lib/crypto.js` is untested** — no encrypt/decrypt round-trip, no tamper test, no missing-secret test.
- Untested pages: `login`, `(admin)/layout`, `(admin)/tenants`, `(dashboard)/layout`, `leasing` (**1075 lines**), `settings/tenant`.
- Untested components: `InlineBlocker`, `ConditionalPhaseStepper`, `VehicleDetailsCard`, `branding-context`.
- No test asserts the `httpOnly` / `secure` / `sameSite` cookie flags.
- No test for the idle-timeout logout.
- 🟠 **`EntityDocumentVault.test.js:36-50` contains a broken mock.** `requestMethodIsPost()` inspects `global.fetch.mock.calls` from *inside* the fetch mock itself, so the POST branch is unreachable on the first POST. The two rejection tests therefore only assert a negative that would also pass if the component were entirely broken.
- No `coverageThreshold`, no `--coverage` script, no `test:watch`.

### AI service — 3 tests

Covers: 202 on success (with the extraction function mocked out), 400 on a non-PDF, 422 on missing metadata.

**`app/services/llm_extraction.py` — the only module containing logic — has 0% coverage.** `execute_background_extraction` is mocked in the only test that reaches it; `send_webhook` is never exercised. All three stages, every payload shape, and the whole `FAILED` path are untested.

Also untested: `GET /health`, invalid `webhookUrl`, empty file, large file, and the `.pdf`-extension-with-non-PDF-content bypass.

No `pytest` in `requirements.txt`, no `conftest.py`, no `pytest.ini`, no `tests/__init__.py`, no coverage config. Tests run only via `python -m unittest`.

---

## 7. Architecture-doc drift

`_bmad-output/planning-artifacts/architecture.md` was **not followed** in several material places. **Do not treat it as documentation of the running system** — use [`../README.md`](../README.md) for that.

| `architecture.md` specifies | Reality |
|---|---|
| React Server Components + Server Actions for all data, "eliminating `useEffect` fetch waterfalls" (§Frontend Architecture) | **Every page is `'use client'`** with `useEffect` fetch waterfalls. No Server Actions anywhere. |
| Ant Design **v5** | Ant Design **v6.3.5** |
| TypeScript interfaces auto-generated from an OpenAPI 3 spec; "hand-coding identical types across repos is prohibited" (§Structure Patterns) | **Plain JavaScript, no TypeScript, no OpenAPI, no SpringDoc.** No shared types at all. |
| PostgreSQL **18.3** | PostgreSQL **16** (compose carries a comment explaining the substitution) |
| JWT **access/refresh token pattern** (§Authentication) | A single non-revocable 24-hour token. No refresh, no blacklist, no rotation. |
| `modules/document/` as its own backend module | Folded into `modules/cases/` |
| `ai-service/app/services/pdf_parser.py` and `app/models/schemas.py` | Neither exists. Schemas live in `app/schemas/`; there is no PDF parser. |
| AI dependencies: `PyPDF2`/`pdfplumber` + `openai`/`anthropic` SDK (§Key dependencies) | **None installed.** |
| FastAPI global exception handler formatting errors into the JSend envelope (§Process Patterns) | Neither exists in the AI service. |
| GitHub Actions for build validation, tests and linting (§Infrastructure) | **No `.github/` directory.** |
| `error.tsx` boundaries for Server Components (§Process Patterns) | No `error.js` anywhere. |
| "Hardcoding is strictly forbidden" for secrets (§Configuration Files) | Committed SMTP credentials, a committed super-admin hash, a committed cookie-secret fallback, and a placeholder JWT secret in active use. |
| Authorization via "method-level and URL-level expressions" in Spring Security (§Authentication) | **Zero method-level security.** URL-level covers only two patterns. |
| Files `kebab-case`, components `PascalCase` (§Code Naming) | Route files follow Next.js conventions; component files are `PascalCase.js`. |

**Correctly implemented as specified** (worth noting, these are the strong parts):

- Schema-per-tenant isolation via a Hibernate multi-tenant connection provider ✅
- Hibernate Envers for the immutable audit trail ✅
- BFF pattern with `HttpOnly` + `Secure` + `SameSite=Strict` cookies; the token never reaches the browser ✅
- Backend → FastAPI synchronous dispatch, FastAPI → backend webhook, backend → browser SSE ✅
- JSend response envelope on the Spring side ✅
- camelCase JSON across every boundary ✅
- Super Admin barred from tenant case content (NFR12), enforced in `TenantFilter:94-99` ✅
- Virtual threads used for the async AI dispatch ✅

---

## 8. Remediation roadmap

Ordered by risk-reduction per unit of effort. Items within a phase are roughly independent.

### Phase 0 — Today (credentials)

1. **Revoke the Gmail app password** and remove the defaults from `application.yml`. Purge from git history if feasible. — [C1]
2. **Change the seeded super-admin password**; plan its removal from the migration. — [C10]
3. **Generate a real `JWT_SECRET`**, pass it via compose, and make the application **fail fast** when it is missing, placeholder, or under 32 bytes. Delete the zero-padding branch in `JwtService`. — [C2]

### Phase 1 — Week 1 (authentication and authorization)

4. **Authenticate the AI webhook** with an HMAC signature header in both directions; stop selecting the DB schema from the request body; stop publishing port 8080 to the host. — [C3]
5. **Set `app.security.allow-header-fallback: false`** and fix `CaseControllerTest` to construct a real `UserPrincipal`. — [C4]
6. **Fix the frontend route guard** — remove the rewrite aliasing (preferred) or extend the middleware matcher — and add an `exp` check. — [C5, H-15]
7. **Derive `/api/auth/session` from the sealed `session_token`**; make `user_session` `httpOnly`; add role assertions to the `super-admin` and `admin/tenant` BFF routes. — [C6]
8. **Add SSRF protection and authentication to the AI service**; cap the upload size; verify the `%PDF-` magic bytes. — [C8]

### Phase 2 — Week 2 (make it actually run)

9. **`await params`** in the three broken route files (6 call sites) — un-breaks client, contract and vehicle mutations. — [H-11]
10. **Fix `BACKEND_URL`** in compose; add `BFF_COOKIE_SECRET`, `BACKEND_URL`, `AI_SERVICE_URL`, `AI_SERVICE_WEBHOOK_URL`, `UPLOAD_DIR` and `SPRING_MAIL_*` to `.env.example`. — [H-12]
11. **Rewrite all three Dockerfiles**: multi-stage builds, packaged jar / `next start`, non-root users, remove every TLS bypass, add `.dockerignore` files and healthchecks. — [H-13, H-20]
12. **Mount a volume for uploads.** — [H-8]
13. **Configure multipart limits** and add a 413 handler. — [H-5]
14. **Add `migrateAllTenants()`** at startup. — [C9]
15. **Add a CI workflow** (`.github/workflows/ci.yml`) running the three test suites plus lint, with `--max-warnings 0`.

### Phase 3 — Weeks 3–4 (harden)

16. **Enable `@EnableMethodSecurity`**, introduce a `Role` enum, annotate every controller method with `@PreAuthorize`, and delete the ~10 string comparisons. Close the 13 missing checks. — [H-1, H-2]
17. **Authorize the SSE endpoint** and key emitters by `(tenantId, caseId)`. — [H-3]
18. **Move the AI dispatch to `afterCommit`** and make `processSuccessCallback` idempotent. — [H-4]
19. **Extract `frontend/src/lib/bff.js`** — a `withAuth(handler)` wrapper. Removes ~500 duplicated lines and makes several of the above one-line changes.
20. **Stop leaking `ex.getMessage()`**; log stack traces; add handlers for optimistic-lock, data-integrity, type-mismatch and access-denied. — [H-10]
21. **Change `.anyRequest()` to `authenticated()`** and explicitly permit only the health endpoints. — [H-9]
22. **Fix the `createCase` overwrite bug.** — [H-7]
23. **Add `error.js` / `not-found.js`** and wire real error states into the eight silent failures. — [H-16]
24. **Delete `InsertAdminUser.java` and `PasswordHashGenerator.java`**; re-enable `DemoApplicationTests`.

### Phase 4 — Months 2–3 (the actual product)

25. **Build real AI extraction** — `pdfplumber` (+ `pytesseract` for scans) → a structured LLM call with a real prompt and a Pydantic-validated response. Keep the simulator behind `SIMULATE_EXTRACTION=true`. **This is the highest-value remaining work and the one MVP success criterion currently unmeetable.** — [C7]
26. **Move the AI pipeline to a durable queue** with retries and idempotency; add a backend reaper for stuck `PENDING` valuations. — [H-18, H-19]
27. **Implement the three empty prerequisite hooks**; make advancing past `CLOTURE` return 409. — [M-1, M-2]
28. **Add Testcontainers integration tests** covering schema switching, per-tenant Flyway, Envers auditing, and tenant isolation. Add BFF route-handler tests.
29. **Add the missing indexes**; fix the N+1 queries; add a distributed lock (ShedLock) plus a unique constraint for the alert engine; move the SMTP send out of the transaction. — [performance table, M-8]
30. **Replace domain strings with enums**; add the missing validation; enforce `data_retention_months` (FR41/NFR19 are currently unmet).
31. **Introduce an i18n layer** + AntD `locale={frFR}`; fix `<html lang>`; translate the English nav labels and "Command Center"; map enum values to French labels.
32. **Extract design tokens** into an AntD `ConfigProvider` theme; delete `page.module.css` and the 5 unused SVGs; remove the global style injections.
33. **Accessibility pass** — `aria-label` on icon buttons, `next/image`, fix the nested-interactive download links, raise the secondary-text contrast above AA, add a skip link.

---

*Prepared as a read-only static review. No source files, configuration, or dependencies were modified.*
