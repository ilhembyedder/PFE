import type {
  AlertType,
  Criticality,
  Phase,
  Reliability,
  ReliabilityDisplay,
} from "@/types/api";

/**
 * Display formatting and the copy register.
 *
 * The product language is French and raw enum values must never reach the
 * screen. This module is the single mapping; docs/DESIGN_SCREENS.md §16 is
 * its specification.
 */

// ------------------------------------------------------------ copy register

export const PHASE_LABELS: Record<Phase, string> = {
  PRE_CONTENTIEUX: "Pré-contentieux",
  MISE_EN_DEMEURE: "Mise en demeure",
  SAISIE: "Saisie du véhicule",
  VENTE: "Vente",
  CLOTURE: "Clôture",
};

/** Short forms for the stepper, where horizontal space is scarce. */
export const PHASE_SHORT: Record<Phase, string> = {
  PRE_CONTENTIEUX: "Pré-contentieux",
  MISE_EN_DEMEURE: "Mise en demeure",
  SAISIE: "Saisie",
  VENTE: "Vente",
  CLOTURE: "Clôture",
};

export const RELIABILITY_LABELS: Record<ReliabilityDisplay, string> = {
  RELIABLE: "Fiable",
  MODERATE_RISK: "Écart modéré",
  CRITICAL_RISK: "Écart critique",
  NOT_COMPUTABLE: "Non calculable",
  NOT_VALUED: "Non estimé",
};

export const ALERT_LABELS: Record<AlertType, string> = {
  DORMANCY: "Dossier dormant",
  DEADLINE: "Échéance",
  MISSING_PREREQUISITE: "Prérequis manquant",
  VEHICLE_DISCREPANCY: "Incohérence véhicule",
};

export const CRITICALITY_LABELS: Record<Criticality, string> = {
  CRITICAL: "Critique",
  WARNING: "Avertissement",
};

export const CASE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  TERMINATED: "Résilié",
  INACTIVE: "Inactive",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
};

export const phaseLabel = (p: string | null | undefined) =>
  p ? (PHASE_LABELS[p as Phase] ?? p) : "—";

export const statusLabel = (s: string | null | undefined) =>
  s ? (CASE_STATUS_LABELS[s] ?? s) : "—";

export const roleLabel = (r: string | null | undefined) =>
  r ? (ROLE_LABELS[r] ?? r) : "";

// -------------------------------------------------------------------- money

/**
 * Money is stored in cents as an integer. It is divided only here.
 * The currency always comes from the record; tenants operate in TND and EUR
 * and a hardcoded symbol would be wrong for one of them.
 */
export function formatMoney(
  cents: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (cents === null || cents === undefined) return "—";
  const code = currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined;
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: code ? "currency" : "decimal",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)}${code ? `\u00A0${code}` : ""}`;
  }
}

/**
 * Signed percentage with a true minus sign and a non-breaking space before
 * the sign, per French typography.
 */
export function formatPercent(
  value: number | string | null | undefined,
  signFrom?: number | null,
): string {
  if (value === null || value === undefined) return "—";
  const magnitude = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(magnitude)) return "—";

  // The stored percentage is absolute; direction comes from the deviation.
  const negative = typeof signFrom === "number" && signFrom < 0;
  const sign = magnitude === 0 ? "" : negative ? "\u2212" : "+";
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(magnitude));

  return `${sign}${formatted}\u00A0%`;
}

// -------------------------------------------------------------------- dates

const DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (iso: string | null | undefined) => {
  const date = parse(iso);
  return date ? DATE.format(date) : "—";
};

export const formatDateTime = (iso: string | null | undefined) => {
  const date = parse(iso);
  return date ? DATE_TIME.format(date).replace(" ", " à ") : "—";
};

/**
 * Relative under seven days, absolute beyond. The absolute value always goes
 * in a title attribute so the exact date is never lost.
 */
export function formatRelative(iso: string | null | undefined): string {
  const date = parse(iso);
  if (!date) return "—";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;

  return DATE.format(date);
}

/** Days since a timestamp, for the dormancy highlight. */
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
 * backend still returns RELIABLE because the uncomputed 0.0 falls through
 * its band check (CODE_REVIEW.md H-21). A green "Fiable" badge on a
 * comparison that never ran is the most damaging thing this screen could
 * show, so the UI derives the state itself.
 */
export function resolveReliability(valuation: {
  reliabilityIndicator?: Reliability | null;
  initialResidualValueCents?: number | null;
  marketValueCents?: number | null;
} | null | undefined): ReliabilityDisplay {
  if (!valuation || valuation.marketValueCents === null || valuation.marketValueCents === undefined) {
    return "NOT_VALUED";
  }
  const residual = valuation.initialResidualValueCents;
  if (residual === null || residual === undefined || residual <= 0) {
    return "NOT_COMPUTABLE";
  }
  return valuation.reliabilityIndicator ?? "NOT_VALUED";
}

export const reliabilityTone = (
  r: ReliabilityDisplay,
): "success" | "warning" | "critical" | "neutral" =>
  r === "RELIABLE"
    ? "success"
    : r === "MODERATE_RISK"
      ? "warning"
      : r === "CRITICAL_RISK"
        ? "critical"
        : "neutral";

export const initials = (name: string | null | undefined): string =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
