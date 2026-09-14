"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryClient,
} from "@tanstack/react-query";
import { api, toSearchParams } from "@/lib/api/client";
import { queryKeys, type CaseFilters } from "./keys";
import type { PublicSession } from "@/lib/auth/session";
import type {
  Assignee,
  CaseDetail,
  CaseListItem,
  Client,
  Contract,
  DocumentSummary,
  HistoryEvent,
  Note,
  Paged,
  Prerequisites,
  PriorityAlert,
  Tenant,
  TenantConfig,
  TenantUser,
  Thresholds,
  Valuation,
  Vehicle,
} from "@/types/api";

/**
 * The only place useQuery and useMutation are called.
 *
 * Components use these hooks instead, which is what keeps each mutation's
 * invalidation set colocated with the mutation. ESLint enforces it: the
 * invalidation table in docs/DESIGN_SCREENS.md §12 is only correct if
 * there is exactly one place it can drift from.
 */

// Reference data changes rarely; 5 minutes rather than the 30s default.
const REFERENCE = { staleTime: 5 * 60_000 } as const;

// --------------------------------------------------------------- session

export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => api.get<PublicSession | null>("/api/auth/session"),
    staleTime: 60_000,
    // A 401 here is meaningless: the endpoint answers "who am I" and
    // returns null when nobody. Never retry it.
    retry: false,
  });
}

// ---------------------------------------------------------------- tenant

export const useTenant = () =>
  useQuery({
    queryKey: queryKeys.tenant.detail(),
    queryFn: () => api.get<Tenant>("/api/admin/tenant"),
    ...REFERENCE,
  });

export const useTenantConfig = () =>
  useQuery({
    queryKey: queryKeys.tenant.config(),
    queryFn: () => api.get<TenantConfig>("/api/admin/tenant/config"),
    ...REFERENCE,
  });

export const useThresholds = () =>
  useQuery({
    queryKey: queryKeys.tenant.thresholds(),
    queryFn: () => api.get<Thresholds>("/api/admin/tenant/config/thresholds"),
    ...REFERENCE,
  });

/** Optimistic: the sidebar identity updates as the field changes. */
export function useUpdateBranding() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; logoUrl: string }) =>
      api.put<Tenant>("/api/admin/tenant", body),
    onMutate: async (body) => {
      await client.cancelQueries({ queryKey: queryKeys.tenant.detail() });
      const previous = client.getQueryData<Tenant>(queryKeys.tenant.detail());
      if (previous) {
        client.setQueryData<Tenant>(queryKeys.tenant.detail(), {
          ...previous,
          ...body,
        });
      }
      return { previous };
    },
    // A silent revert is prohibited: the caller surfaces the failure.
    onError: (_error, _body, context) => {
      if (context?.previous) {
        client.setQueryData(queryKeys.tenant.detail(), context.previous);
      }
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: queryKeys.tenant.all });
    },
  });
}

export function useUpdateTenantConfig() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      dormancyThresholdDays: number;
      phaseLegalDelays: Record<string, number>;
    }) => api.put<TenantConfig>("/api/admin/tenant/config", body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.tenant.config() });
    },
  });
}

export function useUpdateThresholds() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      aiDeviationModerate: number;
      aiDeviationCritical: number;
    }) => api.put<Thresholds>("/api/admin/tenant/config/thresholds", body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.tenant.thresholds() });
    },
  });
}

// ----------------------------------------------------------------- cases

export function useCases(filters: CaseFilters) {
  return useQuery({
    queryKey: queryKeys.cases.list(filters),
    queryFn: () => api.get<Paged<CaseListItem>>(`/api/cases${toSearchParams(filters)}`),
    // Keeps the previous page visible while the next loads, so pagination
    // does not flash to skeleton. The UI dims it via isPlaceholderData.
    placeholderData: keepPreviousData,
  });
}

export const useCase = (id: string) =>
  useQuery({
    queryKey: queryKeys.cases.detail(id),
    queryFn: () => api.get<CaseDetail>(`/api/cases/${id}`),
    enabled: Boolean(id),
  });

export const useCaseNotes = (id: string) =>
  useQuery({
    queryKey: queryKeys.cases.notes(id),
    queryFn: () => api.get<Note[]>(`/api/cases/${id}/notes`),
    enabled: Boolean(id),
  });

export const useCaseHistory = (id: string) =>
  useQuery({
    queryKey: queryKeys.cases.history(id),
    queryFn: () => api.get<HistoryEvent[]>(`/api/cases/${id}/history`),
    enabled: Boolean(id),
  });

