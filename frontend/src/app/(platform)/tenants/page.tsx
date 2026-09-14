"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, Copy, Loader2, Plus, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, chipIcons } from "@/components/ui/chip";
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
import { NumericInput } from "@/components/ui/numeric-input";
import { PageHeader } from "@/components/states/page-header";
import { DataTable } from "@/components/states/data-table";
import { NoDataState } from "@/components/states/empty-state";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { useActivateTenant, useDeactivateTenant, useProvisionTenant, useTenants } from "@/lib/query/hooks";
import { useTranslations } from "next-intl";
import { initials } from "@/lib/format";
import { useFormat, useLabels } from "@/lib/use-format";
import type { Tenant } from "@/types/api";

/**
 * Platform administration: provision and deactivate leasing companies.
 */

const MIN_PASSWORD = 12;

function CopyField({ label, value }: { label: string; value: string }) {
  const t = useTranslations("tenants");
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="type-label text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="type-identifier bg-background border-border min-w-0 flex-1 truncate rounded-sm border px-2 py-1.5">
          {value}
        </code>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("copy", { label })}
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        </Button>
      </div>
    </div>
  );
}

interface Handoff {
  tenantId: string;
  name: string;
  adminEmail: string;
  adminPassword: string;
}

function randomPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function ProvisionForm({ onProvisioned }: { onProvisioned: (handoff: Handoff) => void }) {
  const t = useTranslations("tenants");
  const tCommon = useTranslations("common");
  const provision = useProvisionTenant();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [retention, setRetention] = useState<number | null>(24);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError(t("nameRequired"));
    if (!/^\S+@\S+\.\S+$/.test(adminEmail.trim())) {
      return setError(t("emailInvalid"));
    }
    // The backend applies NO password rule here at all, though it requires
    // eight characters everywhere else. Twelve is enforced at the edge.
    if (adminPassword.length < MIN_PASSWORD) {
      return setError(t("passwordTooShort", { min: MIN_PASSWORD }));
    }

    try {
      const created = (await provision.mutateAsync({
        name: name.trim(),
        logoUrl: logoUrl.trim() || null,
        dataRetentionMonths: retention ?? 24,
        adminEmail: adminEmail.trim(),
        adminPassword,
      })) as Tenant;

      onProvisioned({
        tenantId: created.id,
        name: created.name,
        adminEmail: adminEmail.trim(),
        adminPassword,
      });
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{t("new")}</SheetTitle>
        <SheetDescription>
          {t("provisionHint")}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 overflow-y-auto px-4">
        {error ? <ErrorState error={new Error(error)} /> : null}

        <fieldset className="space-y-4">
          <legend className="type-label text-muted-foreground mb-2">{t("companySection")}</legend>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-name">{t("name")}</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenant-logo">{t("logoUrl")}</Label>
            <Input
              id="tenant-logo"
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
            />
          </div>
          <div className="max-w-[220px] space-y-1.5">
            <Label htmlFor="tenant-retention">{t("retention")}</Label>
            <NumericInput
              id="tenant-retention"
              integer
              suffix={tCommon("months")}
              value={retention}
              onValueChange={setRetention}
              min={1}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="type-label text-muted-foreground mb-2">
            {t("adminSection")}
          </legend>
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">{t("adminEmail")}</Label>
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">{t("adminPassword")}</Label>
            <div className="flex gap-2">
              <Input
                id="admin-password"
                className="type-identifier"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                aria-describedby="admin-password-hint"
              />
              <Button
                variant="outline"
                size="icon"
                aria-label={t("generatePassword")}
                onClick={() => setAdminPassword(randomPassword())}
              >
                <RefreshCw aria-hidden />
              </Button>
            </div>
            <p id="admin-password-hint" className="type-caption text-muted-foreground">
              {t("passwordHint", { min: MIN_PASSWORD })}
            </p>
          </div>
        </fieldset>
      </div>

      <SheetFooter>
        <Button onClick={() => void submit()} disabled={provision.isPending}>
          {provision.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {t("provision")}
        </Button>
      </SheetFooter>
    </>
  );
}

/**
 * The credential handoff.
 *
 * Provisioning an account whose password is then unrecoverable — and this
 * product has no password reset endpoint — would be a real operational trap.
 * So the sheet does not simply close: it becomes a summary requiring explicit
 * acknowledgement that the credentials were passed on.
 */
function HandoffPanel({ handoff, onDone }: { handoff: Handoff; onDone: () => void }) {
  const t = useTranslations("tenants");
  return (
    <>
      <SheetHeader>
        <SheetTitle>{t("handoffTitle", { name: handoff.name })}</SheetTitle>
        <SheetDescription>
          {t("handoffHint")}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4 overflow-y-auto px-4">
        <div className="bg-warning-surface border-warning-border rounded-md border p-3">
          <p className="type-body-sm">{t("handoffWarning")}</p>
        </div>

        <CopyField label={t("handoffTenantId")} value={handoff.tenantId} />
        <CopyField label={t("adminEmail")} value={handoff.adminEmail} />
        <CopyField label={t("adminPassword")} value={handoff.adminPassword} />

        <p className="type-caption text-muted-foreground">
          {t("handoffNote")}
        </p>
      </div>

      <SheetFooter>
        <Button onClick={onDone}>{t("handoffDone")}</Button>
      </SheetFooter>
    </>
  );
}

export default function TenantsPage() {
  const t = useTranslations("tenants");
  const tCommon = useTranslations("common");
  const format = useFormat();
  const labels = useLabels();
  const tenants = useTenants();
  const deactivate = useDeactivateTenant();
  const activate = useActivateTenant();

  const [open, setOpen] = useState(false);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [confirm, setConfirm] = useState<{ tenant: Tenant; action: "activate" | "deactivate" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("columns.company"),
        cell: ({ row }) => (
          <span className="flex items-center gap-2.5">
            {row.original.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.logoUrl}
                alt=""
                className="border-border size-6 shrink-0 rounded-sm border object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="bg-panel border-border type-caption grid size-6 shrink-0 place-items-center rounded-sm border font-semibold"
              >
                {initials(row.original.name)}
              </span>
            )}
            <span className="truncate font-medium">{row.original.name}</span>
          </span>
        ),
      },
      {
        accessorKey: "id",
        header: t("columns.identifier"),
        cell: ({ row }) => (
          // The UUID tenant users must type at login. Copyable, because the
          // alternative is transcribing it by hand.
          <CopyField label={t("columns.identifier")} value={row.original.id} />
        ),
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        cell: ({ row }) =>
          row.original.status === "ACTIVE" ? (
            <Chip tone="success" icon={chipIcons.success}>
              {t("active")}
            </Chip>
          ) : (
            <Chip>{labels.status(row.original.status)}</Chip>
          ),
      },
      {
        accessorKey: "createdAt",
        header: t("columns.createdAt"),
        cell: ({ row }) => (
          <span className="type-body-sm text-muted-foreground">
            {format.date(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.status === "ACTIVE" ? (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirm({ tenant: row.original, action: "deactivate" })}
              >
                <ShieldOff aria-hidden />
                {t("deactivate")}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
                onClick={() => setConfirm({ tenant: row.original, action: "activate" })}
              >
                <ShieldCheck aria-hidden />
                {t("activate")}
              </Button>
            </div>
          ),
      },
    ],
    [t, format, labels],
  );

  if (tenants.isError) {
    return (
      <ErrorState variant="page" error={tenants.error} onRetry={() => void tenants.refetch()} />
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden />
            {t("new")}
          </Button>
        }
      />

      {error ? <ErrorState error={new Error(error)} className="mb-4" /> : null}

      <DataTable
        columns={columns}
        data={tenants.data ?? []}
        isPending={tenants.isPending}
        empty={
          <NoDataState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus aria-hidden />
                {t("new")}
              </Button>
            }
          />
        }
      />

      <Sheet
        open={open}
        onOpenChange={(next) => {
          // Cannot be dismissed while credentials are pending handoff.
          if (!next && handoff) return;
          setOpen(next);
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-[560px]">
          {handoff ? (
            <HandoffPanel
              handoff={handoff}
              onDone={() => {
                setHandoff(null);
                setOpen(false);
              }}
            />
          ) : open ? (
            <ProvisionForm onProvisioned={setHandoff} />
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={confirm !== null} onOpenChange={(next) => !next && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === "activate"
                ? t("activateTitle", { name: confirm?.tenant.name ?? "" })
                : t("deactivateTitle", { name: confirm?.tenant.name ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {confirm?.action === "activate" ? t("activateBody") : t("deactivateBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">{tCommon("cancel")}</Button>} />
            <Button
              variant={confirm?.action === "activate" ? "default" : "destructive"}
              disabled={deactivate.isPending || activate.isPending}
              onClick={() => {
                if (!confirm) return;
                setError(null);
                const mutation = confirm.action === "activate" ? activate : deactivate;
                mutation.mutate(confirm.tenant.id, {
                  onError: (cause) => setError(messageFor(cause)),
                  onSettled: () => setConfirm(null),
                });
              }}
            >
              {confirm?.action === "activate"
                ? (activate.isPending ? <Loader2 className="animate-spin" aria-hidden /> : t("activate"))
                : (deactivate.isPending ? <Loader2 className="animate-spin" aria-hidden /> : t("deactivate"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
