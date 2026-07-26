"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

/**
 * Numeric field: tabular figures, right-aligned, suffix adornment, and French
 * decimal parsing (comma as separator, spaces as grouping).
 *
 * Money is held in cents everywhere else; this component works in display
 * units and the caller converts. Right alignment plus tabular figures is
 * functional, not stylistic: it is what lets a column of amounts be compared.
 */

function parseFrench(raw: string): number | null {
  const normalised = raw
    .replace(/[\s\u00A0\u202F]/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (normalised === "" || normalised === "-") return null;
  const value = Number.parseFloat(normalised);
  return Number.isFinite(value) ? value : null;
}

const formatFrench = (value: number | null): string =>
  value === null
    ? ""
    : new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

export function NumericInput({
  value,
  onValueChange,
  suffix,
  className,
  min,
  max,
  integer = false,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  suffix?: string;
  min?: number;
  max?: number;
  /** Whole numbers only: days, months, percentages. */
  integer?: boolean;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);

  // While focused the raw text is authoritative, so typing "1 2" is possible.
  // On blur it is normalised and pushed up.
  const display = draft ?? (integer ? (value?.toString() ?? "") : formatFrench(value));

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(event) => {
          setDraft(event.target.value);
          const parsed = parseFrench(event.target.value);
          onValueChange(parsed === null ? null : integer ? Math.trunc(parsed) : parsed);
        }}
        onBlur={(event) => {
          let parsed = parseFrench(event.target.value);
          if (parsed !== null) {
            if (integer) parsed = Math.trunc(parsed);
            if (min !== undefined) parsed = Math.max(parsed, min);
            if (max !== undefined) parsed = Math.min(parsed, max);
          }
          onValueChange(parsed);
          setDraft(null);
          props.onBlur?.(event);
        }}
        data-numeric
        className={cn("text-right tabular", suffix && "pr-12", className)}
      />
      {suffix ? (
        <span
          aria-hidden
          className="text-caption text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