export const useCasePrerequisites = (id: string) =>
  useQuery({
    queryKey: queryKeys.cases.prerequisites(id),
    queryFn: () => api.get<Prerequisites>(`/api/cases/${id}/prerequisites`),
    enabled: Boolean(id),
  });

export const useCaseDocuments = (id: string) =>
  useQuery({
    queryKey: queryKeys.cases.documents(id),
    queryFn: () => api.get<DocumentSummary[]>(`/api/cases/${id}/documents`),
    enabled: Boolean(id),
  });

export const useCaseValuation = (id: string, enabled = true) =>
  useQuery({
    queryKey: queryKeys.cases.valuation(id),
    queryFn: () => api.get<Valuation>(`/api/cases/${id}/valuation`),
    enabled: Boolean(id) && enabled,
    // 404 simply means no valuation yet. Not an error, not retryable.
    retry: false,
  });

export const useAssignees = () =>
  useQuery({
    queryKey: queryKeys.assignees,
    queryFn: () => api.get<Assignee[]>("/api/cases/assignees"),
    ...REFERENCE,
  });

export const usePriorityAlerts = () =>
  useQuery({
    queryKey: queryKeys.alerts.priority(),
    queryFn: () => api.get<PriorityAlert[]>("/api/dashboard/alerts/priority"),
  });

/**
 * Invalidates a case and every sub-resource, plus the registry row and the
 * alert feed.
 *
 * The alert feed matters more than it looks: the backend auto-heals dormancy
 * alerts on update, assign, note and upload. Without this, a resolved alert
 * stays on screen and the product looks broken.
 */
function invalidateCase(client: QueryClient, id: string) {
  void client.invalidateQueries({ queryKey: queryKeys.cases.detail(id), refetchType: "all" });
  void client.invalidateQueries({ queryKey: queryKeys.cases.documents(id), refetchType: "all" });
  void client.invalidateQueries({ queryKey: queryKeys.cases.all, refetchType: "all" });
  void client.invalidateQueries({ queryKey: queryKeys.alerts.all, refetchType: "all" });
  void client.refetchQueries({ queryKey: queryKeys.cases.documents(id) });
}

export function useCreateCase() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.post<CaseDetail>("/api/cases", body),
    // No optimism: the server assigns the id.
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.cases.all });
      void client.invalidateQueries({ queryKey: queryKeys.alerts.all });
      void client.invalidateQueries({ queryKey: queryKeys.clients.all });
      void client.invalidateQueries({ queryKey: queryKeys.contracts.all });
    },
  });
}

export function useUpdateCase(id: string) {
  const client = useQueryClient();
  return useMutation({
    // No optimism: @Version means the server can reject on a concurrent edit.
    mutationFn: (body: unknown) => api.put<CaseDetail>(`/api/cases/${id}`, body),
    onSuccess: () => invalidateCase(client, id),
  });
}

/** Optimistic: reassignment is something the server will not refuse. */
export function useAssignCase(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (assigneeId: string) =>
      api.put<CaseDetail>(`/api/cases/${id}/assign`, { assigneeId }),
    onMutate: async (assigneeId) => {
      const key = queryKeys.cases.detail(id);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<CaseDetail>(key);
      if (previous) client.setQueryData<CaseDetail>(key, { ...previous, assigneeId });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        client.setQueryData(queryKeys.cases.detail(id), context.previous);
      }
    },
    onSettled: () => invalidateCase(client, id),
  });
}

export function useAddNote(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<Note>(`/api/cases/${id}/notes`, { content }),
    onSuccess: () => invalidateCase(client, id),
  });
}

/**
 * Never optimistic.
 *
 * The server enforces phase prerequisites, so an optimistic advance that
 * rolled back would show the case moving forward and then snapping
 * backwards. That is worse than a 200ms wait and it undermines the "small,
 * clean win" this transition is meant to feel like.
 */
export function useAdvancePhase(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CaseDetail>(`/api/cases/${id}/next-phase`),
    onSuccess: () => invalidateCase(client, id),
  });
}

export function useUploadCaseDocument(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<DocumentSummary>(`/api/cases/${id}/documents`, formData),
    onSuccess: () => invalidateCase(client, id),
  });
}

export function useDeleteCaseDocument(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      api.delete<void>(`/api/cases/${id}/documents/${docId}`),
    onSuccess: () => invalidateCase(client, id),
  });
}

// ----------------------------------------------------- clients & contracts

