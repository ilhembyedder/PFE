---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments: [prd.md, architecture.md, ux-design-specification.md, mcd.md, product-brief-pfe-2026-02-26.md]
---

# pfe - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for pfe, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR01: Le Super Admin peut créer, configurer et désactiver des tenants (sociétés de leasing clientes)
FR02: L'Admin peut créer, modifier et désactiver des comptes Gestionnaire dans son tenant
FR03: L'Admin peut définir et modifier les rôles et droits d'accès des utilisateurs de son tenant
FR04: Le Gestionnaire peut s'authentifier et accéder uniquement aux dossiers de son tenant
FR05: Le système peut appliquer l'isolation des données entre tenants sans exception
FR06: Le système peut révoquer une session utilisateur selon un timeout configurable
FR07: L'Admin peut configurer les informations de sa société (nom, logo)
FR08: L'Admin peut définir les délais légaux du processus de recouvrement (par phase) selon le droit applicable
FR09: L'Admin peut configurer le seuil d'écart de valorisation IA déclenchant chaque niveau d'alerte (fiable / modéré / critique)
FR10: L'Admin peut configurer le seuil de dormance d'un dossier (nombre de jours sans action)
FR11: Le système peut valider la cohérence des délais configurés avant activation
FR12: Le Gestionnaire peut créer un dossier de recouvrement avec les données du client et du contrat de leasing (dont la valeur résiduelle initiale)
FR13: Le Gestionnaire peut modifier les informations d'un dossier existant
FR14: Le Gestionnaire peut consulter l'historique complet et horodaté de toutes les actions sur un dossier
FR15: Le Gestionnaire peut réassigner un dossier à un autre Gestionnaire de son tenant
FR16: L'Admin peut réassigner un dossier à un autre Gestionnaire de son tenant
FR17: Le système peut enregistrer automatiquement chaque action sur un dossier dans l'audit trail (acteur, horodatage, données avant/après)
FR18: Le Gestionnaire peut faire progresser un dossier à travers les 5 phases séquentielles : Pré-contentieux → Mise en demeure → Saisie du véhicule → Vente → Clôture
FR19: Le système peut bloquer la transition vers une phase si les prérequis ne sont pas satisfaits
FR20: Le système peut déclencher automatiquement une alerte lorsqu'un délai légal configuré approche de son expiration
FR21: Le système peut déclencher automatiquement une alerte lorsqu'un dossier dépasse le seuil de dormance configuré
FR22: Le Gestionnaire peut ajouter des notes et commentaires à chaque étape d'un dossier
FR23: Le Gestionnaire peut uploader des documents (PDF, images) et les associer à un dossier et à une phase spécifique
FR24: Le Gestionnaire peut consulter tous les documents associés à un dossier
FR25: Le système peut déclencher le pipeline d'estimation IA automatiquement lors de l'upload d'un rapport d'expertise à la phase Saisie
FR26: Le Gestionnaire peut uploader un nouveau document et relancer le traitement IA en cas d'échec
FR27: Le système peut extraire automatiquement les données clés d'un rapport d'expertise uploadé
FR28: Le système peut comparer la valeur de marché extraite avec la valeur résiduelle initiale du contrat de leasing
FR29: Le système peut calculer l'écart entre valeur de marché et valeur résiduelle (en valeur absolue et en pourcentage)
FR30: Le système peut générer un indicateur de fiabilité financière selon les seuils configurés (✅ / ⚠️ / 🚨)
FR31: Le Gestionnaire peut consulter le résultat d'estimation sur la fiche dossier
FR32: Le système peut notifier le Gestionnaire en cas d'échec du traitement IA avec un message d'erreur actionnable
FR33: Le Gestionnaire peut consulter la liste de tous ses dossiers actifs avec filtres par phase, statut et niveau d'alerte
FR34: Le Gestionnaire peut voir les dossiers en alerte critique mis en évidence au premier plan à chaque connexion
FR35: Le Gestionnaire peut accéder directement à l'action requise sur un dossier depuis une alerte dashboard
FR36: Le système peut désactiver automatiquement une alerte lorsque l'action requise a été effectuée
FR37: Le système peut maintenir les alertes actives en l'absence du Gestionnaire (persistance inter-sessions)
FR38: Le Gestionnaire peut exporter l'historique complet d'un dossier sous forme de document structuré (PDF ou équivalent)
FR39: L'Admin peut accéder aux logs applicatifs de son tenant (actions utilisateurs, accès aux données)
FR40: Le système peut conserver les logs de façon immuable selon la durée de rétention configurée
FR41: L'Admin peut configurer la durée de rétention des données et logs de son tenant

