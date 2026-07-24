# Story 1.4: Secure BFF Authentication & Session Handling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Gestionnaire or Admin,  
I want to log in to the platform securely,  
So that I can protect my tenant's sensitive leasing data and have my session safely managed without token leakage.

## Acceptance Criteria

1. **Given** I submit my email and password on the Next.js login screen  
   **When** the credentials are correct  
   **Then** the backend responds with a stateless JWT which the Next.js BFF server encrypts and sets into my browser uniquely as an `HttpOnly`, `Secure` cookie (FR04).

2. **Given** I am successfully authenticated  
   **When** I navigate to the dashboard  
   **Then** I am routed into the "Command Center" unified layout with the persistent dark sidebar (UX-DR7).

3. **Given** I am active in the dashboard  
   **When** my session surpasses the Admin-configured inactivity timeout  
   **Then** my `HttpOnly` token is revoked and I am visually redirected to the login screen with a friendly expiration message (NFR08, FR06).

4. **Given** I click "Logout"  
   **When** the action completes  
   **Then** the server forcefully clears the HTTP cookies and completely invalidates my session state on the BFF.

## Tasks / Subtasks

- [x] Task 1. Spring Boot JWT Infrastructure & Service Configuration (AC: #1, #3)
  - [x] Add JWT dependencies (`io.jsonwebtoken:jjwt-api:0.12.5`, `io.jsonwebtoken:jjwt-impl:0.12.5`, `io.jsonwebtoken:jjwt-jackson:0.12.5`) to `backend/pom.xml`.
  - [x] Create `JwtService.java` in `com.leasrecover.modules.auth` to generate, parse, and validate stateless JWTs (claims: userId, email, tenantId, role, name) with expiration time configurable in properties.
  - [x] Create `JwtAuthenticationFilter.java` inheriting `OncePerRequestFilter` to intercept Bearer JWT tokens in request headers, validate them, and establish Spring Security context.
  - [x] Update `SecurityConfig.java` to inject `JwtAuthenticationFilter` before `TenantFilter` and require authentication for all `/api/v1/**` endpoints except `/api/v1/auth/login`.
  - [x] Refactor TenantFilter.java to extract the active tenant ID and user email from the authenticated SecurityContext/JWT claims when present. For testing and backward compatibility with existing integration tests, it MUST fallback to extracting them from 'X-Tenant-ID' and 'X-User-Email' headers if no active Spring Security authentication is found in the context.
- [x] Task 2. Spring Boot Authentication REST Controller (AC: #1, #3)
  - [x] Create `AuthRequest.java` and `JwtResponse.java` DTOs in `com.leasrecover.modules.auth.dto` using camelCase.
  - [x] Create `AuthController.java` at `/api/v1/auth/login` to authenticate credentials using `PasswordEncoder` (BCrypt).
  - [x] For Tenant Users: Validate user credentials against `appUserRepository` in the schema matching the provided `tenantId` (resolving dynamic schema via `TenantContextHolder`).
  - [x] For Super Admins: Query `superAdminRepository` directly within the `public` schema.
  - [x] Format responses using `JSendResponse` envelope standard (`{ "status": "success", "data": ... }`).
- [x] Task 3. Next.js BFF (Backend-for-Frontend) Auth Route Handlers (AC: #1, #4)
  - [x] Create BFF login endpoint at `frontend/src/app/api/auth/login/route.js` to forward credentials to Spring Boot, receive the JWT, and write it into the browser as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie named `session_token`.
  - [x] Store basic non-sensitive session data (user role, first/last name, tenantId) in a client-accessible cookie or custom endpoint (`/api/auth/session`).
  - [x] Create BFF logout endpoint at `frontend/src/app/api/auth/logout/route.js` to clear all auth cookies from the browser.
- [x] Task 4. Next.js Route Guarding, Views, and Idle Timeout (AC: #2, #3, #4)
  - [x] Create `frontend/src/middleware.js` to read the BFF cookie and restrict access to `/dashboard/**` and `/admin/**` (redirecting unauthenticated users to `/login`).
  - [x] Design Login screen at `frontend/src/app/(auth)/login/page.js` using Ant Design v5 Form, with fields for Email, Password, and Tenant UUID (optional for Super Admin toggle).
  - [x] Build the "Command Center" dashboard layout at `frontend/src/app/(dashboard)/layout.js` with the persistent dark sidebar (`#060D1A`, 240px wide) featuring clear active states (`border-left: 3px solid #3B82F6`) and keyboard navigation support.
  - [x] Implement a client-side activity listener (mouse, keyboard events) that triggers BFF logout and redirects to `/login?expired=true` showing a friendly toast when inactivity exceeds the timeout.
- [x] Task 5. Comprehensive Unit & Integration Testing (AC: #1-4)
  - [x] Write unit tests for `JwtService` and `AuthController` mock-testing authentication routes.
  - [x] Write WebMvc integration tests for security filter endpoints ensuring authentication is strictly enforced.
  - [x] Write frontend tests verifying BFF API routes set and clear cookies correctly, and middleware guards routes.

## Dev Notes

### Technical Requirements
- **JWT Secret:** Inject the JWT signing secret via environment variable `JWT_SECRET`.
- **BCrypt Hashing:** All passwords compared during login must use Spring Security's configured `PasswordEncoder` bean.
- **REST Envelopes:** Ensure all API responses use the JSend format. Returns `ResponseEntity<JSendResponse<T>>`.
- **Tenant Context Isolation:** Keep `TenantFilter` order relative to security. Security filter executes first, populates SecurityContext; `TenantFilter` runs next, extracts tenant UUID from authentication context and routes schema.
- **Next.js Cookies:** BFF cookies must be set with: `HttpOnly=true`, `Secure=true` (in non-development), `SameSite=Strict`, `Path=/`.

### File Structure Requirements
- Spring Boot security classes: `backend/src/main/java/com/leasrecover/modules/auth/` and `backend/src/main/java/com/leasrecover/config/`.
- Spring Boot auth tests: `backend/src/test/java/com/leasrecover/modules/auth/`.
- Next.js auth routes: `frontend/src/app/api/auth/` and `frontend/src/middleware.js`.
- Next.js UI views: `frontend/src/app/(auth)/login/` and `frontend/src/app/(dashboard)/layout.js`.

### References
- Epics: [epics.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/epics.md#L249-L272)
- Architecture: [architecture.md](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/_bmad-output/planning-artifacts/architecture.md#L250-L255)
- Tenant Database Init: [V1__init_tenant_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/tenant/V1__init_tenant_schema.sql#L18-L35)
- Public Database Init: [V1__init_global_schema.sql](file:///c:/Users/IlhemBENYEDDER/Desktop/pfe/backend/src/main/resources/db/migration/public/V1__init_global_schema.sql#L18-L29)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### Debug Log References

- Fixed 403 errors in controller tests by using `.with(user("admin").roles("ADMIN"))` mock authentication post-processor.
- Fixed 403 errors in filter tests by adding order ordering to servlet filter chain registration.

### Completion Notes List

- Designed and implemented complete JWT Authentication System in Spring Boot backend, utilizing `jjwt` library to issue, verify and validate signed JWTs with tenant context.
- Implemented robust `JwtAuthenticationFilter` and updated `SecurityConfig` to protect all API endpoints under `/api/v1/**` except public `/api/v1/auth/login`.
- Created Next.js BFF authentication endpoint route handlers `/api/auth/login`, `/api/auth/logout`, and `/api/auth/session` setting HttpOnly cookies.
- Developed beautiful, dark mode login page utilizing Ant Design v5 Form and persistent dashboard sidebar routing layout with active borders and keyboard access.
- Implemented client-side activity listener triggers session logout on 15 minutes of idle state.
- Wrote full unit, integration, and Jest test coverages for backend and frontend.
- Secured BFF session cookie by encrypting the backend JWT using Web Crypto AES-GCM encryption with a configurable secret key.
- Made client-side inactivity timeout configurable via the `NEXT_PUBLIC_IDLE_TIMEOUT` environment variable.

### File List

- `backend/pom.xml`
- `backend/src/main/java/com/leasrecover/config/SecurityConfig.java`
- `backend/src/main/java/com/leasrecover/config/tenant/TenantFilter.java`
- `backend/src/main/java/com/leasrecover/modules/auth/JwtService.java`
- `backend/src/main/java/com/leasrecover/modules/auth/UserPrincipal.java`
- `backend/src/main/java/com/leasrecover/modules/auth/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/leasrecover/modules/auth/AuthController.java`
- `backend/src/main/java/com/leasrecover/modules/auth/dto/AuthRequest.java`
- `backend/src/main/java/com/leasrecover/modules/auth/dto/JwtResponse.java`
- `backend/src/test/java/com/leasrecover/modules/auth/JwtServiceTest.java`
- `backend/src/test/java/com/leasrecover/modules/auth/AuthControllerTest.java`
- `backend/src/test/java/com/leasrecover/modules/auth/JwtAuthenticationFilterIntegrationTest.java`
- `backend/src/test/java/com/leasrecover/modules/users/AdminUserManagementControllerTest.java`
- `frontend/src/middleware.js`
- `frontend/src/lib/crypto.js`
- `frontend/src/app/api/auth/login/route.js`
- `frontend/src/app/api/auth/logout/route.js`
- `frontend/src/app/api/auth/session/route.js`
- `frontend/src/app/(auth)/login/page.js`
- `frontend/src/app/(dashboard)/layout.js`
- `frontend/src/__tests__/auth.test.js`
