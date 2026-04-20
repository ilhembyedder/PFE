# Story 1.1: Project Initialization & Global Database Schema

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Technical Lead,
I want to initialize the project structure and execute the baseline global database migrations,
So that the core public tables required for system access exist prior to dynamic tenant provisioning.

## Acceptance Criteria

1. **Given** the Spring Boot backend initializes
   **When** Flyway starts during the startup sequence
   **Then** the foundational database tables (like Super Admin, Global Configuration, and Tenant Directory) are explicitly created in the global `public` schema BEFORE any isolated tenant schemas are triggered or provisioned.

2. **Given** the broader system environment
   **When** initialized
   **Then** the baseline Next.js, Spring Boot, and FastAPI applications are scaffolded according to architectural requirements.

## Tasks / Subtasks

- [x] Task 1. Initialize Docker environment and configurations (AC: #2)
  - [x] Set up `docker-compose.yml` for network, postgres, and 3 services.
  - [x] Set up `docker-compose.dev.yml` for local overrides.
  - [x] Create `.env.example` according to Architecture document.
- [x] Task 2. Scaffold Frontend (Next.js) (AC: #2)
  - [x] Run `create-next-app` according to specific command in Architecture.
  - [x] Setup `antd` and basic theme structure.
  - [x] Ensure `frontend` runs correctly mapped to `port 3000`.
- [x] Task 3. Scaffold Backend (Spring Boot 4.x) (AC: #1, #2)
  - [x] Create Spring Boot project in `backend/` with Java 21+ and proper dependencies.
  - [x] Configure `application.yml` for PostgreSQL.
  - [x] Ensure connection to `postgres` service on `port 5432`.
- [x] Task 4. Configure Global Database Migrations (Flyway) (AC: #1)
  - [x] Add Flyway dependency to backend.
  - [x] Add initial migration `V1__init_global_schema.sql` (Super Admin, Global Config, Tenant Directory tables).
  - [x] Verify Flyway applies migration script on startup.
- [x] Task 5. Scaffold AI Service (FastAPI) (AC: #2)
  - [x] Manually create `ai-service/` structure as defined in Architecture.
  - [x] Set up `requirements.txt` and `main.py` entrypoint.
  - [x] Ensure `ai-service` runs mapped to `port 8000`.

## Dev Notes

- **Architecture Constraints:**
  - Three distinct services required: Next.js (port 3000), Spring Boot (port 8080), FastAPI (port 8000).
  - Database: PostgreSQL (port 5432).
  - Flyway schema configuration must use `public` exclusively initially for Tenant Directory!
  - `snake_case` in DB schemas.

- **Frontend Specifics:**
  - Use `npx -y create-next-app@latest ./frontend --js --app --eslint --no-tailwind --src-dir --use-npm --import-alias "@/*"`

- **Backend Specifics:**
  - Use Spring Boot 4.x (Java 21). Spring Data JPA + Flyway.
  - Ensure project group `com.leasrecover`.

- **FastAPI Specifics:**
  - Standard manual structure `ai-service/app/main.py`.

### Project Structure Notes

- Alignment strictly with the `pfe/` root structure.
- Adhere completely to the Architecture structure map.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter-Template-Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]

## Dev Agent Record

### Agent Model Used
Gemini 3.1 Pro (High)

### Debug Log References
- Fixed typo in PostgreSQL environment variable in docker-compose.yml.
- Updated Next.js layout to include AntdRegistry and Inter font.

### Completion Notes List
- Successfully configured docker-compose.yml, docker-compose.dev.yml, and .env.example.
- Scaffolding Next.js (frontend), Spring Boot (backend), and FastAPI (ai-service) environments completed with appropriate configuration files and Dockerfiles.
- Added Flyway migration to V1__init_global_schema.sql as specified.

### File List
- docker-compose.yml
- docker-compose.dev.yml
- .env.example
- frontend/Dockerfile
- frontend/package.json
- frontend/src/app/layout.js
- backend/Dockerfile
- backend/src/main/resources/application.yml
- backend/src/main/resources/db/migration/V1__init_global_schema.sql
- ai-service/Dockerfile
- ai-service/requirements.txt
- ai-service/app/main.py
