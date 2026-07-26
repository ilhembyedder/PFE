"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/states/page-header";
import { Panel } from "@/components/states/panel";
import { DefinitionList } from "@/components/states/definition-list";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { useClients, useContracts, useCreateCase } from "@/lib/query/hooks";
import { formatDate } from "@/lib/format";

/**
 * Case creation.
 *
 * Numbered sections rather than a wizard: the manager has the contract in
 * front of her and wants to enter it in one pass. A five-step wizard would add
 * clicks without reducing load, and one undifferentiated form would be the
 * "bureaucratic form" anti-reference.
 */

const CURRENCIES = ["TND", "EUR"] as const;
const CONTRACT_STATUS = [
  ["ACTIVE", "Actif"],
  ["SUSPENDED", "Suspendu"],
  ["TERMINATED", "Résilié"],
] as const;

interface FormState {
  clientName: string;
  clientRegistrationNumber: string;
  clientContactEmail: string;
  clientContactPhone: string;
  clientAddress: string;
  contractReference: string;
  contractStartDate: string;
  contractEndDate: string;
  contractStatus: string;
  vehicleVin: string;
  vehicleLicensePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number | null;
  currencyCode: string;
}

const EMPTY: FormState = {
  clientName: "",
  clientRegistrationNumber: "",
  clientContactEmail: "",
  clientContactPhone: "",
  clientAddress: "",
  contractReference: "",
  contractStartDate: "",
  contractEndDate: "",
  contractStatus: "ACTIVE",
  vehicleVin: "",
  vehicleLicensePlate: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleYear: null,
  currencyCode: "TND",
};

function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="bg-panel border-border type-caption grid size-5 shrink-0 place-items-center rounded-full border font-semibold"
      >
        {index}
      </span>
      {children}
    </span>
  );
}

