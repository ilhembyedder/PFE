"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Copy,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  Users,
} from "lucide-react";
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
import { DataTable } from "@/components/states/data-table";
import { NoDataState } from "@/components/states/empty-state";
import { ErrorState, messageFor } from "@/components/states/error-state";
import {
  useCreateUser,
  useDeactivateUser,
  useSession,
  useUpdateUser,
  useUsers,
} from "@/lib/query/hooks";
import { useTranslations } from "next-intl";
import { initials } from "@/lib/format";
import { useFormat } from "@/lib/use-format";
import type { TenantUser } from "@/types/api";

const MIN_PASSWORD = 8;

function randomPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export default function UsersSettingsPage() {
  const t = useTranslations("settings.users");
  const tCommon = useTranslations("common");
  const format = useFormat();
  const session = useSession();

  const users = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();

  // Create sheet state
  const [createOpen, setCreateOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "GESTIONNAIRE">("GESTIONNAIRE");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Edit sheet state
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState<"ADMIN" | "GESTIONNAIRE">("GESTIONNAIRE");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate / activate confirm dialog state
  const [confirm, setConfirm] = useState<{
    user: TenantUser;
    action: "activate" | "deactivate";
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const resetCreateForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("GESTIONNAIRE");
    setPassword("");
    setFormError(null);
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!firstName.trim()) return setFormError(t("firstNameRequired"));
    if (!lastName.trim()) return setFormError(t("lastNameRequired"));
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setFormError(t("emailInvalid"));
    }
    if (password.length < MIN_PASSWORD) {
      return setFormError(t("passwordTooShort", { min: MIN_PASSWORD }));
    }

    try {
      await createUser.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
        password,
      });
      resetCreateForm();
      setCreateOpen(false);
    } catch (cause) {
      setFormError(messageFor(cause));
    }
  };

  const openEdit = (user: TenantUser) => {
    setEditingUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditError(null);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setEditError(null);
    if (!editFirstName.trim()) return setEditError(t("firstNameRequired"));
    if (!editLastName.trim()) return setEditError(t("lastNameRequired"));

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        role: editRole,
        status: editStatus,
      });
      setEditingUser(null);
    } catch (cause) {
      setEditError(messageFor(cause));
    }
  };

  const columns = useMemo<ColumnDef<TenantUser, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("columns.user"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="bg-panel border-border type-caption grid size-7 shrink-0 place-items-center rounded-full border font-semibold"
            >
              {initials(`${row.original.firstName} ${row.original.lastName}`)}
            </span>
            <div className="min-w-0">
              <span className="type-body font-medium block truncate">
                {row.original.firstName} {row.original.lastName}
              </span>
              <span className="type-caption text-muted-foreground block truncate">
                {row.original.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: t("columns.role"),
        cell: ({ row }) =>
          row.original.role === "ADMIN" ? (
            <Chip tone="accent">{t("roleAdmin")}</Chip>
          ) : (
            <Chip tone="neutral">{t("roleGestionnaire")}</Chip>
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
            <Chip tone="neutral" icon={chipIcons.dormant}>
              {t("inactive")}
            </Chip>
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
        cell: ({ row }) => {
          const isCurrentSession = session.data?.userId === row.original.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEdit(row.original)}
              >
                <Edit2 aria-hidden />
                {t("edit")}
              </Button>

              {row.original.status === "ACTIVE" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isCurrentSession}
                  onClick={() =>
                    setConfirm({ user: row.original, action: "deactivate" })
                  }
                  title={isCurrentSession ? "Vous ne pouvez pas désactiver votre propre compte" : undefined}
                >
                  <ShieldOff aria-hidden />
                  {t("deactivate")}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary"
                  onClick={() =>
                    setConfirm({ user: row.original, action: "activate" })
                  }
                >
                  <ShieldCheck aria-hidden />
                  {t("activate")}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t, format, session.data?.userId],
  );

  if (users.isError) {
    return (
      <ErrorState
        variant="page"
        error={users.error}
        onRetry={() => void users.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="type-title">{t("title")}</h2>
          <p className="type-body-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden />
          {t("newUser")}
        </Button>
      </div>

      {actionError ? <ErrorState error={new Error(actionError)} className="mb-4" /> : null}

      <DataTable
        columns={columns}
        data={users.data ?? []}
        isPending={users.isPending}
        empty={
          <NoDataState
            title={t("emptyTitle")}
            body={t("emptyBody")}
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden />
                {t("newUser")}
              </Button>
            }
          />
        }
      />

      {/* Sheet: Nouveau collaborateur */}
      <Sheet
        open={createOpen}
        onOpenChange={(next) => {
          if (!next) resetCreateForm();
          setCreateOpen(next);
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>{t("createTitle")}</SheetTitle>
            <SheetDescription>{t("createHint")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 overflow-y-auto px-4">
            {formError ? <ErrorState error={new Error(formError)} /> : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="create-firstname">{t("firstName")}</Label>
                <Input
                  id="create-firstname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-lastname">{t("lastName")}</Label>
                <Input
                  id="create-lastname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email">{t("email")}</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("role")}</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRole("GESTIONNAIRE")}
                  className={`border-border flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors ${
                    role === "GESTIONNAIRE"
                      ? "border-primary bg-sidebar-accent"
                      : "hover:bg-card"
                  }`}
                >
                  <span className="type-label font-medium">{t("roleGestionnaire")}</span>
                  <span className="type-caption text-muted-foreground">{t("roleGestionnaireHint")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`border-border flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors ${
                    role === "ADMIN"
                      ? "border-primary bg-sidebar-accent"
                      : "hover:bg-card"
                  }`}
                >
                  <span className="type-label font-medium">{t("roleAdmin")}</span>
                  <span className="type-caption text-muted-foreground">{t("roleAdminHint")}</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-password">{t("password")}</Label>
              <div className="flex gap-2">
                <Input
                  id="create-password"
                  className="type-identifier"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t("generatePassword")}
                  onClick={() => setPassword(randomPassword())}
                >
                  <RefreshCw aria-hidden />
                </Button>
              </div>
              <p className="type-caption text-muted-foreground">
                {t("passwordHint", { min: MIN_PASSWORD })}
              </p>
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={() => void handleCreate()}
              disabled={createUser.isPending}
            >
              {createUser.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              {t("create")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet: Modifier un collaborateur */}
      <Sheet
        open={editingUser !== null}
        onOpenChange={(next) => {
          if (!next) setEditingUser(null);
        }}
      >
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {t("editTitle", {
                name: editingUser
                  ? `${editingUser.firstName} ${editingUser.lastName}`
                  : "",
              })}
            </SheetTitle>
            <SheetDescription>{t("editHint")}</SheetDescription>
          </SheetHeader>

          <div className="space-y-5 overflow-y-auto px-4">
            {editError ? <ErrorState error={new Error(editError)} /> : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-firstname">{t("firstName")}</Label>
                <Input
                  id="edit-firstname"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lastname">{t("lastName")}</Label>
                <Input
                  id="edit-lastname"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("email")}</Label>
              <Input value={editingUser?.email ?? ""} disabled className="opacity-70" />
            </div>

            <div className="space-y-2">
              <Label>{t("role")}</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditRole("GESTIONNAIRE")}
                  className={`border-border flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors ${
                    editRole === "GESTIONNAIRE"
                      ? "border-primary bg-sidebar-accent"
                      : "hover:bg-card"
                  }`}
                >
                  <span className="type-label font-medium">{t("roleGestionnaire")}</span>
                  <span className="type-caption text-muted-foreground">{t("roleGestionnaireHint")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditRole("ADMIN")}
                  className={`border-border flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors ${
                    editRole === "ADMIN"
                      ? "border-primary bg-sidebar-accent"
                      : "hover:bg-card"
                  }`}
                >
                  <span className="type-label font-medium">{t("roleAdmin")}</span>
                  <span className="type-caption text-muted-foreground">{t("roleAdminHint")}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("columns.status")}</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditStatus("ACTIVE")}
                  className={`border-border flex items-center justify-center gap-2 rounded-md border p-3 text-center transition-colors ${
                    editStatus === "ACTIVE"
                      ? "border-primary bg-sidebar-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-card"
                  }`}
                >
                  <ShieldCheck className="size-4 text-success" />
                  {t("active")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditStatus("INACTIVE")}
                  className={`border-border flex items-center justify-center gap-2 rounded-md border p-3 text-center transition-colors ${
                    editStatus === "INACTIVE"
                      ? "border-primary bg-sidebar-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-card"
                  }`}
                >
                  <ShieldOff className="size-4" />
                  {t("inactive")}
                </button>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button
              onClick={() => void handleUpdate()}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              {t("save")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog: Confirmation désactivation / réactivation */}
      <Dialog
        open={confirm !== null}
        onOpenChange={(next) => !next && setConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === "activate"
                ? t("activateTitle", {
                    name: `${confirm.user.firstName} ${confirm.user.lastName}`,
                  })
                : t("deactivateTitle", {
                    name: confirm
                      ? `${confirm.user.firstName} ${confirm.user.lastName}`
                      : "",
                  })}
            </DialogTitle>
            <DialogDescription>
              {confirm?.action === "activate"
                ? t("activateBody")
                : t("deactivateBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">{tCommon("cancel")}</Button>} />
            <Button
              variant={confirm?.action === "activate" ? "default" : "destructive"}
              disabled={deactivateUser.isPending || updateUser.isPending}
              onClick={async () => {
                if (!confirm) return;
                setActionError(null);
                try {
                  if (confirm.action === "deactivate") {
                    await deactivateUser.mutateAsync(confirm.user.id);
                  } else {
                    await updateUser.mutateAsync({
                      id: confirm.user.id,
                      firstName: confirm.user.firstName,
                      lastName: confirm.user.lastName,
                      role: confirm.user.role,
                      status: "ACTIVE",
                    });
                  }
                  setConfirm(null);
                } catch (cause) {
                  setActionError(messageFor(cause));
                  setConfirm(null);
                }
              }}
            >
              {confirm?.action === "activate"
                ? (updateUser.isPending ? <Loader2 className="animate-spin" aria-hidden /> : t("activate"))
                : (deactivateUser.isPending ? <Loader2 className="animate-spin" aria-hidden /> : t("deactivate"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
