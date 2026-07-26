"use client";

import Link from "next/link";
import { AlertTriangle, CircleAlert, FileUp, Moon, PenLine, StepForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, chipIcons } from "@/components/ui/chip";
import { useFormat, useLabels } from "@/lib/use-format";
import type { PriorityAlert } from "@/types/api";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * One actionable alert.
 *
 * A full border, never a coloured left stripe: side-stripe accents are
 * prohibited (DESIGN.md §6) and the previous implementation used a 4px one.
 *
 * The action button is labelled with what it does, never "voir", and
 * deep-links to the tab and focus target that resolves the alert.
 */

/** Icon and deep-link target per alert type; the label comes from messages. */
const ACTIONS: Record<
  string,
  { key: string; icon: React.ReactNode; target: (id: string) => string }
> = {
  DORMANCY: {
    key: "addNote",
    icon: <PenLine aria-hidden />,
    target: (id) => `/cases/${id}?tab=notes&focus=note`,
  },
  DEADLINE: {
    key: "advancePhase",
    icon: <StepForward aria-hidden />,
    target: (id) => `/cases/${id}?tab=details&focus=stepper`,
  },
  MISSING_PREREQUISITE: {
    key: "uploadReport",
    icon: <FileUp aria-hidden />,
    target: (id) => `/cases/${id}?tab=documents&focus=upload`,
  },
  VEHICLE_DISCREPANCY: {
    key: "checkVehicle",
    icon: <AlertTriangle aria-hidden />,
    target: (id) => `/cases/${id}?tab=details`,
  },
};

export function AlertRow({ alert }: { alert: PriorityAlert }) {
  const t = useTranslations("cases.actions");
  const format = useFormat();
  const labels = useLabels();

  const critical = alert.criticality === "CRITICAL";
  const action = ACTIONS[alert.alertType] ?? {
    key: "openCase",
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
          <span className="type-title truncate">{alert.clientName}</span>
          <span className="type-identifier text-muted-foreground">
            {alert.contractReference}
          </span>
          <Chip
            tone={critical ? "critical" : "warning"}
            icon={critical ? chipIcons.critical : chipIcons.warning}
          >
            {labels.alertType(alert.alertType)}
          </Chip>
          <span className="sr-only">
            {labels.criticality(alert.criticality)}
          </span>
        </div>
        <p className="type-body mt-1">{alert.message}</p>
        <p className="type-caption text-muted-foreground mt-1">
          <time dateTime={alert.createdAt}>{format.relative(alert.createdAt)}</time>
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        render={<Link href={action.target(alert.caseId)} />}
      >
        {action.icon}
        {t(action.key)}
      </Button>
    </article>
  );
}
