"use client";

import Link from "next/link";
import { AlertTriangle, FileText, Info } from "lucide-react";
import { Chip, chipIcons } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { resolveReliability, reliabilityTone } from "@/lib/format";
import { useFormat, useLabels } from "@/lib/use-format";
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
  const t = useTranslations("valuation");
  const format = useFormat();
  const labels = useLabels();

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
        extracted.mileage ? `${format.number(extracted.mileage)} km` : null,
        extracted.condition,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <section
      role="region"
      aria-label={
        provenance ? t("regionLabelFor", { vehicle: provenance }) : t("regionLabel")
      }
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
        <h2 className="type-title">{t("title")}</h2>
        <div className="flex items-center gap-2">
          {state === "NOT_COMPUTABLE" ? (
            <Chip>{labels.reliability("NOT_COMPUTABLE")}</Chip>
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
              {labels.reliability(state)}
            </Chip>
          )}
          {documentId ? (
            <Link
              href={`/api/cases/${caseId}/documents/${documentId}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="type-body-sm text-primary focus-visible:focus-ring inline-flex items-center gap-1 rounded-sm underline underline-offset-4 outline-none [&_svg]:size-3.5"
            >
              <FileText aria-hidden />
              {t("viewSource")}
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
          <p className="type-figure-hero text-foreground">
            {format.money(valuation.marketValueCents, currency)}
          </p>
          <p className="type-body-sm text-muted-foreground mt-1.5">
            {t("marketValueEstimated")}
          </p>
          <div className="bg-warning-surface border-warning-border mt-4 flex gap-2.5 rounded-md border p-3">
            <Info className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="type-body-sm">{t("notComputable")}</p>
              <Link
                href={`/cases/${caseId}?edit=1`}
                className="type-body-sm text-primary mt-1.5 inline-block font-medium underline underline-offset-4"
              >
                {t("fixCase")}
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Prefer the absolute figure once the percentage stops being
              picturable. Fall back to a clamped percentage only when no
              absolute deviation is available, since the stored value is
              capped at 999.99 and is no longer precise. */}
          <p className={cn("type-figure-hero", TONE_TEXT[tone])}>
            {extreme && deviationCents !== null
              ? format.money(deviationCents, currency)
              : clamped
                ? t("clamped")
                : format.percent(percent, deviationCents)}
          </p>

          <p className="type-body-sm text-muted-foreground mt-1.5">
            {extreme && ratio
              ? t("timesLower", {
                  ratio: format.number(ratio, { maximumFractionDigits: 1 }),
                })
              : deviationCents === null
                ? t("unavailable")
                : t(deviationCents < 0 ? "below" : "above", {
                    amount: format.money(Math.abs(deviationCents), currency),
                  })}
          </p>

          {extreme ? (
            <div className="bg-warning-surface border-warning-border mt-4 flex gap-2.5 rounded-md border p-3">
              <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="type-body-sm">{t("unusual")}</p>
                <Link
                  href={`/cases/${caseId}?edit=1`}
                  className="type-body-sm text-primary mt-1.5 inline-block font-medium underline underline-offset-4"
                >
                  Corriger le dossier
                </Link>
              </div>
            </div>
          ) : null}

          <dl className="border-border mt-5 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <dt className="type-label text-muted-foreground">{t("marketValue")}</dt>
              <dd className="type-figure text-foreground mt-1">
                {format.money(valuation.marketValueCents, currency)}
              </dd>
            </div>
            <div>
              <dt className="type-label text-muted-foreground">{t("residualValue")}</dt>
              <dd className="type-figure text-muted-foreground mt-1">
                {format.money(valuation.initialResidualValueCents, currency)}
              </dd>
            </div>
          </dl>
        </>
      )}

      {/* The Sourced Number Rule: a figure never appears without its
          provenance in the same block. */}
      {provenance ? (
        <p className="type-caption text-muted-foreground mt-4">
          {t("provenance", { details: provenance })}
        </p>
      ) : null}
    </section>
  );
}
