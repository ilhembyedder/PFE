import Link from "next/link";
import { Lock } from "lucide-react";
import { PHASE_SHORT } from "@/lib/format";
import type { Phase } from "@/types/api";

/**
 * Why a transition is blocked, and what resolves it.
 *
 * PRODUCT.md: "Actions, not options" — a blocked state explains what to do,
 * not merely that the user cannot proceed. Phantom blocking is named as an
 * anti-reference.
 *
 * A full border, not a left stripe.
 */
export function BlockedNotice({
  nextPhase,
  reasons,
  caseId,
  action,
}: {
  nextPhase: Phase | null;
  reasons: string[];
  caseId: string;
  action?: { href: string; label: string };
}) {
  if (!reasons.length) return null;

  return (
    <div
      role="status"
      className="bg-destructive-surface border-destructive-border flex gap-3 rounded-md border p-4"
    >
      <Lock className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="type-body-sm text-destructive font-semibold">
          {nextPhase
            ? `Passage en « ${PHASE_SHORT[nextPhase]} » bloqué`
            : "Progression bloquée"}
        </p>
        <ul className="type-body-sm mt-1.5 list-disc space-y-1 pl-4">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <Link
          href={action?.href ?? `/cases/${caseId}?tab=documents&focus=upload`}
          className="type-body-sm text-primary focus-visible:focus-ring mt-2 inline-block rounded-sm font-medium underline underline-offset-4 outline-none"
        >
          {action?.label ?? "Téléverser un rapport d'expertise"}
        </Link>
      </div>
    </div>
  );
}