export default function NewCasePage() {
  const router = useRouter();
  const create = useCreateCase();
  const clients = useClients();
  const contracts = useContracts();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [residual, setResidual] = useState<number | null>(null);
  const [contractId, setContractId] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  /**
   * Detects an existing client from the registration number or email.
   *
   * The backend silently OVERWRITES an existing client's master data when a
   * case is created against it (CODE_REVIEW.md H-7). The interface makes that
   * impossible: on a match the fields become read-only and the form states
   * plainly that nothing will change.
   */
  const matchedClient = useMemo(() => {
    const registration = form.clientRegistrationNumber.trim().toLowerCase();
    const email = form.clientContactEmail.trim().toLowerCase();
    if (!registration && !email) return null;
    return (
      (clients.data ?? []).find(
        (candidate) =>
          (registration &&
            candidate.registrationNumber?.trim().toLowerCase() === registration) ||
          (email && candidate.contactEmail?.trim().toLowerCase() === email),
      ) ?? null
    );
  }, [clients.data, form.clientRegistrationNumber, form.clientContactEmail]);

  const prefill = (id: string) => {
    setContractId(id);
    const contract = (contracts.data ?? []).find((candidate) => candidate.id === id);
    if (!contract) return;
    setForm({
      clientName: contract.clientName ?? "",
      clientRegistrationNumber: contract.clientRegistrationNumber ?? "",
      clientContactEmail: contract.clientContactEmail ?? "",
      clientContactPhone: contract.clientContactPhone ?? "",
      clientAddress: contract.clientAddress ?? "",
      contractReference: contract.referenceNumber ?? "",
      contractStartDate: contract.startDate?.slice(0, 10) ?? "",
      contractEndDate: contract.endDate?.slice(0, 10) ?? "",
      contractStatus: contract.status ?? "ACTIVE",
      vehicleVin: contract.vehicleVin ?? "",
      vehicleLicensePlate: contract.vehicleLicensePlate ?? "",
      vehicleBrand: contract.vehicleBrand ?? "",
      vehicleModel: contract.vehicleModel ?? "",
      vehicleYear: contract.vehicleYear ?? null,
      currencyCode: "TND",
    });
  };

  const validate = (): string[] => {
    const found: string[] = [];
    if (!form.clientName.trim()) found.push("Le nom du client est requis.");
    if (!form.contractReference.trim()) found.push("La référence du contrat est requise.");
    if (!form.vehicleVin.trim()) found.push("Le VIN du véhicule est requis.");
    // Zero passes the backend's @Min(0) and produces a false "Fiable"
    // indicator (H-21). Refused here.
    if (residual === null || residual <= 0) {
      found.push("La valeur résiduelle initiale doit être strictement positive.");
    }
    if (
      form.contractStartDate &&
      form.contractEndDate &&
      form.contractEndDate <= form.contractStartDate
    ) {
      // The backend does not check this at all.
      found.push("La date de fin doit être postérieure à la date de début.");
    }
    if (form.vehicleYear !== null) {
      const year = new Date().getFullYear();
      if (form.vehicleYear < 1900 || form.vehicleYear > year + 1) {
        found.push(`L'année du véhicule doit être comprise entre 1900 et ${year + 1}.`);
      }
    }
    return found;
  };

  const submit = async () => {
    setServerError(null);
    const found = validate();
    setErrors(found);
    if (found.length) return;

    try {
      const created = await create.mutateAsync({
        ...form,
        clientName: form.clientName.trim(),
        contractReference: form.contractReference.trim(),
        vehicleVin: form.vehicleVin.trim().toUpperCase(),
        contractStartDate: form.contractStartDate || null,
        contractEndDate: form.contractEndDate || null,
        initialResidualValueCents: Math.round((residual ?? 0) * 100),
      });
      // Lands on the case, not the registry: working it is the next thing.
      router.replace(`/cases/${(created as { id: string }).id}`);
    } catch (cause) {
      setServerError(messageFor(cause));
    }
  };

  return (
    <div className="mx-auto max-w-[720px]">
      <nav aria-label="Fil d'Ariane" className="type-body-sm mb-4 flex items-center gap-1.5">
        <Link href="/cases" className="text-muted-foreground hover:text-foreground">
          Dossiers
        </Link>
        <ChevronRight className="text-muted-foreground size-3.5" aria-hidden />
        <span>Nouveau dossier</span>
      </nav>

      <PageHeader
        title="Nouveau dossier"
        subtitle="Renseignez le client, le contrat et le véhicule concernés."
      />

      <div className="space-y-5 pb-24">
        <Panel title={<SectionTitle index={1}>Contrat existant</SectionTitle>}>
          <div className="space-y-1.5">
            <Label htmlFor="existing">Reprendre un contrat déjà enregistré</Label>
            <Select value={contractId || "none"} onValueChange={(v) => v && v !== "none" && prefill(v)}>
              <SelectTrigger id="existing" className="w-full">
                <SelectValue placeholder="Optionnel — saisir manuellement ci-dessous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Saisir manuellement</SelectItem>
                {(contracts.data ?? []).map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.referenceNumber} — {contract.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="type-caption text-muted-foreground">
              Les sections suivantes seront pré-remplies.
            </p>
          </div>
        </Panel>

        <Panel title={<SectionTitle index={2}>Client</SectionTitle>}>
          {matchedClient ? (
            /* Existing client: read-only, and the form says why. */
            <div className="space-y-4">
              <div className="bg-accent border-primary-border flex gap-2.5 rounded-md border p-3">
                <Info className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <div>
                  <p className="type-body-sm">
                    Client existant. Ses informations ne seront pas modifiées.
                  </p>
                  <Link
                    href="/leasing"
                    className="type-body-sm text-primary mt-1 inline-block font-medium underline underline-offset-4"
                  >
                    Modifier ce client
                  </Link>
                </div>
              </div>
              <DefinitionList
                items={[
                  { label: "Nom ou raison sociale", value: matchedClient.fullNameOrCompany },
                  {
                    label: "Numéro d'immatriculation",
                    value: matchedClient.registrationNumber,
                    mono: true,
                  },
                  { label: "E-mail", value: matchedClient.contactEmail },
                  { label: "Téléphone", value: matchedClient.contactPhone },
                ]}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  set("clientRegistrationNumber", "");
                  set("clientContactEmail", "");
                }}
              >
                Saisir un autre client
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="clientName">Nom ou raison sociale</Label>
                <Input
                  id="clientName"
                  value={form.clientName}
                  onChange={(e) => set("clientName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientReg">Numéro d&apos;immatriculation</Label>
                <Input
                  id="clientReg"
                  className="type-identifier"
                  value={form.clientRegistrationNumber}
                  onChange={(e) => set("clientRegistrationNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientEmail">E-mail</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={form.clientContactEmail}
                  onChange={(e) => set("clientContactEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientPhone">Téléphone</Label>
                <Input
                  id="clientPhone"
                  value={form.clientContactPhone}
                  onChange={(e) => set("clientContactPhone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientAddress">Adresse</Label>
                <Input
                  id="clientAddress"
                  value={form.clientAddress}
                  onChange={(e) => set("clientAddress", e.target.value)}
                />
              </div>
            </div>
          )}
        </Panel>

        <Panel title={<SectionTitle index={3}>Contrat</SectionTitle>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                className="type-identifier"
                value={form.contractReference}
                onChange={(e) => set("contractReference", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contractStatus">Statut</Label>
              <Select
                value={form.contractStatus}
                onValueChange={(v) => set("contractStatus", v ?? "ACTIVE")}
              >
                <SelectTrigger id="contractStatus" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_STATUS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={form.contractStartDate}
                onChange={(e) => set("contractStartDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={form.contractEndDate}
                onChange={(e) => set("contractEndDate", e.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel title={<SectionTitle index={4}>Véhicule</SectionTitle>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                className="type-identifier uppercase"
                value={form.vehicleVin}
                onChange={(e) => set("vehicleVin", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plate">Immatriculation</Label>
              <Input
                id="plate"
                className="type-identifier"
                value={form.vehicleLicensePlate}
                onChange={(e) => set("vehicleLicensePlate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                value={form.vehicleBrand}
                onChange={(e) => set("vehicleBrand", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Modèle</Label>
              <Input
                id="model"
                value={form.vehicleModel}
                onChange={(e) => set("vehicleModel", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Année</Label>
              <NumericInput
                id="year"
                integer
                value={form.vehicleYear}
                onValueChange={(v) => set("vehicleYear", v)}
                min={1900}
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>
        </Panel>

        <Panel title={<SectionTitle index={5}>Données financières</SectionTitle>}>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="residual">Valeur résiduelle initiale</Label>
              <NumericInput
                id="residual"
                value={residual}
                onValueChange={setResidual}
                suffix={form.currencyCode}
                min={0}
              />
              <p className="type-caption text-muted-foreground">
                Référence de toute comparaison avec la valeur de marché estimée.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Devise</Label>
              <Select
                value={form.currencyCode}
                onValueChange={(v) => set("currencyCode", v ?? "TND")}
              >
                <SelectTrigger id="currency" className="w-24">
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
          {form.contractStartDate ? (
            <p className="type-caption text-muted-foreground mt-3">
              Contrat démarré le {formatDate(form.contractStartDate)}.
            </p>
          ) : null}
        </Panel>
      </div>

      {/* Sticky footer with a linked validation summary. */}
      <div className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-sm md:pl-14 lg:pl-60">
        <div className="mx-auto max-w-[1280px] px-4 py-3 md:px-6 lg:px-8">
          {errors.length ? (
            <div
              role="alert"
              className="bg-destructive-surface border-destructive-border mb-3 rounded-md border p-3"
            >
              <p className="type-body-sm text-destructive font-semibold">
                {errors.length} champ{errors.length > 1 ? "s" : ""} à corriger
              </p>
              <ul className="type-body-sm mt-1 list-disc space-y-0.5 pl-4">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {serverError ? <ErrorState error={new Error(serverError)} className="mb-3" /> : null}

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" render={<Link href="/cases" />}>
              Annuler
            </Button>
            <Button onClick={() => void submit()} disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 aria-hidden />
              )}
              Créer le dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
