"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { DefinitionList } from "@/components/states/definition-list";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { useSaveVehicle } from "@/lib/query/hooks";
import type { Contract } from "@/types/api";

/**
 * Vehicle link/edit, rendered INLINE inside the contract sheet.
 *
 * The previous build opened a modal on top of a drawer for this. Stacked
 * overlays are the worst pattern it carried, and "modal as first thought" is
 * prohibited outright.
 */
export function VehicleForm({ contract }: { contract: Contract }) {
  const t = useTranslations("leasing.vehicle");
  const tCase = useTranslations("caseDetail.vehicle");
  const tCommon = useTranslations("common");
  const save = useSaveVehicle(contract.id);
  const hasVehicle = Boolean(contract.vehicleId && contract.vehicleVin);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    vin: contract.vehicleVin ?? "",
    licensePlate: contract.vehicleLicensePlate ?? "",
    brand: contract.vehicleBrand ?? "",
    model: contract.vehicleModel ?? "",
    year: contract.vehicleYear ?? null,
  });

  const submit = async () => {
    setError(null);
    if (!form.vin.trim()) return setError(t("vinRequired"));
    if (!/^[A-Za-z0-9]+$/.test(form.vin.trim())) {
      return setError(t("vinAlphanumeric"));
    }
    const currentYear = new Date().getFullYear();
    if (form.year !== null && (form.year < 1900 || form.year > currentYear + 1)) {
      return setError(t("yearRange", { max: currentYear + 1 }));
    }
    try {
      await save.mutateAsync({ ...form, vin: form.vin.trim().toUpperCase() });
      setEditing(false);
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  if (hasVehicle && !editing) {
    return (
      <div className="space-y-3">
        <DefinitionList
          columns={2}
          items={[
            { label: tCase("vin"), value: contract.vehicleVin, mono: true },
            { label: tCase("plate"), value: contract.vehicleLicensePlate, mono: true },
            { label: tCase("brand"), value: contract.vehicleBrand },
            { label: tCase("model"), value: contract.vehicleModel },
            { label: tCase("year"), value: contract.vehicleYear },
          ]}
        />
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          {t("edit")}
        </Button>
      </div>
    );
  }

  if (!hasVehicle && !editing) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="type-body-sm text-muted-foreground">
          {t("none")}
        </p>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Car aria-hidden />
          {t("link")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState error={new Error(error)} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="vehicle-vin">{tCase("vin")}</Label>
          <Input
            id="vehicle-vin"
            className="type-identifier uppercase"
            maxLength={50}
            value={form.vin}
            onChange={(event) => setForm((p) => ({ ...p, vin: event.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vehicle-plate">{tCase("plate")}</Label>
          <Input
            id="vehicle-plate"
            className="type-identifier"
            maxLength={50}
            value={form.licensePlate}
            onChange={(event) => setForm((p) => ({ ...p, licensePlate: event.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vehicle-brand">{tCase("brand")}</Label>
          <Input
            id="vehicle-brand"
            maxLength={100}
            value={form.brand}
            onChange={(event) => setForm((p) => ({ ...p, brand: event.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vehicle-model">{tCase("model")}</Label>
          <Input
            id="vehicle-model"
            maxLength={100}
            value={form.model}
            onChange={(event) => setForm((p) => ({ ...p, model: event.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vehicle-year">{tCase("year")}</Label>
          <NumericInput
            id="vehicle-year"
            integer
            value={form.year}
            onValueChange={(year) => setForm((p) => ({ ...p, year }))}
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {tCommon("save")}
        </Button>
        {hasVehicle ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            {tCommon("cancel")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
