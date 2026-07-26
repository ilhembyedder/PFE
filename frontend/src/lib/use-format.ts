"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  EM_DASH,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
} from "./format";

/**
 * Locale-bound formatters.
 *
 * Components call these instead of the bare functions in format.ts, so the
 * locale is never passed around by hand and never accidentally omitted.
 */
export function useFormat() {
  const locale = useLocale();

  return useMemo(
    () => ({
      locale,
      money: (cents: number | null | undefined, currency: string | null | undefined) =>
        formatMoney(cents, currency, locale),
      percent: (
        value: number | string | null | undefined,
        signFrom?: number | null,
      ) => formatPercent(value, signFrom, locale),
      number: (value: number | null | undefined, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, locale, options),
      date: (iso: string | null | undefined) => formatDate(iso, locale),
      dateTime: (iso: string | null | undefined) => formatDateTime(iso, locale),
      time: (iso: string | null | undefined) => formatTime(iso, locale),
      relative: (iso: string | null | undefined) => formatRelative(iso, locale),
    }),
    [locale],
  );
}

/**
 * Enum label lookups.
 *
 * Every domain enum is translated here rather than rendered raw. The previous
 * build printed ACTIVE, PRE_CONTENTIEUX and DORMANCY straight to the screen.
 * Unknown values fall back to the raw string, which is still better than a
 * blank, and absent values to an em dash.
 */
export function useLabels() {
  const phases = useTranslations("phases");
  const phasesShort = useTranslations("phasesShort");
  const statuses = useTranslations("status");
  const roles = useTranslations("roles");
  const reliability = useTranslations("reliability");
  const alertTypes = useTranslations("alertTypes");
  const criticality = useTranslations("criticality");

  return useMemo(() => {
    /** next-intl throws on an unknown key; fall back to the raw value. */
    const safe =
      (lookup: (key: string) => string) =>
      (key: string | null | undefined, fallback = EM_DASH): string => {
        if (!key) return fallback;
        try {
          return lookup(key);
        } catch {
          return key;
        }
      };

    return {
      phase: safe(phases as unknown as (key: string) => string),
      phaseShort: safe(phasesShort as unknown as (key: string) => string),
      status: safe(statuses as unknown as (key: string) => string),
      role: safe(roles as unknown as (key: string) => string),
      reliability: safe(reliability as unknown as (key: string) => string),
      alertType: safe(alertTypes as unknown as (key: string) => string),
      criticality: safe(criticality as unknown as (key: string) => string),
    };
  }, [phases, phasesShort, statuses, roles, reliability, alertTypes, criticality]);
}
