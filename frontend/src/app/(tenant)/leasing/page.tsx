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
import { useTranslations } from "next-intl";
import { useFormat, useLabels } from "@/lib/use-format";
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
  const t = useTranslations("caseDetail.documents");
  const documents = useEntityDocuments(entityType, entityId);
  return (
    <DocumentList
      documents={documents.data ?? []}
      isPending={documents.isPending}
      downloadHref={(doc) => `/api/documents/${doc.id}/download`}
      emptyLabel={t("emptyEntity")}
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
  const t = useTranslations("leasing");
  const tRoot = useTranslations();
  const tCommon = useTranslations("common");
  const format = useFormat();
  const labels = useLabels();
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
    if (!form.fullNameOrCompany.trim()) return setError(t("nameRequired"));
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
          {isNew ? t("clientNew") : (client?.fullNameOrCompany ?? t("clientColumns.client"))}
        </SheetTitle>
        <SheetDescription>
          {isNew
            ? t("clientNewHint")
            : client?.registrationNumber || t("clientNoRegistration")}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-5 overflow-y-auto px-4">
        {error ? <ErrorState error={new Error(error)} /> : null}

        {showForm ? (
          <div className="space-y-4">
            {(
              [
                ["fullNameOrCompany", "caseDetail.client.name", "text"],
                ["registrationNumber", "caseDetail.client.registration", "text"],
                ["contactEmail", "caseDetail.client.email", "email"],
                ["contactPhone", "caseDetail.client.phone", "tel"],
                ["address", "caseDetail.client.address", "text"],
              ] as const
            ).map(([key, labelKey, type]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`client-${key}`}>{tRoot(labelKey)}</Label>
                <Input
                  id={`client-${key}`}
                  type={type}
                  className={key === "registrationNumber" ? "type-identifier" : undefined}
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
                { label: tRoot("caseDetail.client.email"), value: client?.contactEmail },
                { label: tRoot("caseDetail.client.phone"), value: client?.contactPhone },
                { label: tRoot("caseDetail.client.address"), value: client?.address },
                { label: t("createdOn"), value: format.date(client?.createdAt) },
              ]}
            />

            <Panel title={t("contractsCount", { count: linked.length })}>
              {linked.length ? (
                <ul className="divide-border divide-y">
                  {linked.map((contract) => (
                    <li key={contract.id} className="flex items-center gap-3 py-2.5">
                      <span className="type-identifier flex-1 truncate">
                        {contract.referenceNumber}
                      </span>
                      <Chip>{labels.status(contract.status)}</Chip>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="type-body-sm text-muted-foreground">{t("noContracts")}</p>
              )}
            </Panel>

            {client ? (
              <Panel title={t("documents")}>
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
              {tCommon("cancel")}
            </Button>
            <Button onClick={() => void submit()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {tCommon("save")}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            {tCommon("edit")}
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
  const t = useTranslations("leasing");
  const tRoot = useTranslations();
  const tCommon = useTranslations("common");
  const labels = useLabels();
  const format = useFormat();
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
    if (!form.referenceNumber.trim()) return setError(t("referenceRequired"));
    if (!form.clientId) return setError(t("clientRequired"));
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      return setError(t("endAfterStart"));
    }
    try {
      await save.mutateAsync({
        id: contract?.id,
        ...form,
        startDate: form.startDate
          ? form.startDate.includes("T")
            ? form.startDate
            : `${form.startDate}T00:00:00Z`
          : null,
        endDate: form.endDate
          ? form.endDate.includes("T")
            ? form.endDate
            : `${form.endDate}T00:00:00Z`
          : null,
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
          {isNew ? t("contractNew") : (contract?.referenceNumber ?? tRoot("caseDetail.contract.title"))}
        </SheetTitle>
        <SheetDescription>{contract?.clientName ?? t("contractNewHint")}</SheetDescription>
      </SheetHeader>

      <div className="space-y-5 overflow-y-auto px-4">
        {error ? <ErrorState error={new Error(error)} /> : null}

        {showForm ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="contract-client">{t("contractColumns.client")}</Label>
              <select
                id="contract-client"
                value={form.clientId}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, clientId: event.target.value }))
                }
                className="border-input bg-card type-body focus-visible:focus-ring h-9 w-full rounded-md border px-3 outline-none"
              >
                <option value="">{t("selectClient")}</option>
                {(clients.data ?? []).map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullNameOrCompany}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contract-reference">{t("contractColumns.reference")}</Label>
              <Input
                id="contract-reference"
                className="type-identifier"
                value={form.referenceNumber}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, referenceNumber: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="contract-start">{tRoot("caseDetail.contract.startDate")}</Label>
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
                <Label htmlFor="contract-end">{tRoot("caseDetail.contract.endDate")}</Label>
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
                { label: t("contractColumns.client"), value: contract?.clientName },
                { label: t("contractColumns.status"), value: labels.status(contract?.status) },
                { label: tRoot("caseDetail.contract.startDate"), value: format.date(contract?.startDate) },
                { label: tRoot("caseDetail.contract.endDate"), value: format.date(contract?.endDate) },
              ]}
            />

            {contract ? (
              <>
                {/* Inline, not a modal stacked on this sheet. */}
                <Panel title={tRoot("caseDetail.vehicle.title")}>
                  <VehicleForm contract={contract} />
                </Panel>

                <Panel title={t("contractDocuments")}>
                  <EntityDocuments entityType="contract" entityId={contract.id} />
                </Panel>

                {contract.vehicleId ? (
                  <Panel title={t("vehicleDocuments")}>
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
              {tCommon("cancel")}
            </Button>
            <Button onClick={() => void submit()} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {tCommon("save")}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            {tCommon("edit")}
          </Button>
        )}
      </SheetFooter>
    </>
  );
}

function LeasingRegistry() {
  const t = useTranslations("leasing");
  const tCommon = useTranslations("common");
  const labels = useLabels();
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
        header: t("clientColumns.client"),
        cell: ({ row }) => <span className="font-medium">{row.original.fullNameOrCompany}</span>,
      },
      {
        accessorKey: "registrationNumber",
        header: t("clientColumns.registration"),
        cell: ({ row }) => (
          <span className="type-identifier text-muted-foreground">
            {row.original.registrationNumber ?? "—"}
          </span>
        ),
      },
      { accessorKey: "contactEmail", header: t("clientColumns.email") },
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
              {tCommon("open")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("deleteClientAria", { name: row.original.fullNameOrCompany })}
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
                    ? t("deleteClientLinked", { count: linked })
                    : t("deleteClientNone"),
                });
              }}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [contracts.data, t, tCommon],
  );

  const contractColumns = useMemo<ColumnDef<Contract, unknown>[]>(
    () => [
      {
        accessorKey: "referenceNumber",
        header: "Référence",
        cell: ({ row }) => (
          <span className="type-identifier">{row.original.referenceNumber}</span>
        ),
      },
      { accessorKey: "clientName", header: t("contractColumns.client") },
      {
        accessorKey: "status",
        header: t("contractColumns.status"),
        cell: ({ row }) => <Chip>{labels.status(row.original.status)}</Chip>,
      },
      {
        accessorKey: "vehicleVin",
        header: t("contractColumns.vehicle"),
        cell: ({ row }) =>
          row.original.vehicleVin ? (
            <span className="type-identifier text-muted-foreground">
              {row.original.vehicleVin}
            </span>
          ) : (
            <span className="text-muted-foreground type-body-sm">{t("vehicleNotLinked")}</span>
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
              {tCommon("open")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("deleteContractAria", { reference: row.original.referenceNumber })}
              onClick={() =>
                setConfirm({
                  kind: "contracts",
                  id: row.original.id,
                  label: row.original.referenceNumber,
                  detail: row.original.vehicleVin
                    ? t("deleteContractVehicle")
                    : t("deleteContractNone"),
                })
              }
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [t, tCommon, labels],
  );

  const query = tab === "clients" ? clients : contracts;
  if (query.isError) {
    return <ErrorState variant="page" error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
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
            {tab === "clients" ? t("newClient") : t("newContract")}
          </Button>
        }
      />

      <div className="border-border mb-4 flex gap-1 border-b">
        {(
          [
            ["clients", "tabs.clients"],
            ["contracts", "tabs.contracts"],
          ] as const
        ).map(([value, labelKey]) => (
          <button
            key={value}
            type="button"
            onClick={() => setParams({ tab: value === "clients" ? null : value })}
            aria-current={tab === value ? "page" : undefined}
            className={cn(
              "type-body-sm focus-visible:focus-ring -mb-px rounded-t-md border-b-2 px-3 py-2 outline-none",
              tab === value
                ? "border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <Input
        type="search"
        value={search}
        onChange={(event) => setParams({ q: event.target.value })}
        placeholder={tab === "clients" ? t("searchClient") : t("searchContract")}
        aria-label={tCommon("search")}
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
                title={t("clientsEmptyTitle")}
                body={t("clientsEmptyBody")}
                action={
                  <Button onClick={() => setSheet({ kind: "client", value: null })}>
                    <Plus aria-hidden />
                    {t("newClient")}
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
                title={t("contractsEmptyTitle")}
                body={t("contractsEmptyBody")}
                action={
                  <Button onClick={() => setSheet({ kind: "contract", value: null })}>
                    <Plus aria-hidden />
                    {t("newContract")}
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
            <DialogTitle>{t("deleteTitle", { name: confirm?.label ?? "" })}</DialogTitle>
            <DialogDescription>
              {confirm?.detail} {tCommon("irreversible")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">{tCommon("cancel")}</Button>} />
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
              {tCommon("delete")}
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
