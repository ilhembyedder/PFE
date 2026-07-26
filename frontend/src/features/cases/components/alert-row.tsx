"use client";

import Link from "next/link";
import { AlertTriangle, CircleAlert, FileUp, Moon, PenLine, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, chipIcons } from "@/components/ui/chip";
import { ALERT_LABELS, CRITICALITY_LABELS, formatRelative } from "@/lib/format";
import type { PriorityAlert } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * One actionable alert.
 *
 * A full border, never a coloured left stripe: side-stripe accents are
 * prohibited (DESIGN.md §6) and the previous implementation used a 4px one.
 *
 * The action button is labelled with what it does, never "voir", and
 * deep-links to the tab and focus target that resolves the alert.
 */

const ACTIONS: Record<
  string,
  { label: string; icon: React.ReactNode; target: (id: string) => string }
> = {
  DORMANCY: {
    label: "Ajouter une note",
    icon: <PenLine aria-hidden />,
    target: (id) => `/cases/${id}?tab=notes&focus=note`,
  },
  DEADLINE: {
    label: "Faire avancer la phase",
    icon: <StepForward aria-hidden />,
    target: (id) => `/cases/${id}?tab=details&focus=stepper`,
  },
  MISSING_PREREQUISITE: {
    label: "Téléverser un rapport",
    icon: <FileUp aria-hidden />,
    target: (id) => `/cases/${id}?tab=documents&focus=upload`,
  },
  VEHICLE_DISCREPANCY: {
    label: "Vérifier le véhicule",
    icon: <AlertTriangle aria-hidden />,
    target: (id) => `/cases/${id}?tab=details`,
  },
};

export function AlertRow({ alert }: { alert: PriorityAlert }) {
  const critical = alert.criticality === "CRITICAL";
  const action = ACTIONS[alert.alertType] ?? {
    label: "Ouvrir le dossier",
    icon: <StepForward aria-hidden />,
    target: (id: string) => `/cases/${id}`,
  };

  return (
    <article
      // Critical alerts are announced immediately; moderate ones politely.
      role={critical ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-start gap-x-4 gap-y-3 rounded-md border p-4",
        critical
          ? "bg-destructive-surface border-destructive-border"
          : "bg-warning-surface border-warning-border",
      )}
    >
      {critical ? (
        <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <Moon className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-title truncate">{alert.clientName}</span>
          <span className="text-identifier text-muted-foreground">
            {alert.contractReference}
          </span>
          <Chip
            tone={critical ? "critical" : "warning"}
            icon={critical ? chipIcons.critical : chipIcons.warning}
          >
            {ALERT_LABELS[alert.alertType] ?? alert.alertType}
          </Chip>
          <span className="sr-only">
            {CRITICALITY_LABELS[alert.criticality] ?? alert.criticality}
          </span>
        </div>
        <p className="text-body mt-1">{alert.message}</p>
        <p className="text-caption text-muted-foreground mt-1">
          <time dateTime={alert.createdAt}>{formatRelative(alert.createdAt)}</time>
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        render={<Link href={action.target(alert.caseId)} />}
      >
        {action.icon}
        {action.label}
      </Button>
    </article>
  );
}
