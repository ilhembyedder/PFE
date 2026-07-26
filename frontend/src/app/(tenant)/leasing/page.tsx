"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/states/page-header";
import { Panel } from "@/components/states/panel";
import { DataTable } from "@/components/states/data-table";
import { DefinitionList } from "@/components/states/definition-list";
import { NoDataState, NoResultsState } from "@/components/states/empty-state";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { DocumentList } from "@/features/cases/components/document-list";
import { VehicleForm } from "@/features/leasing/vehicle-form";
import {
  useClients,
  useContracts,
  useDeleteClient,
  useDeleteContract,
  useEntityDocuments,
  useSaveClient,
  useSaveContract,
} from "@/lib/query/hooks";
import { formatDate, statusLabel } from "@/lib/format";
import type { Client, Contract } from "@/types/api";
import { cn } from "@/lib/utils";

/**
 * Clients and contracts.
 *
 * One sheet pattern with view and edit modes, replacing the four drawers plus
 * stacked modal the previous build used. Vehicle linking happens inline within
 * the contract sheet: stacked overlays were the worst pattern in the old UI.
 */

type Tab = "clients" | "contracts";

function EntityDocuments({ entityType, entityId }: { entityType: string; entityId: string }) {
  const documents = useEntityDocuments(entityType, entityId);
  return (
    <DocumentList
      documents={documents.data ?? []}
      isPending={documents.isPending}
      downloadHref={(doc) => `/api/documents/${doc.id}/download`}
      emptyLabel="Aucun document rattaché."
    />
  );
}

