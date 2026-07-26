/**
 * Backend DTO shapes.
 *
 * Hand-written, mirroring the Java DTOs. architecture.md specified
 * OpenAPI-generated types, but SpringDoc was never installed and no spec
 * exists; if one is added later these become generated. Until then they are
 * the single place the wire format is described.
 *
 * Conventions the backend guarantees:
 *  - camelCase JSON on every boundary
 *  - ISO 8601 UTC timestamps
 *  - money in CENTS, as an integer. Divide only at the render layer.
 *  - a JSend envelope on every JSON response
 */

// ---------------------------------------------------------------- envelope

export interface JSendSuccess<T> {
  status: "success";
  data: T;
}

export interface JSendFailure {
  status: "fail" | "error";
  message: string;
}

export type JSend<T> = JSendSuccess<T> | JSendFailure;

// ------------------------------------------------------------------ enums

/** Strictly sequential; there is no way back. */
export const PHASES = [
  "PRE_CONTENTIEUX",
  "MISE_EN_DEMEURE",
  "SAISIE",
  "VENTE",
  "CLOTURE",
] as const;
export type Phase = (typeof PHASES)[number];

/**
 * NOT_COMPUTABLE is a frontend-only value. The backend returns RELIABLE for
 * a case whose residual value is zero, because the percentage is never
 * computed and the uncomputed 0.0 falls through the band comparison
 * (CODE_REVIEW.md H-21). The UI derives this state itself rather than
 * trusting the indicator; see docs/DESIGN_SCREENS.md §5.
 */
export const RELIABILITY = [
  "RELIABLE",
  "MODERATE_RISK",
  "CRITICAL_RISK",
] as const;
export type Reliability = (typeof RELIABILITY)[number];
export type ReliabilityDisplay = Reliability | "NOT_COMPUTABLE" | "NOT_VALUED";

export type AlertType =
  | "DORMANCY"
  | "DEADLINE"
  | "MISSING_PREREQUISITE"
  | "VEHICLE_DISCREPANCY";

export type Criticality = "CRITICAL" | "WARNING";

export type CaseStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED";

export type ValuationStatus = "PENDING" | "SUCCESS" | "FAILED";

/** Progress stages emitted by the extraction pipeline over SSE. */
export type PipelineStage = "READING" | "EXTRACTION" | "CALCULATION";

// ------------------------------------------------------------------ cases

export interface CaseListItem {
  id: string;
  clientName: string;
  contractReference: string;
  currentPhase: Phase;
  assigneeName: string | null;
  reliabilityIndicator: Reliability | null;
  lastActionAt: string | null;
  createdAt: string;
}

export interface Paged<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CaseClient {
  id: string;
  fullNameOrCompany: string;
  registrationNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

export interface CaseContract {
  id: string;
  referenceNumber: string;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
}

export interface CaseVehicle {
  id: string;
  vin: string;
  licensePlate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
}

export interface CaseDetail {
  id: string;
  tenantId: string;
  createdAt: string;
  status: CaseStatus;
  currentPhase: Phase;
  phaseStartedAt: string | null;
  lastActionAt: string | null;
  initialResidualValueCents: number | null;
  currencyCode: string | null;
  assigneeId: string | null;
  assigneeEmail: string | null;
  client: CaseClient | null;
  contract: CaseContract | null;
  vehicle: CaseVehicle | null;
}

export interface Valuation {
  caseId: string;
  marketValueCents: number | null;
  initialResidualValueCents: number | null;
  deviationValueCents: number | null;
  /** Serialised from BigDecimal; may arrive as a string. */
  deviationPercentage: number | string | null;
  reliabilityIndicator: Reliability | null;
  currencyCode: string | null;
}

export interface Prerequisites {
  nextPhase: Phase | null;
  isBlocked: boolean;
  missingPrerequisites: string[];
}

export interface Note {
  id: string;
  caseId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface HistoryEvent {
  eventType: string;
  timestamp: string;
  actor: string | null;
  description: string;
}

export interface DocumentSummary {
  id: string;
  fileName: string;
  fileUrl: string;
  phaseUploadedIn: string | null;
  uploaderName: string | null;
  createdAt: string;
}

export interface Assignee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PriorityAlert {
  alertId: string;
  caseId: string;
  clientName: string;
  contractReference: string;
  alertType: AlertType;
  criticality: Criticality;
  message: string;
  createdAt: string;
}

// ----------------------------------------------------- clients & contracts

export interface Client {
  id: string;
  tenantId: string;
  fullNameOrCompany: string;
  registrationNumber: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Contract {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientRegistrationNumber: string | null;
  clientContactEmail: string | null;
  clientContactPhone: string | null;
  clientAddress: string | null;
  referenceNumber: string;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  vehicleId: string | null;
  vehicleVin: string | null;
  vehicleLicensePlate: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  contractId: string;
  vin: string;
  licensePlate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  createdAt: string;
  updatedAt: string | null;
}

// ---------------------------------------------------------------- tenancy

export interface Tenant {
  id: string;
  name: string;
  logoUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
  dataRetentionMonths?: number | null;
  createdAt?: string;
}

export interface TenantConfig {
  tenantId: string;
  dormancyThresholdDays: number | null;
  /** Keyed by Phase, though the backend does not validate the keys. */
  phaseLegalDelays: Partial<Record<Phase, number>> | null;
}

export interface Thresholds {
  tenantId: string;
  aiDeviationModerate: number | string | null;
  aiDeviationCritical: number | string | null;
}

// ------------------------------------------------------------------- SSE

export interface ValuationProgress {
  caseId: string;
  tenantId: string;
  status: ValuationStatus;
  stage: PipelineStage;
  progress: number;
  message: string;
  data?: {
    brand?: string;
    model?: string;
    year?: number;
    mileage?: number;
    condition?: string;
    marketValueCents?: number;
    currencyCode?: string;
  } | null;
}
