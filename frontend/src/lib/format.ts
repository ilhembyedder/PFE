import type { Reliability, ReliabilityDisplay } from "@/types/api";
import type { Locale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";

/**
 * Locale-aware value formatting.
 *
 * Enum LABELS are not here: they live in messages/{fr,en}.json and are read
 * through useTranslations, so a raw enum can never reach the screen in either
 * language. This module holds only the formatting that depends on Intl.
 *
 * Every function takes the locale explicitly rather than reading a global, so
 * it is testable and usable from both server and client components.
 */

/** BCP 47 tags. `fr-FR` rather than bare `fr` so grouping and currency behave. */
const INTL_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

export const intlLocale = (locale: string | undefined): string =>
  INTL_LOCALE[(locale ?? DEFAULT_LOCALE) as Locale] ?? INTL_LOCALE[DEFAULT_LOCALE];

export const EM_DASH = "—";

// -------------------------------------------------------------------- money

/**
 * Money is stored in cents as an integer and divided only here.
 *
 * The currency always comes from the record: tenants operate in both TND and
 * EUR, so a hardcoded symbol would be wrong for one of them.
 */
export function formatMoney(
  cents: number | null | undefined,
  currency: string | null | undefined,
  locale?: string,
): string {
  if (cents === null || cents === undefined) return EM_DASH;

  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined;
  const amount = cents / 100;

  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: code ? "currency" : "decimal",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)}${code ? `\u00A0${code}` : ""}`;
  }
}

export function formatNumber(
  value: number | null | undefined,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return EM_DASH;
  return new Intl.NumberFormat(intlLocale(locale), options).format(value);
}

/**
 * Signed percentage using a true minus sign.
 *
 * The stored percentage is absolute; direction comes from the signed deviation
 * in cents. French inserts a non-breaking space before the percent sign;
 * English does not.
 */
export function formatPercent(
  value: number | string | null | undefined,
  signFrom?: number | null,
  locale?: string,
): string {
  if (value === null || value === undefined) return EM_DASH;

  const magnitude = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(magnitude)) return EM_DASH;

  const negative = typeof signFrom === "number" && signFrom < 0;
  const sign = magnitude === 0 ? "" : negative ? "\u2212" : "+";
  const formatted = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(magnitude));

  const separator = (locale ?? DEFAULT_LOCALE).startsWith("fr") ? "\u00A0" : "";
  return `${sign}${formatted}${separator}%`;
}

// -------------------------------------------------------------------- dates

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(iso: string | null | undefined, locale?: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string | null | undefined, locale?: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTime(iso: string | null | undefined, locale?: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Relative under a week, absolute beyond, via Intl.RelativeTimeFormat so both
 * locales read naturally. Callers put the absolute date in a title attribute
 * so the exact value is never lost.
 */
export function formatRelative(iso: string | null | undefined, locale?: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const relative = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });

  if (seconds < 60) return relative.format(0, "second");
  if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86_400) return relative.format(-Math.floor(seconds / 3600), "hour");

  const days = Math.floor(seconds / 86_400);
  if (days < 7) return relative.format(-days, "day");

  return formatDate(iso, locale);
}

/** Whole days since a timestamp, for the dormancy highlight. */
export function daysSince(iso: string | null | undefined): number | null {
  const date = parse(iso);
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

// -------------------------------------------------------------- reliability

/**
 * Resolves what the interface should display, rather than trusting the
 * backend's indicator.
 *
 * When the residual value is zero or absent no comparison happened, but the
 * backend still returns RELIABLE because the uncomputed 0.0 falls through its
 * band check (CODE_REVIEW.md H-21). A green badge on a comparison that never
 * ran is the most damaging thing this screen could show, so the UI derives the
 * state itself.
 */
export function resolveReliability(
  valuation:
    | {
        reliabilityIndicator?: Reliability | null;
        initialResidualValueCents?: number | null;
        marketValueCents?: number | null;
      }
    | null
    | undefined,
): ReliabilityDisplay {
  if (
    !valuation ||
    valuation.marketValueCents === null ||
    valuation.marketValueCents === undefined
  ) {
    return "NOT_VALUED";
  }

  const residual = valuation.initialResidualValueCents;
  if (residual === null || residual === undefined || residual <= 0) {
    return "NOT_COMPUTABLE";
  }

  return valuation.reliabilityIndicator ?? "NOT_VALUED";
}

export const reliabilityTone = (
  state: ReliabilityDisplay,
): "success" | "warning" | "critical" | "neutral" =>
  state === "RELIABLE"
    ? "success"
    : state === "MODERATE_RISK"
      ? "warning"
      : state === "CRITICAL_RISK"
        ? "critical"
        : "neutral";

// -------------------------------------------------------------------- misc

export const initials = (name: string | null | undefined): string =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
