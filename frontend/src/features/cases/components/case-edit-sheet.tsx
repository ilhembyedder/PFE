"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { NumericInput } from "@/components/ui/numeric-input";
import { useUpdateCase } from "@/lib/query/hooks";
import type { CaseDetail } from "@/types/api";

/**
 * A side sheet, not a modal: the case stays visible behind it.
 * "Modal as first thought" is prohibited (DESIGN.md §6).
 */

const CURRENCIES = ["TND", "EUR"] as const;

export function CaseEditSheet({
  open,
  onOpenChange,
  caseId,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  detail: CaseDetail;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[560px]">
        {/* The form mounts only while open and seeds its state from props, so
            there is no effect syncing props into state. */}
        {open ? (
          <EditForm
            caseId={caseId}
            detail={detail}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function EditForm({
  caseId,
  detail,
  onDone,
}: {
  caseId: string;
  detail: CaseDetail;
  onDone: () => void;
}) {
  const update = useUpdateCase(caseId);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState(
    detail.client?.fullNameOrCompany ?? "",
  );
  const [reference, setReference] = useState(
    detail.contract?.referenceNumber ?? "",
  );
  const [residual, setResidual] = useState<number | null>(
    detail.initialResidualValueCents === null ||
      detail.initialResidualValueCents === undefined
      ? null
      : detail.initialResidualValueCents / 100,
  );
  const [currency, setCurrency] = useState<string>(
    detail.currencyCode ?? "TND",
  );

  const submit = async () => {
    setError(null);
    if (!clientName.trim()) return setError("Le nom du client est requis.");
    if (!reference.trim())
      return setError("La référence du contrat est requise.");
    if (residual === null || residual <= 0) {
      // Zero is what produces the false "Fiable" indicator (H-21), so the
      // interface refuses it rather than letting it reach the backend.
      return setError("La valeur résiduelle doit être strictement positive.");
    }

    try {
      await update.mutateAsync({
        clientName: clientName.trim(),
        contractReference: reference.trim(),
        initialResidualValueCents: Math.round(residual * 100),
        currencyCode: currency,
      });
      onDone();
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Modifier le dossier</SheetTitle>
        <SheetDescription>
          Les modifications sont enregistrées dans l&apos;historique du dossier.
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 px-4">
        {error ? <ErrorState error={new Error(error)} /> : null}

        <div className="space-y-1.5">
          <Label htmlFor="edit-client">Nom du client</Label>
          <Input
            id="edit-client"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-reference">Référence du contrat</Label>
          <Input
            id="edit-reference"
            className="type-identifier"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-residual">Valeur résiduelle initiale</Label>
            <NumericInput
              id="edit-residual"
              value={residual}
              onValueChange={setResidual}
              suffix={currency}
              min={0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-currency">Devise</Label>
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value ?? "TND")}
            >
              <SelectTrigger id="edit-currency" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <SheetFooter>
        <Button variant="ghost" onClick={onDone}>
          Annuler
        </Button>
        <Button onClick={() => void submit()} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          Enregistrer
        </Button>
      </SheetFooter>
    </>
  );
}
