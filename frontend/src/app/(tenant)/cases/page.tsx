"use client";

import { Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, chipIcons } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/states/page-header";
import { DataTable } from "@/components/states/data-table";
import { Pagination } from "@/components/states/pagination";
import { NoDataState, NoResultsState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { AlertRow } from "@/features/cases/components/alert-row";
import { useCases, usePriorityAlerts } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { api } from "@/lib/api/client";
import {
  PHASE_LABELS,
  RELIABILITY_LABELS,
  daysSince,
  formatDateTime,
  formatRelative,
  phaseLabel,
  reliabilityTone,
} from "@/lib/format";
import { PHASES, type CaseListItem, type Phase } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * Command Center.
 *
 * Stacked in strict priority order, which is how "Urgency first" is enforced
 * structurally rather than chromatically: the alert region is the first
 * content on the page, not a banner above a table, and it collapses
 * completely when empty. Its absence is the signal.
 */

const PAGE_SIZE = 20;
const DORMANCY_HINT_DAYS = 30;

const STATUS_OPTIONS = [
  ["ACTIVE", "Actif"],
  ["SUSPENDED", "Suspendu"],
  ["TERMINATED", "Résilié"],
] as const;

const ALERT_OPTIONS = [
  ["RELIABLE", "Fiable"],
  ["MODERATE_RISK", "Écart modéré"],
  ["CRITICAL_RISK", "Écart critique"],
] as const;

const SORT_FIELDS: Record<string, string> = {
  clientName: "clientName",
  currentPhase: "currentPhase",
  lastActionAt: "lastActionAt",
};

function AlertRegion() {
  const alerts = usePriorityAlerts();

  // Renders nothing while loading: the region must never flash a placeholder
  // that then disappears.
  if (alerts.isPending) return null;

  if (alerts.isError) {
    return (
      <div className="mb-8">
        <ErrorState
          error={alerts.error}
          onRetry={() => void alerts.refetch()}
          className="bg-panel border-border"
        />
      </div>
    );
  }

  // Collapses entirely when there is nothing to action.
  if (!alerts.data?.length) return null;

  return (
    <section aria-label="Alertes prioritaires" className="mb-8 space-y-2">
      {alerts.data.map((alert) => (
        <AlertRow key={alert.alertId} alert={alert} />
      ))}
    </section>
  );
}

function Registry() {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();

  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);
  const search = params.get("q") ?? "";
  const phase = params.get("phase") ?? "";
  const status = params.get("status") ?? "";
  const alertLevel = params.get("alertLevel") ?? "";
  const sortBy = params.get("sortBy") ?? "";

  const filtersActive = Boolean(search || phase || status || alertLevel);

  const setParams = useCallback(
    (next: Record<string, string | number | null>) => {
      const merged = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value === null || value === "") merged.delete(key);
        else merged.set(key, String(value));
      }
      router.replace(`/cases?${merged.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const query = useCases({
    page,
    size: PAGE_SIZE,
    ...(sortBy ? { sortBy } : {}),
    ...(phase ? { phase } : {}),
    ...(status ? { status } : {}),
    ...(alertLevel ? { alertLevel } : {}),
  });

  const sorting: SortingState = useMemo(() => {
    if (!sortBy) return [];
    const [field, direction] = sortBy.split(",");
    return field ? [{ id: field, desc: direction === "desc" }] : [];
  }, [sortBy]);

  const onSortingChange = (next: SortingState) => {
    const first = next[0];
    // Sorting resets to page 1: the previous build kept the page index and
    // could leave the user on an out-of-range page.
    setParams({
      sortBy: first ? `${SORT_FIELDS[first.id] ?? first.id},${first.desc ? "desc" : "asc"}` : null,
      page: null,
    });
  };

  const columns = useMemo<ColumnDef<CaseListItem, unknown>[]>(
    () => [
      {
        accessorKey: "clientName",
        header: "Client",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-foreground font-medium">{row.original.clientName}</span>
        ),
      },
      {
        accessorKey: "contractReference",
        header: "Référence",
        cell: ({ row }) => (
          <span className="text-identifier text-muted-foreground">
            {row.original.contractReference}
          </span>
        ),
      },
      {
        accessorKey: "currentPhase",
        header: "Phase",
        enableSorting: true,
        cell: ({ row }) => <Chip>{phaseLabel(row.original.currentPhase)}</Chip>,
      },
      {
        accessorKey: "assigneeName",
        header: "Responsable",
        cell: ({ row }) =>
          row.original.assigneeName ?? (
            <span className="text-muted-foreground">Non assigné</span>
          ),
      },
      {
        accessorKey: "reliabilityIndicator",
        header: "Fiabilité",
        cell: ({ row }) => {
          const value = row.original.reliabilityIndicator;
          if (!value) {
            return <span className="text-muted-foreground text-body-sm">Non estimé</span>;
          }
          const tone = reliabilityTone(value);
          return (
            <Chip
              tone={tone === "neutral" ? "neutral" : tone}
              icon={
                tone === "success"
                  ? chipIcons.success
                  : tone === "warning"
                    ? chipIcons.warning
                    : tone === "critical"
                      ? chipIcons.critical
                      : undefined
              }
            >
              {RELIABILITY_LABELS[value]}
            </Chip>
          );
        },
      },
      {
        accessorKey: "lastActionAt",
        header: "Dernière action",
        enableSorting: true,
        cell: ({ row }) => {
          const iso = row.original.lastActionAt ?? row.original.createdAt;
          const days = daysSince(iso);
          const dormant = days !== null && days >= DORMANCY_HINT_DAYS;
          return (
            <span
              className={cn(
                "text-body-sm inline-flex items-center gap-1.5",
                dormant ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {dormant ? chipIcons.dormant : null}
              <time dateTime={iso} title={formatDateTime(iso)}>
                {formatRelative(iso)}
              </time>
            </span>
          );
        },
      },
    ],
    [],
  );

  // Client-side name filter over the current page. The backend exposes no
  // free-text search, so this is scoped and labelled as such rather than
  // pretending to search the whole registry.
  const rows = useMemo(() => {
    const content = query.data?.content ?? [];
    if (!search) return content;
    const needle = search.toLowerCase();
    return content.filter(
      (row) =>
        row.clientName.toLowerCase().includes(needle) ||
        row.contractReference.toLowerCase().includes(needle),
    );
  }, [query.data, search]);

  const total = query.data?.totalElements ?? 0;

  if (query.isError) {
    return (
      <ErrorState variant="page" error={query.error} onRetry={() => void query.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title="Dossiers"
        subtitle={
          query.isPending ? (
            <Skeleton className="h-3.5 w-48" />
          ) : (
            `${total} dossier${total === 1 ? "" : "s"} au total`
          )
        }
        actions={
          <Button render={<Link href="/cases/new" />}>
            <Plus aria-hidden />
            Nouveau dossier
          </Button>
        }
      />

      <AlertRegion />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(event) => setParams({ q: event.target.value, page: null })}
          placeholder="Filtrer cette page par client ou référence"
          aria-label="Filtrer par client ou référence"
          className="w-full sm:max-w-xs"
        />

        <Select
          value={phase || "all"}
          onValueChange={(value) => setParams({ phase: value === "all" ? null : value, page: null })}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par phase">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les phases</SelectItem>
            {PHASES.map((value) => (
              <SelectItem key={value} value={value}>
                {PHASE_LABELS[value as Phase]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status || "all"}
          onValueChange={(value) => setParams({ status: value === "all" ? null : value, page: null })}
        >
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUS_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={alertLevel || "all"}
          onValueChange={(value) =>
            setParams({ alertLevel: value === "all" ? null : value, page: null })
          }
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par fiabilité">
            <SelectValue placeholder="Fiabilité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes fiabilités</SelectItem>
            {ALERT_OPTIONS.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({ q: null, phase: null, status: null, alertLevel: null, page: null })
            }
          >
            <X aria-hidden />
            Réinitialiser
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isPending={query.isPending}
        isPlaceholder={query.isPlaceholderData}
        sorting={sorting}
        onSortingChange={onSortingChange}
        rowHref={(row) => `/cases/${row.id}`}
        rowLabel={(row) => `Ouvrir le dossier de ${row.clientName}`}
        onRowPrefetch={(row) => {
          // Prefetch on intent: opening a case then feels instantaneous.
          void client.prefetchQuery({
            queryKey: queryKeys.cases.detail(row.id),
            queryFn: () => api.get(`/api/cases/${row.id}`),
          });
        }}
        empty={
          filtersActive ? (
            <NoResultsState
              onReset={() =>
                setParams({ q: null, phase: null, status: null, alertLevel: null, page: null })
              }
            />
          ) : (
            <NoDataState
              title="Aucun dossier pour le moment"
              body="Créez un dossier de recouvrement pour lancer le suivi d'un contrat en défaut."
              action={
                <Button render={<Link href="/cases/new" />}>
                  <Plus aria-hidden />
                  Nouveau dossier
                </Button>
              }
            />
          )
        }
      />

      <Pagination
        page={page}
        size={PAGE_SIZE}
        totalElements={total}
        totalPages={query.data?.totalPages ?? 0}
        onPageChange={(next) => setParams({ page: next === 0 ? null : next })}
      />
    </>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <Registry />
    </Suspense>
  );
}
