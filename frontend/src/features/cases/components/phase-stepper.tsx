"use client";

import { Check, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PHASE_SHORT } from "@/lib/format";
import { PHASES, type Phase, type Prerequisites } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * The five-phase workflow.
 *
 * The blocking reason is rendered inline beneath the stepper as text, not only
 * in a tooltip: a tooltip is not an accessible home for information the user
 * has to act on. The tooltip is a convenience on top of that.
 */
export function PhaseStepper({
  currentPhase,
  prerequisites,
  className,
}: {
  currentPhase: Phase;
  prerequisites?: Prerequisites;
  className?: string;
}) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const blockedPhase =
    prerequisites?.isBlocked && prerequisites.nextPhase ? prerequisites.nextPhase : null;

  return (
    <div className={className}>
      <ol className="flex flex-col gap-1 sm:flex-row sm:items-stretch sm:gap-0">
        {PHASES.map((phase, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const blocked = phase === blockedPhase;

          const marker = (
            <span
              aria-hidden
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full border text-[0.6875rem] font-semibold [&_svg]:size-3.5",
                done && "bg-success border-success text-success-foreground",
                active && "bg-primary border-primary text-primary-foreground",
                blocked && "bg-destructive-surface border-destructive text-destructive",
                !done && !active && !blocked && "border-border bg-panel text-muted-foreground",
              )}
            >
              {done ? <Check /> : blocked ? <Lock /> : index + 1}
            </span>
          );

          const label = (
            <span
              className={cn(
                "type-body-sm truncate",
                active && "text-foreground font-medium",
                done && "text-foreground",
                blocked && "text-destructive font-medium",
                !done && !active && !blocked && "text-muted-foreground",
              )}
            >
              {PHASE_SHORT[phase]}
            </span>
          );

          const step = (
            <span className="flex min-w-0 items-center gap-2">
              {marker}
              {label}
            </span>
          );

          return (
            <li
              key={phase}
              aria-current={active ? "step" : undefined}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              {blocked && prerequisites?.missingPrerequisites.length ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        tabIndex={0}
                        aria-disabled
                        className="focus-visible:focus-ring rounded-sm outline-none"
                      >
                        {step}
                      </span>
                    }
                  />
                  <TooltipContent side="bottom" className="max-w-xs">
                    <ul className="list-disc space-y-1 pl-4">
                      {prerequisites.missingPrerequisites.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              ) : (
                step
              )}

              {index < PHASES.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    index < currentIndex ? "bg-success" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="sr-only">
        Phase actuelle : {PHASE_SHORT[currentPhase]}, étape {currentIndex + 1} sur{" "}
        {PHASES.length}.
      </p>
    </div>
  );
}
