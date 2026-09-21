"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ArrowRight, Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/api-error";

/**
 * Login. Two audiences, two screens, one form.
 *
 * `/login` is for company users and asks for the company identifier;
 * `/login/platform` is for platform administrators and does not. The mode
 * is fixed by the URL rather than chosen in the form, so each screen can be
 * linked to and bookmarked on its own.
 *
 * A drenched or dramatic entrance is the usual temptation here and is
 * refused: this is the first impression of a product whose personality is
 * composed, precise and institutional, and it uses the same vocabulary as
 * every screen behind it.
 */

export type LoginMode = "tenant" | "platform";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validation messages are message KEYS, resolved at render.
 * Building the schema per-locale would rebuild the resolver on every language
 * change; keys keep the schema static and the errors translated.
 */
const base = {
  email: z.string().min(1, "emailRequired").email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
};

const tenantSchema = z.object({
  ...base,
  tenantId: z.string().refine((v) => UUID.test(v.trim()), "tenantIdInvalid"),
});

const platformSchema = z.object({ ...base, tenantId: z.string() });

type Values = z.infer<typeof tenantSchema>;

const SWITCH: Record<LoginMode, { href: string; label: string }> = {
  tenant: { href: "/login/platform", label: "switchToPlatform" },
  platform: { href: "/login", label: "switchToTenant" },
};

function FieldError({ id, message }: { id: string; message?: string }) {
  const t = useTranslations("login");
  if (!message) return null;
  return (
    <p id={id} className="type-body-sm text-destructive flex items-center gap-1.5">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
      {t(message)}
    </p>
  );
}

/**
 * Only this reads the query string, so only this needs a Suspense boundary.
 * Wrapping the whole form meant the page server-rendered as blank.
 */
function ExpiredNotice() {
  const t = useTranslations("login");
  const params = useSearchParams();
  if (!params.get("expired")) return null;
  return (
    <div
      role="status"
      className="bg-warning-surface border-warning-border type-body-sm mb-5 flex items-start gap-2 rounded-md border p-3"
    >
      <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
      {t("expired")}
    </div>
  );
}

export function LoginForm({ mode }: { mode: LoginMode }) {
  const t = useTranslations("login");
  const tApp = useTranslations("app");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [revealed, setRevealed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(mode === "platform" ? platformSchema : tenantSchema),
    defaultValues: { email: "", password: "", tenantId: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: Values) => {
    setFormError(null);
    try {
      await api.post("/api/auth/login", {
        email: values.email.trim(),
        password: values.password,
        tenantId: mode === "platform" ? null : values.tenantId.trim(),
      });
      queryClient.clear();
      router.replace(mode === "platform" ? "/tenants" : "/cases");
      router.refresh();
    } catch (error) {
      setFormError(isApiError(error) ? error.message : t("unreachable"));
    }
  };

  const other = SWITCH[mode];

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[400px] flex-col justify-center px-6 py-16">
      <div className="mb-6">
        <h1 className="type-display">{tApp("name")}</h1>
        <p className="type-body-sm text-muted-foreground mt-1">
          {tApp("tagline")}
        </p>
      </div>

      <div className="bg-card border-border rounded-md border p-6">
        <h2 className="type-title mb-5">
          {t(mode === "platform" ? "platformTitle" : "tenantTitle")}
        </h2>

        <Suspense fallback={null}>
          <ExpiredNotice />
        </Suspense>

        {formError ? (
          <div
            role="alert"
            className="bg-destructive-surface border-destructive-border text-foreground type-body-sm mb-5 flex items-start gap-2 rounded-md border p-3"
          >
            <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
            {formError}
          </div>
        ) : null}

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.email)}
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
              {...form.register("email")}
            />
            <FieldError id="email-error" message={form.formState.errors.email?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={revealed ? "text" : "password"}
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={Boolean(form.formState.errors.password)}
                aria-describedby={
                  form.formState.errors.password ? "password-error" : undefined
                }
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={t(revealed ? "hidePassword" : "showPassword")}
                aria-pressed={revealed}
                className="text-muted-foreground hover:text-foreground focus-visible:focus-ring absolute inset-y-0 right-0 grid w-10 place-items-center rounded-md outline-none [&_svg]:size-4"
              >
                {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              </button>
            </div>
            <FieldError
              id="password-error"
              message={form.formState.errors.password?.message}
            />
          </div>

          {mode === "tenant" ? (
            <div className="space-y-1.5">
              <Label htmlFor="tenantId">{t("tenantId")}</Label>
              <Input
                id="tenantId"
                className="type-identifier"
                placeholder="00000000-0000-0000-0000-000000000000"
                aria-invalid={Boolean(form.formState.errors.tenantId)}
                aria-describedby="tenantId-hint tenantId-error"
                {...form.register("tenantId")}
              />
              <p id="tenantId-hint" className="type-caption text-muted-foreground">
                {t("tenantIdHint")}
              </p>
              <FieldError
                id="tenantId-error"
                message={form.formState.errors.tenantId?.message}
              />
            </div>
          ) : null}

          {/* Never disabled pending validation: validate on submit. */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {t("submit")}
          </Button>
        </form>
      </div>

      {/* The other audience's entrance, kept out of the card: it is a way
          out, not part of this form. */}
      <p className="type-body-sm text-muted-foreground mt-5 text-center">
        <Link
          href={other.href}
          className="hover:text-foreground focus-visible:focus-ring inline-flex items-center gap-1 rounded-sm outline-none underline-offset-4 hover:underline"
        >
          {t(other.label)}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </p>
    </main>
  );
}