export const useClients = () =>
  useQuery({
    queryKey: queryKeys.clients.list(),
    queryFn: () => api.get<Client[]>("/api/clients"),
  });

export const useClient = (id: string) =>
  useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => api.get<Client>(`/api/clients/${id}`),
    enabled: Boolean(id),
  });

export const useContracts = () =>
  useQuery({
    queryKey: queryKeys.contracts.list(),
    queryFn: () => api.get<Contract[]>("/api/contracts"),
  });

export const useContract = (id: string) =>
  useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: () => api.get<Contract>(`/api/contracts/${id}`),
    enabled: Boolean(id),
  });

export const useVehicle = (contractId: string) =>
  useQuery({
    queryKey: queryKeys.contracts.vehicle(contractId),
    queryFn: () => api.get<Vehicle>(`/api/contracts/${contractId}/vehicle`),
    enabled: Boolean(contractId),
    // 404 means no vehicle linked yet, which is a normal state.
    retry: false,
  });

/** Clients and contracts both feed case rows, so cases invalidate too. */
function invalidateLeasing(client: QueryClient) {
  void client.invalidateQueries({ queryKey: queryKeys.clients.all });
  void client.invalidateQueries({ queryKey: queryKeys.contracts.all });
  void client.invalidateQueries({ queryKey: queryKeys.cases.all });
}

export function useSaveClient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id?: string } & Record<string, unknown>) =>
      id
        ? api.put<Client>(`/api/clients/${id}`, body)
        : api.post<Client>("/api/clients", body),
    onSuccess: () => invalidateLeasing(client),
  });
}

export function useDeleteClient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/clients/${id}`),
    onSuccess: () => invalidateLeasing(client),
  });
}

export function useSaveContract() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id?: string } & Record<string, unknown>) =>
      id
        ? api.put<Contract>(`/api/contracts/${id}`, body)
        : api.post<Contract>("/api/contracts", body),
    onSuccess: () => invalidateLeasing(client),
  });
}

export function useDeleteContract() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/contracts/${id}`),
    onSuccess: () => invalidateLeasing(client),
  });
}

/** Upsert; the backend updates the linked vehicle when one exists. */
export function useSaveVehicle(contractId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<Vehicle>(`/api/contracts/${contractId}/vehicle`, body),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: queryKeys.contracts.vehicle(contractId),
      });
      invalidateLeasing(client);
    },
  });
}

// ------------------------------------------------------ entity documents

export const useEntityDocuments = (entityType: string, entityId: string) =>
  useQuery({
    queryKey: queryKeys.documents.forEntity(entityType, entityId),
    queryFn: () =>
      api.get<DocumentSummary[]>(
        `/api/documents${toSearchParams({ entityType, entityId })}`,
      ),
    enabled: Boolean(entityType && entityId),
  });

export function useUploadEntityDocument(entityType: string, entityId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<DocumentSummary>("/api/documents", formData),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: queryKeys.documents.forEntity(entityType, entityId),
      });
    },
  });
}

// ---------------------------------------------------- platform (super admin)

export const useTenants = () =>
  useQuery({
    queryKey: queryKeys.tenants,
    queryFn: () => api.get<Tenant[]>("/api/super-admin/tenants"),
  });

export function useProvisionTenant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<Tenant>("/api/super-admin/tenants", body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.tenants });
    },
  });
}

export function useDeactivateTenant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<void>(`/api/super-admin/tenants/${id}/deactivate`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.tenants });
    },
  });
}

export function useActivateTenant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<void>(`/api/super-admin/tenants/${id}/activate`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.tenants });
    },
  });
}

// ---------------------------------------------------------------- users (admin)

export const useUsers = () =>
  useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () => api.get<TenantUser[]>("/api/admin/users"),
  });

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "ADMIN" | "GESTIONNAIRE";
    }) => api.post<TenantUser>("/api/admin/users", body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.users.all });
      void client.invalidateQueries({ queryKey: queryKeys.assignees });
    },
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      firstName: string;
      lastName: string;
      role: "ADMIN" | "GESTIONNAIRE";
      status: "ACTIVE" | "INACTIVE";
    }) => api.put<TenantUser>(`/api/admin/users/${id}`, body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.users.all });
      void client.invalidateQueries({ queryKey: queryKeys.assignees });
    },
  });
}

export function useDeactivateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.put<void>(`/api/admin/users/${id}/deactivate`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.users.all });
      void client.invalidateQueries({ queryKey: queryKeys.assignees });
    },
  });
}


