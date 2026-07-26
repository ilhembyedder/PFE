/**
 * Query key factory.
 *
 * Hierarchical on purpose: because every case sub-resource is prefixed with
 * `["cases", id]`, advancing a phase can invalidate the case and all of its
 * children with one call. Keys are never written inline at a call site — the
 * ESLint rule banning direct useQuery enforces that.
 *
 * See docs/DESIGN_SCREENS.md §12.
 */

export interface CaseFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  phase?: string;
  status?: string;
  alertLevel?: string;
}

export const queryKeys = {
  session: ["session"] as const,

  tenant: {
    all: ["tenant"] as const,
    detail: () => [...queryKeys.tenant.all] as const,
    config: () => [...queryKeys.tenant.all, "config"] as const,
    thresholds: () => [...queryKeys.tenant.all, "thresholds"] as const,
  },

  cases: {
    all: ["cases"] as const,
    list: (filters: CaseFilters = {}) => [...queryKeys.cases.all, filters] as const,
    detail: (id: string) => [...queryKeys.cases.all, id] as const,
    notes: (id: string) => [...queryKeys.cases.all, id, "notes"] as const,
    history: (id: string) => [...queryKeys.cases.all, id, "history"] as const,
    prerequisites: (id: string) =>
      [...queryKeys.cases.all, id, "prerequisites"] as const,
    documents: (id: string) => [...queryKeys.cases.all, id, "documents"] as const,
    valuation: (id: string) => [...queryKeys.cases.all, id, "valuation"] as const,
    /** Written by the SSE hook via setQueryData. Never fetched. */
    valuationProgress: (id: string) =>
      [...queryKeys.cases.all, id, "valuation", "progress"] as const,
  },

  assignees: ["assignees"] as const,

  alerts: {
    all: ["alerts"] as const,
    priority: () => [...queryKeys.alerts.all, "priority"] as const,
  },

  clients: {
    all: ["clients"] as const,
    list: () => [...queryKeys.clients.all] as const,
    detail: (id: string) => [...queryKeys.clients.all, id] as const,
  },

  contracts: {
    all: ["contracts"] as const,
    list: () => [...queryKeys.contracts.all] as const,
    detail: (id: string) => [...queryKeys.contracts.all, id] as const,
    vehicle: (id: string) => [...queryKeys.contracts.all, id, "vehicle"] as const,
  },

  documents: {
    all: ["documents"] as const,
    forEntity: (entityType: string, entityId: string) =>
      [...queryKeys.documents.all, entityType, entityId] as const,
  },

  tenants: ["tenants"] as const,
} as const;
