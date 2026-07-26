"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/states/panel";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { useTenant, useUpdateBranding } from "@/lib/query/hooks";
import { initials } from "@/lib/format";

/**
 * Branding. Two fields and a live preview.
 *
 * The preview is the point: a logo URL field with no preview is a guess. It
 * renders at the sidebar's real size on the sidebar's real surface.
 */
export default function BrandingPage() {
  const tenant = useTenant();
  const update = useUpdateBranding();

  const [draft, setDraft] = useState<{ name: string; logoUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (tenant.isPending) {
    return (
      <div className="max-w-[560px] space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (tenant.isError) {
    return (
      <ErrorState variant="page" error={tenant.error} onRetry={() => void tenant.refetch()} />
    );
  }

  const current = { name: tenant.data?.name ?? "", logoUrl: tenant.data?.logoUrl ?? "" };
  const value = draft ?? current;
  const dirty = draft !== null && (draft.name !== current.name || draft.logoUrl !== current.logoUrl);

  const set = (patch: Partial<typeof current>) => {
    setSaved(false);
    setDraft({ ...value, ...patch });
    if (patch.logoUrl !== undefined) setImageFailed(false);
  };

  const submit = async () => {
    setError(null);
    if (!value.name.trim()) return setError("Le nom de la société est requis.");
    if (value.logoUrl && !/^https?:\/\/\S+$/i.test(value.logoUrl.trim())) {
      return setError("L'URL du logo doit commencer par http:// ou https://.");
    }
    try {
      await update.mutateAsync({ name: value.name.trim(), logoUrl: value.logoUrl.trim() });
      setDraft(null);
      setSaved(true);
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  return (
    <div className="max-w-[560px] space-y-5">
      <Panel title="Identité de la société">
        <div className="space-y-4">
          {error ? <ErrorState error={new Error(error)} /> : null}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nom de la société</Label>
            <Input
              id="name"
              value={value.name}
              onChange={(event) => set({ name: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">URL du logo</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://exemple.com/logo.svg"
              value={value.logoUrl}
              onChange={(event) => set({ logoUrl: event.target.value })}
            />
            <p className="type-caption text-muted-foreground">
              Affiché dans la barre latérale. Format carré recommandé.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Aperçu">
        <div className="bg-sidebar border-sidebar-border rounded-md border p-3">
          <div className="flex items-center gap-2.5">
            {value.logoUrl && !imageFailed ? (
              // Arbitrary tenant-supplied host: next/image would require a
              // per-tenant remote pattern allowlist, which is not knowable here.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.logoUrl}
                alt=""
                onError={() => setImageFailed(true)}
                className="border-border size-7 shrink-0 rounded-sm border object-contain"
              />
            ) : (
              <span
                aria-hidden
                className="bg-primary text-primary-foreground type-caption grid size-7 shrink-0 place-items-center rounded-sm font-semibold"
              >
                {initials(value.name || "LeasRecover")}
              </span>
            )}
            <span className="type-title truncate">{value.name || "LeasRecover"}</span>
          </div>
        </div>
        {imageFailed ? (
          <p className="type-body-sm text-warning mt-2">
            L&apos;image n&apos;a pas pu être chargée. Les initiales seront utilisées.
          </p>
        ) : null}
      </Panel>

      <div className="flex items-center justify-end gap-3">
        {dirty ? (
          <span className="type-body-sm text-muted-foreground">
            Modifications non enregistrées
          </span>
        ) : saved ? (
          <span className="type-body-sm text-success" role="status">
            Enregistré
          </span>
        ) : null}
        <Button onClick={() => void submit()} disabled={!dirty || update.isPending}>
          {update.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