function ClientSheet({
  client,
  onClose,
}: {
  client: Client | null;
  onClose: () => void;
}) {
  const save = useSaveClient();
  const contracts = useContracts();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullNameOrCompany: client?.fullNameOrCompany ?? "",
    registrationNumber: client?.registrationNumber ?? "",
    contactEmail: client?.contactEmail ?? "",
    contactPhone: client?.contactPhone ?? "",
    address: client?.address ?? "",
  });

  const linked = (contracts.data ?? []).filter((c) => c.clientId === client?.id);

  const submit = async () => {
    setError(null);
    if (!form.fullNameOrCompany.trim()) return setError("Le nom est requis.");
    try {
      await save.mutateAsync({ id: client?.id, ...form });
      onClose();
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  const isNew = !client;
  const showForm = isNew || editing;

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {isNew ? "Nouveau client" : (client?.fullNameOrCompany ?? "Client")}
        </SheetTitle>
        <SheetDescription>
          {isNew
            ? "Les clients peuvent ensuite être rattachés à des contrats."
            : client?.registrationNumber || "Aucun numéro d'immatriculation"}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-5 overflow-y-auto px-4">
        {error ? <ErrorState error={new Error(error)} /> : null}

        {showForm ? (
          <div className="space-y-4">
            {(
              [
                ["fullNameOrCompany", "Nom ou raison sociale", "text"],
                ["registrationNumber", "Numéro d'immatriculation", "text"],
                ["contactEmail", "E-mail", "email"],
                ["contactPhone", "Téléphone", "tel"],
                ["address", "Adresse", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`client-${key}`}>{label}</Label>
                <Input
                  id={`client-${key}`}
                  type={type}
                  className={key === "registrationNumber" ? "text-identifier" : undefined}
                  value={form[key]}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, [key]: event.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            <DefinitionList
              items={[
                { label: "E-mail", value: client?.contactEmail },
                { label: "Téléphone", value: client?.contactPhone },
                { label: "Adresse", value: client?.address },
                { label: "Créé le", value: formatDate(client?.createdAt) },
              ]}
            />

            <Panel title={`Contrats (${linked.length})`}>
              {linked.length ? (
                <ul className="divide-border divide-y">
                  {linked.map((contract) => (
                    <li key={contract.id} className="flex items-center gap-3 py-2.5">
                      <span className="text-identifier flex-1 truncate">
                        {contract.referenceNumber}
                      </span>
                      <Chip>{statusLabel(contract.status)}</Chip>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-muted-foreground">
                  Aucun contrat rattaché à ce client.
                </p>
              )}
            </Panel>

            {client ? (
              <Panel title="Documents">
                <EntityDocuments entityType="client" entityId={client.id} />
              </Panel>
            ) : null}
          </>
        )}
      </div>

      <SheetFooter>
        {showForm ? (
          <>
            <Button
              variant="ghost"
              onClick={() => (isNew ? onClose() : setEditing(false))}
            >
              Annuler
            </Button>
            <Button onClick={() => void submit()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Enregistrer
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </SheetFooter>
    </>
  );
}

function ContractSheet({
  contract,
  onClose,
}: {
  contract: Contract | null;
  onClose: () => void;
}) {
  const save = useSaveContract();
  const clients = useClients();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: contract?.clientId ?? "",
    referenceNumber: contract?.referenceNumber ?? "",
    startDate: contract?.startDate?.slice(0, 10) ?? "",
    endDate: contract?.endDate?.slice(0, 10) ?? "",
    status: contract?.status ?? "ACTIVE",
  });

  const submit = async () => {
    setError(null);
    if (!form.referenceNumber.trim()) return setError("La référence est requise.");
    if (!form.clientId) return setError("Un client doit être sélectionné.");
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      return setError("La date de fin doit être postérieure à la date de début.");
    }
    try {
      await save.mutateAsync({
        id: contract?.id,
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      });
      onClose();
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  const isNew = !contract;
  const showForm = isNew || editing;

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {isNew ? "Nouveau contrat" : (contract?.referenceNumber ?? "Contrat")}
        </SheetTitle>
        <SheetDescription>{contract?.clientName ?? "Rattaché à un client"}</SheetDescription>
      </SheetHeader>

      <div className="space-y-5 overflow-y-auto px-4">
        {error ? <ErrorState error={new Error(error)} /> : null}

        {showForm ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contract-client">Client</Label>
              <select
                id="contract-client"
                value={form.clientId}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, clientId: event.target.value }))
                }
                className="border-input bg-card text-body focus-visible:focus-ring h-9 w-full rounded-md border px-3 outline-none"
              >
                <option value="">Sélectionner un client</option>
                {(clients.data ?? []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullNameOrCompany}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contract-reference">Référence</Label>
              <Input
                id="contract-reference"
                className="text-identifier"
                value={form.referenceNumber}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, referenceNumber: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contract-start">Date de début</Label>
                <Input
                  id="contract-start"
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, startDate: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contract-end">Date de fin</Label>
                <Input
                  id="contract-end"
                  type="date"
                  value={form.endDate}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, endDate: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <DefinitionList
              items={[
                { label: "Client", value: contract?.clientName },
                { label: "Statut", value: statusLabel(contract?.status) },
                { label: "Date de début", value: formatDate(contract?.startDate) },
                { label: "Date de fin", value: formatDate(contract?.endDate) },
              ]}
            />

            {contract ? (
              <>
                {/* Inline, not a modal stacked on this sheet. */}
                <Panel title="Véhicule">
                  <VehicleForm contract={contract} />
                </Panel>

                <Panel title="Documents du contrat">
                  <EntityDocuments entityType="contract" entityId={contract.id} />
                </Panel>

                {contract.vehicleId ? (
                  <Panel title="Documents du véhicule">
                    <EntityDocuments entityType="vehicle" entityId={contract.vehicleId} />
                  </Panel>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>

      <SheetFooter>
        {showForm ? (
          <>
            <Button variant="ghost" onClick={() => (isNew ? onClose() : setEditing(false))}>
              Annuler
            </Button>
            <Button onClick={() => void submit()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              Enregistrer
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Modifier
          </Button>
        )}
      </SheetFooter>
    </>
  );
}

function LeasingRegistry() {
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "contracts" ? "contracts" : "clients";
  const search = params.get("q") ?? "";

  const clients = useClients();
  const contracts = useContracts();
  const deleteClient = useDeleteClient();
  const deleteContract = useDeleteContract();

  const [sheet, setSheet] = useState<
    | { kind: "client"; value: Client | null }
    | { kind: "contract"; value: Contract | null }
    | null
  >(null);
  const [confirm, setConfirm] = useState<
    { kind: Tab; id: string; label: string; detail: string } | null
  >(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setParams = (next: Record<string, string | null>) => {
    const merged = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) merged.delete(key);
      else merged.set(key, value);
    }
    router.replace(`/leasing?${merged.toString()}`, { scroll: false });
  };

  const filteredClients = useMemo(() => {
    const rows = clients.data ?? [];
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.fullNameOrCompany.toLowerCase().includes(needle) ||
        row.registrationNumber?.toLowerCase().includes(needle),
    );
  }, [clients.data, search]);

  const filteredContracts = useMemo(() => {
    const rows = contracts.data ?? [];
    if (!search) return rows;
    const needle = search.toLowerCase();
    return rows.filter(
      (row) =>
        row.referenceNumber.toLowerCase().includes(needle) ||
        row.clientName?.toLowerCase().includes(needle),
    );
  }, [contracts.data, search]);

  const clientColumns = useMemo<ColumnDef<Client, unknown>[]>(
    () => [
      {
        accessorKey: "fullNameOrCompany",
        header: "Client",
        cell: ({ row }) => <span className="font-medium">{row.original.fullNameOrCompany}</span>,
      },
      {
        accessorKey: "registrationNumber",
        header: "Immatriculation",
        cell: ({ row }) => (
          <span className="text-identifier text-muted-foreground">
            {row.original.registrationNumber ?? "—"}
          </span>
        ),
      },
      { accessorKey: "contactEmail", header: "E-mail" },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSheet({ kind: "client", value: row.original })}
            >
              Consulter
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Supprimer ${row.original.fullNameOrCompany}`}
              onClick={() => {
                const linked = (contracts.data ?? []).filter(
                  (c) => c.clientId === row.original.id,
                ).length;
                setConfirm({
                  kind: "clients",
                  id: row.original.id,
                  label: row.original.fullNameOrCompany,
                  // The backend performs no referential check, so the count
                  // is surfaced here rather than discovered afterwards.
                  detail: linked
                    ? `Ce client est lié à ${linked} contrat${linked > 1 ? "s" : ""}.`
                    : "Aucun contrat n'est rattaché à ce client.",
                });
              }}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [contracts.data],
  );

  const contractColumns = useMemo<ColumnDef<Contract, unknown>[]>(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Référence",
        cell: ({ row }) => (
          <span className="text-identifier">{row.original.referenceNumber}</span>
        ),
      },
      { accessorKey: "clientName", header: "Client" },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => <Chip>{statusLabel(row.original.status)}</Chip>,
      },
      {
        accessorKey: "vehicleVin",
        header: "Véhicule",
        cell: ({ row }) =>
          row.original.vehicleVin ? (
            <span className="text-identifier text-muted-foreground">
              {row.original.vehicleVin}
            </span>
          ) : (
            <span className="text-muted-foreground text-body-sm">Non lié</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSheet({ kind: "contract", value: row.original })}
            >
              Consulter
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Supprimer le contrat ${row.original.referenceNumber}`}
              onClick={() =>
                setConfirm({
                  kind: "contracts",
                  id: row.original.id,
                  label: row.original.referenceNumber,
                  detail: row.original.vehicleVin
                    ? "Un véhicule est rattaché à ce contrat."
                    : "Aucun véhicule n'est rattaché à ce contrat.",
                })
              }
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const query = tab === "clients" ? clients : contracts;
  if (query.isError) {
    return <ErrorState variant="page" error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="Clients & contrats"
        subtitle="Données de référence rattachées aux dossiers de recouvrement."
        actions={
          <Button
            onClick={() =>
              setSheet(
                tab === "clients"
                  ? { kind: "client", value: null }
                  : { kind: "contract", value: null },
              )
            }
          >
            <Plus aria-hidden />
            {tab === "clients" ? "Nouveau client" : "Nouveau contrat"}
          </Button>
        }
      />

      <div className="border-border mb-4 flex gap-1 border-b">
        {(
          [
            ["clients", "Clients"],
            ["contracts", "Contrats"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setParams({ tab: value === "clients" ? null : value })}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "text-body-sm focus-visible:focus-ring -mb-px rounded-t-md border-b-2 px-3 py-2 outline-none",
              tab === value
                ? "border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Input
        type="search"
        value={search}
        onChange={(event) => setParams({ q: event.target.value })}
        placeholder={tab === "clients" ? "Rechercher un client" : "Rechercher un contrat"}
        aria-label="Rechercher"
        className="mb-4 w-full sm:max-w-xs"
      />

      {deleteError ? <ErrorState error={new Error(deleteError)} className="mb-4" /> : null}

      {tab === "clients" ? (
        <DataTable
          columns={clientColumns}
          data={filteredClients}
          isPending={clients.isPending}
          empty={
            search ? (
              <NoResultsState onReset={() => setParams({ q: null })} />
            ) : (
              <NoDataState
                title="Aucun client enregistré"
                body="Ajoutez un client pour pouvoir créer des contrats et des dossiers."
                action={
                  <Button onClick={() => setSheet({ kind: "client", value: null })}>
                    <Plus aria-hidden />
                    Nouveau client
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <DataTable
          columns={contractColumns}
          data={filteredContracts}
          isPending={contracts.isPending}
          empty={
            search ? (
              <NoResultsState onReset={() => setParams({ q: null })} />
            ) : (
              <NoDataState
                title="Aucun contrat enregistré"
                body="Créez un contrat pour rattacher un véhicule et ouvrir un dossier."
                action={
                  <Button onClick={() => setSheet({ kind: "contract", value: null })}>
                    <Plus aria-hidden />
                    Nouveau contrat
                  </Button>
                }
              />
            )
          }
        />
      )}

      <Sheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-[560px]">
          {sheet?.kind === "client" ? (
            <ClientSheet client={sheet.value} onClose={() => setSheet(null)} />
          ) : sheet?.kind === "contract" ? (
            <ContractSheet contract={sheet.value} onClose={() => setSheet(null)} />
          ) : null}
        </SheetContent>
      </Sheet>

      {/* The one justified modal on this screen: a destructive confirmation. */}
      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer {confirm?.label} ?</DialogTitle>
            <DialogDescription>
              {confirm?.detail} Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Annuler</Button>} />
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirm) return;
                setDeleteError(null);
                const mutation = confirm.kind === "clients" ? deleteClient : deleteContract;
                mutation.mutate(confirm.id, {
                  onError: (cause) => setDeleteError(messageFor(cause)),
                  onSettled: () => setConfirm(null),
                });
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LeasingPage() {
  return (
    <Suspense fallback={null}>
      <LeasingRegistry />
    </Suspense>
  );
}
