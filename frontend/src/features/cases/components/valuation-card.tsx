"use client";

import Link from "next/link";
import { AlertTriangle, FileText, Info } from "lucide-react";
import { Chip, chipIcons } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RELIABILITY_LABELS,
  formatMoney,
  formatPercent,
  resolveReliability,
  reliabilityTone,
} from "@/lib/format";
import type { Valuation } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * The AI valuation result. The signature component and the only place in the
 * product that earns a moment.
 *
 * The DEVIATION is the hero; market and residual sit beneath it as the inputs
 * that produced it. Three equal numbers would be three facts — this hierarchy
 * is an answer.
 *
 * Deliberately not the hero-metric template: no sparkline, no supporting stat
 * row, no gradient, no glass.
 */

const TONE_TEXT = {
  success: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
  neutral: "text-foreground",
} as const;

const toNumber = (v: number | string | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
};

export interface ExtractedData {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  mileage?: number | null;
  condition?: string | null;
}

export function ValuationCardSkeleton() {
  return (
    <section className="bg-card border-border rounded-md border p-5">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-2 h-3.5 w-64" />
      <div className="border-border mt-5 grid grid-cols-2 gap-4 border-t pt-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
    </section>
  );
}

export function ValuationCard({
  valuation,
  extracted,
  caseId,
  documentId,
  className,
}: {
  valuation: Valuation;
  extracted?: ExtractedData | null;
  caseId: string;
  documentId?: string | null;
  className?: string;
}) {
  const state = resolveReliability(valuation);
  const tone = reliabilityTone(state);
  const currency = valuation.currencyCode;

  const deviationCents = valuation.deviationValueCents;
  const percent = toNumber(valuation.deviationPercentage);

  /* Above 100% a percentage stops communicating: "−412,7 %" cannot be
     pictured. The absolute figure becomes the hero and the ratio carries the
     magnitude. A deviation this large is also far more often a data-entry
     error than a real valuation. */
  const extreme = percent !== null && percent > 100;
  const clamped = percent !== null && percent >= 999.99;

  const ratio =
    valuation.marketValueCents && valuation.initialResidualValueCents
      ? valuation.initialResidualValueCents / valuation.marketValueCents
      : null;

  const provenance = extracted
    ? [
        extracted.brand,
        extracted.model,
        extracted.year,
        extracted.mileage ? `${new Intl.NumberFormat("fr-FR").format(extracted.mileage)} km` : null,
        extracted.condition,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <section
      role="region"
      aria-label={`Résultat de l'analyse${provenance ? ` pour ${provenance}` : ""}`}
      className={cn(
        "bg-card border-border animate-in fade-in slide-in-from-bottom-1 rounded-md border p-5",
        className,
      )}
      style={{
        animationDuration: "var(--duration-reveal)",
        animationTimingFunction: "var(--ease-out-quart)",
      }}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-title">Estimation de valeur</h2>
        <div className="flex items-center gap-2">
          {state === "NOT_COMPUTABLE" ? (
            <Chip>{RELIABILITY_LABELS.NOT_COMPUTABLE}</Chip>
          ) : (
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
              {RELIABILITY_LABELS[state]}
            </Chip>
          )}
          {documentId ? (
            <Link
              href={`/api/cases/${caseId}/documents/${documentId}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-primary focus-visible:focus-ring inline-flex items-center gap-1 rounded-sm underline underline-offset-4 outline-none [&_svg]:size-3.5"
            >
              <FileText aria-hidden />
              Voir le rapport source
            </Link>
          ) : null}
        </div>
      </header>

      {state === "NOT_COMPUTABLE" ? (
        /* No comparison happened. The backend nonetheless returns RELIABLE
           here, because the uncomputed 0.0 falls through its band check
           (CODE_REVIEW.md H-21). A green badge on a comparison that never
           ran is the most damaging thing this screen could show, so the
           market value stands alone and no band is rendered. */
        <>
          <p className="text-figure-hero text-foreground">
            {formatMoney(valuation.marketValueCents, currency)}
          </p>
          <p className="text-body-sm text-muted-foreground mt-1.5">
            Valeur de marché estimée
          </p>
          <div className="bg-warning-surface border-warning-border mt-4 flex gap-2.5 rounded-md border p-3">
            <Info className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="text-body-sm">
                La valeur résiduelle du contrat est nulle. L&apos;écart ne peut pas être
                calculé.
              </p>
              <Link
                href={`/cases/${caseId}?edit=1`}
                className="text-body-sm text-primary mt-1.5 inline-block font-medium underline underline-offset-4"
              >
                Corriger le dossier
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className={cn("text-figure-hero", TONE_TEXT[tone])}>
            {extreme
              ? formatMoney(deviationCents, currency)
              : clamped
                ? "> 999 %"
                : formatPercent(percent, deviationCents)}
          </p>

          <p className="text-body-sm text-muted-foreground mt-1.5">
            {extreme && ratio
              ? `la valeur de marché est ${new Intl.NumberFormat("fr-FR", {
                  maximumFractionDigits: 1,
                }).format(ratio)} fois inférieure à la valeur résiduelle`
              : deviationCents === null
                ? "écart indisponible"
                : `soit ${formatMoney(deviationCents, currency)} ${
                    deviationCents < 0 ? "sous" : "au-dessus de"
                  } la valeur résiduelle`}
          </p>

          {extreme ? (
            <div className="bg-warning-surface border-warning-border mt-4 flex gap-2.5 rounded-md border p-3">
              <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="text-body-sm">
                  Écart inhabituel. Vérifiez la valeur résiduelle du contrat.
                </p>
                <Link
                  href={`/cases/${caseId}?edit=1`}
                  className="text-body-sm text-primary mt-1.5 inline-block font-medium underline underline-offset-4"
                >
                  Corriger le dossier
                </Link>
              </div>
            </div>
          ) : null}

          <dl className="border-border mt-5 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-label text-muted-foreground">Valeur de marché</dt>
              <dd className="text-figure text-foreground mt-1">
                {formatMoney(valuation.marketValueCents, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-label text-muted-foreground">Valeur résiduelle</dt>
              <dd className="text-figure text-muted-foreground mt-1">
                {formatMoney(valuation.initialResidualValueCents, currency)}
              </dd>
            </div>
          </dl>
        </>
      )}

      {/* The Sourced Number Rule: a figure never appears without its
          provenance in the same block. */}
      {provenance ? (
        <p className="text-caption text-muted-foreground mt-4">
          Extrait du rapport&nbsp;: {provenance}
        </p>
      ) : null}
    </section>
  );
}