### NonFunctional Requirements

NFR01: Le pipeline IA (upload → extraction → résultat) se complète en < 30 secondes dans 90% des cas
NFR02: La liste des dossiers (jusqu'à 1 000 actifs) se charge en < 2 secondes
NFR03: Transitions de phase et actions confirmées à l'utilisateur en < 1 seconde
NFR04: Dashboard avec alertes chargé en < 2 secondes à la connexion
NFR05: Support de 40 à 80 dossiers actifs simultanés par gestionnaire sans dégradation
NFR06: Données chiffrées au repos (AES-256) et en transit (TLS 1.2 minimum)
NFR07: Isolation multi-tenant enforced — zéro tolérance pour toute fuite de données
NFR08: Sessions expirant après timeout configurable par l'Admin
NFR09: Mots de passe hachés (bcrypt ou équivalent), jamais en clair
NFR10: Accès aux données personnelles journalisés — conformité RGPD / Loi organique n°63-2004
NFR11: Logs immuables — aucune modification ou suppression possible après écriture
NFR12: Le Super Admin ne peut pas accéder au contenu des dossiers clients
NFR13: Architecture supportant 300 à 1 000+ dossiers actifs par société sans refonte
NFR14: Ajout d'un nouveau tenant sans intervention technique sur le code
NFR15: Module IA scalable indépendamment du reste de la plateforme
NFR16: Disponibilité cible : 99.5% hors maintenance planifiée
NFR17: Alertes sur délais critiques déclenchées sans exception — aucune perte en cas de charge
NFR18: Échec du pipeline IA → erreur enregistrée, utilisateur notifié, retry possible
NFR19: Rétention des logs garantie selon durée configurée — aucune purge accidentelle
NFR20: Mise à jour du module IA possible indépendamment du reste de la plateforme
NFR21: Configurations de délais, seuils et rôles modifiables sans redéploiement
NFR22: Interface respectant les principes de base d'accessibilité (contraste suffisant, clavier)

### Additional Requirements

- **Starter Templates Required:** Next.js 16 (App Router) + Ant Design v5 for Frontend. Spring Boot 4.x (Java 21) for Backend API. FastAPI (Python) for AI Service. PostgreSQL 18.
- **Multi-tenancy isolation:** Implement Shared Database, Separate Schema pattern via Spring Boot `AbstractRoutingDataSource` and Flyway migrations.
- **Audit Logging:** Implement using Hibernate Envers.
- **Security Auth Pattern:** BFF pattern using Next.js `HttpOnly`, `Secure` cookies with stateless JWT backing in Spring Boot via Spring Security.
- **Async Messaging Pattern:** FastAPI Webhooks triggering Server-Sent Events (SSE) via Spring Boot out to Next.js for live progress tracking of document analysis (3 stages).
- **Data Models:** Use UUID v7 identifiers, JSONB for tenant config fields (like `phase_legal_delays`), and BigInt for monetary computations to avoid accuracy precision loss (`initial_residual_value_cents`). Implement Global Soft Delete with `is_deleted`.
- **API Formats:** Utilize universally structured JSend envelope payloads with strictly `camelCase` keys across all boundaries.

### UX Design Requirements

UX-DR1: Implement custom Ant Design theme with `Inter` text typography and brand tokens (Primary Dark `#1E293B`, Accent `#3B82F6`, Critical `#EF4444`, Warning `#F59E0B`, Success `#10B981`).
UX-DR2: Implement **AIValueCard** component supporting loading states and revealing financial disparities (Market Value | Residual | Diff) via slide-up animations and semantic statuses. This component explicitly appears just before the "Vente" and "Clôture" phases of the recovery process.
UX-DR3: Implement **ConditionalPhaseStepper** extending Steps. Provide fully explicit visual locks over blocked phases with tooltips.
UX-DR4: Implement **AIUploadZone** to visually narrate the 3-stage latency feedback of the AI (Reading -> Extraction -> Calculation).
UX-DR5: Implement **AlertCard** showcasing a distinct colored left-border based on criticality, featuring direct jump-to-action CTAs.
UX-DR6: Implement **InlineBlocker** patterns to substitute non-descript error modals and ensure frictionless user unblocking loops directly on-page.
UX-DR7: Configure UI layout under the "Command Center" schema featuring a static sidebar and top-oriented critical alert banners overriding dashboard feeds.
UX-DR8: Standardize Toast non-blocking notifications (`notification.success`) instead of invasive modals. 

### FR Coverage Map

FR01: Epic 1 - Super Admin Tenant Management
FR02: Epic 1 - Admin User Management
FR03: Epic 1 - Role Definition and Access Rights
FR04: Epic 1 - Gestionnaire Authentication and Isolation
FR05: Epic 1 - Multi-tenant Isolation Enforcement
FR06: Epic 1 - Session Timeout Control
FR07: Epic 2 - Company Branding Configuration
FR08: Epic 2 - Legal Timelines Configuration
FR09: Epic 2 - AI Deviation Threshold Strategy
FR10: Epic 2 - Dormancy Threshold Setup
FR11: Epic 2 - Configured Delays Coherence Validation
FR12: Epic 3 - Case Creation with Initial Residual Value
FR13: Epic 3 - Recovery Case Modification
FR14: Epic 3 - Complete Auditable History Access
FR15: Epic 3 - Case Reassignment by Gestionnaire
FR16: Epic 3 - Case Reassignment by Admin
FR17: Epic 3 - Automatic Immutable Audit Trailing
FR18: Epic 4 - 5-Phase Sequential Progression Matrix
FR19: Epic 4 - Prerequisite Check State Blocker
FR20: Epic 4 - Expiration Alerts Generation
FR21: Epic 4 - Dormancy Threshold Alerts
FR22: Epic 3 - Annotations and Phased Comments
FR23: Epic 4 - Phase-specific Document Uploads
FR24: Epic 4 - Bound Document Previews
FR25: Epic 5 - Automated Seizure Phase AI Trigger
FR26: Epic 5 - Expertise Processing Error Retry
FR27: Epic 5 - PDF Key Data Extraction Processing
FR28: Epic 5 - Market Value vs Initial Value Comparison
FR29: Epic 5 - Abs/Percentage Gap Assessment Calculation
FR30: Epic 5 - Financial Reliability Indicator Generation
FR31: Epic 5 - On-case Extraction Readout
FR32: Epic 5 - AI Graceful Failure Notifications
FR33: Epic 6 - Filterable Case Registry Browsing
FR34: Epic 6 - Top-oriented Red Dashboard Notifications
FR35: Epic 6 - Straight-through Action Dispatching
FR36: Epic 6 - Self-healing Dismissed State Handling
FR37: Epic 6 - Inter-session State Persistence
FR38: Epic 3 - History Event Chain Data Export
FR39: Epic 3 - Tenant Activity Application Log Review
FR40: Epic 3 - Immutable Logging Maintenance
FR41: Epic 3 - Configurable Retention Policies Management
FR42: Epic 7 - Client and Contract Management
FR43: Epic 7 - Vehicle Inventory Management
FR44: Epic 7 - Polymorphic Document Vault

## Epic List

### Epic 1: Tenant & Identity Foundation
Users can securely onboard companies and users into isolated workspaces (auth & access).
* **FRs covered:** FR01, FR02, FR03, FR04, FR05, FR06

### Epic 2: Compliance & Policy Configuration
Admins (Karim) can configure company-specific legal deadlines, AI sensitivity thresholds, and branding.
* **Implementation Note:** Ensure "AI Sensitivity thresholds" (FR09) have sensible, simple defaults. Vital for Tunisian leasing laws.
* **FRs covered:** FR07, FR08, FR09, FR10, FR11

### Epic 7: Core Data Management (Clients, Contracts, Vehicles)
Gestionnaires can manage independent entities related to leasing (Clients, Contracts, Vehicles) and attach specific documents to them directly, decoupling them from just being flat text in a single recovery case.
* **FRs covered:** New requirements for referential integrity (FR42, FR43, FR44)

### Epic 3: Core Recovery Case Management
Gestionnaires (Sonia) can create, assign, update, and export cases securely, while the system maintaining an immutable audit trail.
* **FRs covered:** FR12, FR13, FR14, FR15, FR16, FR17, FR22, FR38, FR39, FR40, FR41

### Epic 4: Document Vault & Legal Workflow
Gestionnaires can navigate the 5-phase strict workflow, upload documents, and receive proactive, critical deadline alerts to avoid legal breaches.
* **Implementation Note:** Crucial to prioritize the system alert logic (FR20/FR21) early in development. The 5-phase workflow is the heart of the app.
* **FRs covered:** FR18, FR19, FR20, FR21, FR23, FR24

### Epic 5: Intelligent Valuation (AI Pipeline)
The system automatically extracts market value from expertise reports, compares it to initial residual values, and provides an instant decision gauge for Sonia before the vehicle sale.
* **FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32

### Epic 6: Command Center Dashboard
Gestionnaires have a consolidated view of their entire portfolio, prioritizing critical actions and dormant cases for maximum daily efficiency.
* **Implementation Note:** This epic must embed the actual backend logic for prioritizing and sorting cases based on urgency/dormancy.
* **FRs covered:** FR33, FR34, FR35, FR36, FR37

## Epic 1: Tenant & Identity Foundation

Super Admins and Admins can securely onboard companies and users into isolated workspaces (auth & access).

### Story 1.1: Project Initialization & Global Database Schema

As a Technical Lead,
I want to initialize the project structure and execute the baseline global database migrations,
So that the core public tables required for system access exist prior to dynamic tenant provisioning.

**Acceptance Criteria:**

**Given** the Spring Boot backend initializes
**When** Flyway starts during the startup sequence
**Then** the foundational database tables (like Super Admin, Global Configuration, and Tenant Directory) are explicitly created in the global `public` schema BEFORE any isolated tenant schemas are triggered or provisioned.

**Given** the broader system environment
**When** initialized
**Then** the baseline Next.js, Spring Boot, and FastAPI applications are scaffolded according to architectural requirements.

### Story 1.2: Multi-tenant Database Infrastructure & Super Admin Provisioning

As a Super Admin,
I want to create and deactivate isolated Tenants (Companies),
So that I can safely onboard new leasing companies while strictly physically separating their data.

**Acceptance Criteria:**

**Given** I am logged into the Super Admin panel
**When** I trigger the creation of a new Tenant with a name and retention parameters
**Then** the system automatically provisions a separate, fully isolated database schema via Flyway and AbstractRoutingDataSource (NFR07)
**And** an initial "Admin" user for that specific Tenant is automatically generated and bound to that schema (FR01).

**Given** a Tenant is deactivated
**When** any user assigned to that Tenant attempts to authenticate or query data
**Then** the request is rejected immediately at the gateway level.

**Given** I am a Super Admin
**When** I attempt to query or view recovery case data inside a Tenant schema
**Then** the access is forcefully rejected by the backend data layer (NFR12).

### Story 1.3: Admin User Management

As an Admin,
I want to create, modify, and deactivate "Gestionnaire" accounts within my Tenant,
So that I can control who handles our specific recovery cases securely.

**Acceptance Criteria:**

**Given** I am logged in as an Admin
**When** I create a new user account with role `GESTIONNAIRE`
**Then** the user's password is cryptographically hashed (NFR09) and the user is strictly bound to my Tenant ID (FR02, FR03).

**Given** a deactivated user account
**When** they attempt to log in or make API calls using an old session
**Then** the system forcibly rejects their request immediately with an "Account Suspended" error.

**Given** I am an Admin editing roles
**When** I change a user's rights
**Then** the changes take effect on their active session immediately based on backend stateless JWT validation (FR06). 

**Given** I am an Admin of Tenant A
**When** I attempt to query, view, or modify an account belonging to Tenant B via the API
**Then** the Backend explicitly rejects the request as unauthorized via `@TenantId` strict filtering (FR05).

### Story 1.4: Secure BFF Authentication & Session Handling

As a Gestionnaire or Admin,
I want to log in to the platform securely,
So that I can protect my tenant's sensitive leasing data and have my session safely managed without token leakage.

**Acceptance Criteria:**

**Given** I submit my email and password on the Next.js login screen
**When** the credentials are correct
**Then** the backend responds with a stateless JWT which the Next.js BFF server encrypts and sets into my browser uniquely as an `HttpOnly`, `Secure` cookie (FR04).

**Given** I am successfully authenticated
**When** I navigate to the dashboard
**Then** I am routed into the "Command Center" unified layout with the persistent dark sidebar (UX-DR7).

**Given** I am active in the dashboard
**When** my session surpasses the Admin-configured inactivity timeout
**Then** my `HttpOnly` token is revoked and I am visually redirected to the login screen with a friendly expiration message (NFR08, FR06).

**Given** I click "Logout"
**When** the action completes
**Then** the server forcefully clears the HTTP cookies and completely invalidates my session state on the BFF.

## Epic 2: Compliance & Policy Configuration

Admins (Karim) can configure company-specific legal deadlines, AI sensitivity thresholds, and branding.

### Story 2.1: Tenant Branding Configuration

As an Admin,
I want to configure my company's specific branding (Name, Logo URL),
So that my Gestionnaires interact within an environment branded for our specific leasing company.

**Acceptance Criteria:**

**Given** I am logged into the platform as an Admin
**When** I navigate to the Tenant Settings view
**Then** I am presented with inputs to update the `name` and `logo_url` of my specific Tenant record (FR07).

**Given** I submit a valid Logo URL
**When** I save the settings
**Then** the UI (Command Center sidebar) immediately updates to reflect the new primary branding.

**Given** I leave the logo or name blank
**When** I attempt to save
**Then** I receive a contextual inline blocker validation error (UX-DR6).

### Story 2.2: Phase Legal Delays & Dormancy Configuration

As an Admin,
I want to define the legal deadlines for each recovery phase and the dormancy threshold,
So that the platform explicitly respects Tunisian leasing compliance and actively alerts my Gestionnaires on critical inaction.

**Acceptance Criteria:**

**Given** I navigate to the Compliance configuration panel
**When** I view the current settings
**Then** I see the time limits for Phase Delays securely editable and stored as structure `JSONB` in the `TENANT_CONFIG` table (FR08).

**Given** I define the number of tolerable inactive days for a dossier
**When** I save the `dormancy_threshold_days`
**Then** any dossier exceeding this inactivity period without a recorded action will technically trigger a dormancy alert flag (FR10).

**Given** I input irrational limits (e.g., negative days or 0)
**When** I attempt to save the configuration
**Then** the UI provides an immediate inline blocker error preventing me from compromising the alert logic (FR11, UX-DR6).

### Story 2.3: AI Deviation Threshold Strategy

As an Admin,
I want to configure the AI sensitivity deviation thresholds with simple defaults,
So that the AI indicator reliably marks a difference between standard depreciation (Moderate) and alarming discrepancies (Critical) without over-complicating my setup.

**Acceptance Criteria:**

**Given** a new Tenant is provisioned
**When** the `TENANT_CONFIG` is initialized
**Then** sensible standard defaults are automatically populated for `ai_deviation_moderate` (e.g., 10%) and `ai_deviation_critical` (e.g., 20%) to avoid blocking onboarding.

**Given** my company operates with stricter financial risk policies
**When** I edit the moderate and critical percentage thresholds (FR09)
**Then** the AI valuation indicator logic (✅ / ⚠️ / 🚨) recalculates case severity thresholds based on these new parameters live for future analysis.

## Epic 7: Core Data Management (Clients, Contracts, Vehicles)

Gestionnaires can manage independent entities related to leasing (Clients, Contracts, Vehicles) and attach specific documents to them directly, decoupling them from just being flat text in a single case.

### Story 7.1: Client and Contract Management

As a Gestionnaire,
I want to create and manage Clients and their associated Contracts in the system,
So that I can select existing contracts when creating a recovery case rather than typing data manually, ensuring referential integrity.

**Acceptance Criteria:**

**Given** I am a Gestionnaire
**When** I navigate to the "Clients & Contrats" repertoire
**Then** I can create a new Client (Name, Registration number, contact info) and associate leasing Contracts (Reference, start/end dates, status) with them.

**Given** I am creating a new Recovery Case
**When** I fill in the case details
**Then** I can select an existing Contract from an autocomplete list, which automatically binds the Client and Vehicle to the case.

### Story 7.2: Vehicle Inventory Management

As a Gestionnaire,
I want to link physical Vehicles to Contracts,
So that I have a distinct record of the asset (VIN, Plate, Brand, Model, Year) that I need to recover.

**Acceptance Criteria:**

**Given** a leasing Contract is active
**When** I view its details
**Then** I can register the physical Vehicle bound to it by specifying its VIN, license plate, and base characteristics.

**Given** a Vehicle is linked to a Contract
**When** the AI valuation is performed on an attached expertise document
**Then** the extracted Brand/Model/Year from the document can be cross-referenced against the actual Vehicle entity data for discrepancy alerts.

### Story 7.3: Polymorphic Document Consultation & Attachment

As a Gestionnaire,
I want to upload and consult administrative documents at the Client, Contract, or Vehicle level independently from any Recovery Case,
So that I have a centralized, accessible digital vault for documents (Kbis, copies of the contract, gray cards) prior to and during any recovery procedure.

**Acceptance Criteria:**

**Given** I am viewing a Client, Contract, or Vehicle detail page
**When** I want to consult existing documents
**Then** I see a dedicated "Documents" tab listing all relevant administrative files (e.g. Identity documents for Client, Gray Card for Vehicle).

**Given** I upload a new document to a Vehicle
**When** the upload completes
**Then** the document is physically vaulted and logically associated with the `vehicle_id` (leaving `case_id` null), making it consultable at any point regardless of the recovery case phase.

## Epic 3: Core Recovery Case Management

Gestionnaires (Sonia) can create, assign, update, and export cases securely, while the system maintaining an immutable audit trail.

### Story 3.1: Recovery Case Initialization

As a Gestionnaire,
I want to create a new Recovery Case (Dossier) by selecting or entering the Client, Contract, and Vehicle details,
So that I can officially begin tracking the recovery lifecycle on the platform with accurate initial financial baselines.

**Acceptance Criteria:**

**Given** I am creating a dossier
**When** I fill out the `Client` data (name, registration) and link it to a new `Contract` (reference, start/end date) and `Vehicle` (VIN, plate, brand)
**Then** the Backend permanently records the financial value as `initial_residual_value_cents` using a robust `BigInt` variable to guarantee zero floating point math errors (FR12).

**Given** a new dossier is created
**When** it successfully saves via the REST API
**Then** its ID is formulated natively as a Time-Sequential `UUID v7` optimizing database scale.

**Given** I am the creator
**When** the case initializes
**Then** I am automatically assigned as the `assignee_id`
**And** its status is forced to `ACTIVE` occupying the `PRE_CONTENTIEUX` phase natively.

### Story 3.2: Case Modification, Annotations, and Assignations

As a Gestionnaire (or Admin),
I want to update a case's details, write notes, or reassign it to a colleague,
So that the dossier always reflects its latest reality and is handled by the appropriate person.

**Acceptance Criteria:**

**Given** I am in my firm's namespace
**When** I transfer (assign) a dossier to another Gestionnaire via the UI
**Then** the `assignee_id` strictly updates to the colleague securely within the same tenant (FR15, FR16).

**Given** I am managing a dossier
**When** I attach a note or commentary
**Then** it is permanently bound to the `NOTE` relation table locking my User ID and the precise Timestamp (FR22).

**Given** I edit core case variables (like client name or contract reference)
**When** I click save
**Then** the standard non-blocking `notification.success` toast validates the change immediately instead of a disruptive generic modal (UX-DR8).

### Story 3.3: Automated Immutable Audit Trail (Hibernate Envers)

As an Admin,
I want the system to automatically record every action on a dossier (creation, field updates, phase changes, assignment) in a secure audit trail,
So that no change can be made without being traced to a specific user and timestamp for strict legal compliance (FR17).

**Acceptance Criteria:**

**Given** a `RECOVERY_CASE` entity is updated via any API route
**When** the transaction commits
**Then** Hibernate Envers automatically writes a new revision to the `RECOVERY_CASE_AUD` table capturing the exact before/after state (payload), user ID, and revision type (`ADD`, `MOD`, `DEL`) without manual developer logging.

**Given** the audit trail must be tamper-proof
**When** a user attempts to manually delete or alter a record in the `_AUD` tables via an application endpoint
**Then** the request is structurally denied by the ORM integration (FR40).

### Story 3.4: Complete Auditable History Access & Export

As a Gestionnaire,
I want to view the chronological history of a dossier and export it as a PDF,
So that I can quickly understand the lifecycle of the case or provide an official structural summary to my management or legal entities (FR14, FR38).

**Acceptance Criteria:**

**Given** I am on the details page of a Recovery Case
**When** I view the "Historique" tab
**Then** I see a vertical Timeline component detailing all phase changes, annotations, and system events chronologically based on Envers data.

**Given** I need a physical or external copy
**When** I click "Exporter PDF"
**Then** the backend generates a structured PDF containing the client data, contract info, vehicle details, current financial snapshot, and the complete timeline log seamlessly.

## Epic 4: Document Vault & Legal Workflow

Gestionnaires can navigate the 5-phase strict workflow, upload documents, and receive proactive, critical deadline alerts to avoid legal breaches.

### Story 4.1: The 5-Phase Sequential Progression & Conditional Stepper

As a Gestionnaire,
I want to visually track and progress a recovery case through its 5 strict sequential phases,
So that I know exactly where a case stands in the legal process.

**Acceptance Criteria:**

**Given** I am viewing an active Recovery Case
**When** I load the page
**Then** I see the `ConditionalPhaseStepper` component (UX-DR3) displaying the 5 phases: Pré-contentieux → Mise en demeure → Saisie du véhicule → Vente → Clôture (FR18).
**And** my current phase is visually highlighted.

**Given** I want to advance to the next phase manually (and all prerequisites are implicitly met)
**When** I trigger the phase transition
**Then** the backend updates the phase status, logs the transition in the audit trail, and the UI immediately reflects the advancement.

### Story 4.2: Phase Prerequisite State Blocker

As a Gestionnaire,
I want the system to clearly block me from advancing a phase if legal or business prerequisites are missing,
So that I do not accidentally violate our compliance workflows.

**Acceptance Criteria:**

**Given** a case is in a phase where prerequisites are missing (e.g., missing critical document upload)
**When** I attempt to advance to the next phase via the `ConditionalPhaseStepper`
**Then** the UI explicitly displays a visual lock on the next step accompanied by a tooltip or an inline blocker detailing exactly what is missing (FR19, UX-DR3).
**And** the backend actively rejects any API requests trying to force the phase change without the prerequisite.

### Story 4.3: Proactive Deadline & Dormancy Alerts Engine

As a Gestionnaire,
I want the system to automatically trigger alerts when legal deadlines approach or a case becomes dormant,
So that I am aware of critical actions required without having to manually check calendar dates.

**Acceptance Criteria:**

**Given** the Admin has configured phase-specific legal timelines and dormancy periods
**When** a case approaches the configured legal expiration or exceeds the dormancy threshold (FR10/FR21)
**Then** a background worker process automatically flags the dossier with an active Alert State (FR20, FR21).
**And** the UI will be able to render this state (to be consumed by the Dashboard commands).

### Story 4.4: Phase-Specific Document Vault

As a Gestionnaire,
I want to upload and consult case documents specifically bound to a recovery phase,
So that my legal paperwork is neatly organized and traceable over the entire case history.

**Acceptance Criteria:**

**Given** I am in a specific phase (e.g., "Mise en demeure")
**When** I upload a relevant document (PDF, images)
**Then** the document is physically vaulted and logically associated with both the `case_id` and the `phase_id` (FR23).

**Given** the case has multiple historical documents
**When** I view the dossier's document tab
**Then** I can see all documents correctly grouped by the phase they were uploaded in (FR24).

## Epic 5: Intelligent Valuation (AI Pipeline)

The system automatically extracts market value from expertise reports, compares it to initial residual values, and provides an instant decision gauge for Sonia before the vehicle sale.

### Story 5.1: Automated Expertise Pipeline Trigger & Extraction API

As the System,
I want to automatically trigger the external FastAPI AI pipeline when an expertise report is uploaded during the "Saisie du véhicule" phase,
So that the system can begin extracting the core data (Market Value, Brand, Model) securely without manual user intervention.

**Acceptance Criteria:**

**Given** the Dossier is actively in the `Saisie du véhicule` phase
**When** a Gestionnaire uploads a file tagged as "Expertise Report"
**Then** the Spring Boot backend securely triggers an asynchronous request to the FastAPI service (FR25).
**And** the FastAPI service extracts the target data metrics (FR27) and returns them to the main API.

### Story 5.2: Asynchronous AI Pipeline & 3-Stage Feedback UI

As a Gestionnaire,
I want to reliably see what the AI is doing while I wait for the expertise report to be analyzed,
So that I don't feel like the platform has frozen during the processing latency.

**Acceptance Criteria:**

**Given** an expertise report has just been uploaded
**When** the FastAPI backend processes the document
**Then** Server-Sent Events (SSE) or WebSockets dispatch state changes back to the Next.js client.
**And** the `AIUploadZone` component visually narrates the progression exactly through the 3 expected states (Lecture -> Extraction -> Calcul) (UX-DR4).

### Story 5.3: Valuation Comparison & Threshold Engine

As the System,
I want to compare the newly extracted market value against the legally embedded initial residual contract value using the Admin's configured thresholds,
So that I can formally deduce the financial deviation risk indicator.

**Acceptance Criteria:**

**Given** the FastAPI service successfully returns the extracted `market_value`
**When** the Spring Boot service receives it
**Then** it natively computes the deviation gap both in absolute `BigInt` value and percentage versus the case's `initial_residual_value_cents` (FR28, FR29).
**And** it generates the final reliability indicator (`✅ Reliable`, `⚠️ Moderate Risk`, `🚨 Critical Risk`) dynamically based strictly on the current Admin thresholds stored in the Tenant Config (FR30).

### Story 5.4: Financial Contextual Gauge (AIValueCard)

As a Gestionnaire,
I want to consult the final AI estimation result clearly displayed on my dossier via a comparative visual card,
So that I can make an immediate, informed decision whether to proceed to the Sales phase or flag an issue.

**Acceptance Criteria:**

**Given** the AI pipeline has completed its run successfully
**When** I view the Dossier detail screen
**Then** the `AIValueCard` is boldly displayed (UX-DR2, FR31).
**And** it visually juxtaposes the [Market Value], [Initial Residual], and [Diff] using semantic coloring derived from the calculated risk indicator.

### Story 5.5: AI Pipeline Graceful Failure & Retry Loop

As a Gestionnaire,
I want to be explicitly notified if the AI extraction fails (e.g., blurry PDF) and have an immediate way to try again,
So that an unreadable scan does not permanently block my workflow.

**Acceptance Criteria:**

**Given** the FastAPI service fails to process a document or detects a highly irregular read
**When** the failure is returned to the frontend
**Then** the upload zone replaces its loading state with a clear, actionable error instruction (e.g., "Le document est illisible") (FR32).
**And** I am provided a specific CTA to immediately upload a clearer scan and cleanly retry the entire sequence (FR26).

## Epic 6: Command Center Dashboard

Gestionnaires have a consolidated view of their entire portfolio, prioritizing critical actions and dormant cases for maximum daily efficiency.

### Story 6.1: Command Center Structure & Case Registry

As a Gestionnaire,
I want to consult the list of all my active dossiers with advanced filtering (phase, status, risk level) inside a unified dashboard layout,
So that I can find, track, and manage any specific case rapidly.

**Acceptance Criteria:**

**Given** I access the main dashboard
**When** the page renders
**Then** I see the "Command Center" layout with a static sidebar (UX-DR7).
**And** the main area displays a paginated Registry table of my active dossiers.
**And** I can filter this registry comprehensively by Phase, Status, or AI Alert Level (FR33).

### Story 6.2: Action-Oriented Critical Alert Feed

As a Gestionnaire,
I want the system to forcefully highlight my most critical or dormant cases entirely at the very top of my dashboard,
So that my daily workflow is effortlessly prioritized by urgency without needing to actively search.

**Acceptance Criteria:**

**Given** there are cases with active deadline or dormancy warnings
**When** the backend fetches my dashboard data
**Then** an intelligent sorting algorithm forcefully evaluates urgency and pulls these specific cases into a dedicated top-oriented banner area (FR34, UX-DR7).
**And** the UI renders these as distinct `AlertCard` components featuring thick colored borders denoting criticality (UX-DR5).

### Story 6.3: One-Click Problem Resolution Dispatch

As a Gestionnaire,
I want to click directly on a dashboard alert to be instantly routed to the exact action or view required on that dossier,
So that I don't waste time navigating nested menus to resolve an urgent compliance issue.

**Acceptance Criteria:**

**Given** I see a critical `AlertCard` on my dashboard (e.g., "Mise en demeure deadline approaching")
**When** I click the primary Call-To-Action on the card
**Then** I am routed deeply into that specific Dossier exactly on the tab or view necessary to resolve the friction (e.g., the exact phase action step) (FR35).

### Story 6.4: Autonomous Alert Healing & State Persistence

As the System,
I want to automatically dismiss alerts only when the required action has specifically been satisfied, and persist them faithfully across the user's sessions otherwise,
So that the alert feed acts as an uncompromised source of truth for pending compliance tasks.

**Acceptance Criteria:**

**Given** an alert exists on a dossier
**When** the user completes the expected action (e.g., transitions the phase or uploads the missing document)
**Then** the backend automatically clears the alert state natively—no manual 'Dismiss' button is required (FR36).

**Given** a user has pending alerts and logs out
**When** the user logs back in three days later
**Then** the alerts remain perfectly active and visible, recalculating their urgency appropriately upon session creation (FR37).
