import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  Lock,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Chip — phase, status, alert criticality, reliability.
 *
 * The Signal Rule (DESIGN.md §2): a semantic state carries icon AND colour
 * AND text, always. That is enforced by the type, not by review: choosing a
 * semantic tone requires an icon, so a colour-only chip will not compile.
 * Meaning has to survive greyscale and colour blindness.
 */

const TONES = {
  neutral: "bg-panel text-muted-foreground border-border",
  critical: "bg-destructive-surface text-destructive border-destructive-border",
  warning: "bg-warning-surface text-warning border-warning-border",
  success: "bg-success-surface text-success border-success-border",
  accent: "bg-accent text-accent-foreground border-primary-border",
} as const;

export type ChipTone = keyof typeof TONES;

/** Semantic tones must be paired with an icon. Neutral and accent need not be. */
type SemanticTone = Extract<ChipTone, "critical" | "warning" | "success">;

type Props = React.ComponentProps<"span"> &
  (
    | { tone: SemanticTone; icon: React.ReactNode }
    | { tone?: Exclude<ChipTone, SemanticTone>; icon?: React.ReactNode }
  );

export function Chip({ className, tone = "neutral", icon, children, ...props }: Props) {
  return (
    <span
      data-slot="chip"
      className={cn(
        "text-caption inline-flex shrink-0 items-center gap-1 rounded-sm border px-2 py-0.5 whitespace-nowrap",
        "[&_svg]:size-3 [&_svg]:shrink-0",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/** The icon vocabulary, so the same state always looks the same. */
export const chipIcons = {
  critical: <CircleAlert aria-hidden />,
  warning: <AlertTriangle aria-hidden />,
  success: <CheckCircle2 aria-hidden />,
  dormant: <Moon aria-hidden />,
  locked: <Lock aria-hidden />,
  unknown: <CircleHelp aria-hidden />,
} as const;
