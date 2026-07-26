"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { isApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";

/**
 * Login. Two audiences, one form.
 *
 * A drenched or dramatic entrance is the usual temptation here and is
 * refused: this is the first impression of a product whose personality is
 * composed, precise and institutional, and it uses the same vocabulary as
 * every screen behind it.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const schema = z.object({
  mode: z.enum(["tenant", "platform"]),
  email: z.string().min(1, "Adresse e-mail requise.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Mot de passe requis."),
  tenantId: z.string(),
}).refine((v) => v.mode === "platform" || UUID.test(v.tenantId.trim()), {
  path: ["tenantId"],
  message: "Identifiant de société invalide.",
});

type Values = z.infer<typeof schema>;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="type-body-sm text-destructive flex items-center gap-1.5">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [revealed, setRevealed] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    params.get("expired") ? "Votre session a expiré. Reconnectez-vous." : null,
  );
  const expired = Boolean(params.get("expired"));

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { mode: "tenant", email: "", password: "", tenantId: "" },
  });

  const mode = useWatch({ control: form.control, name: "mode" });
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: Values) => {
    setFormError(null);
    try {
      await api.post("/api/auth/login", {
        email: values.email.trim(),
        password: values.password,
        tenantId: values.mode === "platform" ? null : values.tenantId.trim(),
      });
      router.replace(values.mode === "platform" ? "/tenants" : "/cases");
    } catch (error) {
      setFormError(
        isApiError(error)
          ? error.message
          : "Connexion au serveur impossible. Réessayez dans un instant.",
      );
    }
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[400px] flex-col justify-center px-6 py-16">
      <div className="mb-6">
        <h1 className="type-display">LeasRecover</h1>
        <p className="type-body-sm text-muted-foreground mt-1">
          Plateforme de recouvrement
        </p>
      </div>

      <div className="bg-card border-border rounded-md border p-6">
        {/* A segmented control, not a switch: a switch asks the user to infer
            what the "on" position means. */}
        <div
          role="radiogroup"
          aria-label="Type de compte"
          className="bg-panel border-border mb-5 grid grid-cols-2 gap-1 rounded-md border p-1"
        >
          {(["tenant", "platform"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => form.setValue("mode", value)}
              className={cn(
                "type-label focus-visible:focus-ring h-8 rounded-sm outline-none transition-colors",
                mode === value
                  ? "bg-card text-foreground border-border border shadow-none"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              {value === "tenant" ? "Société" : "Plateforme"}
            </button>
          ))}
        </div>

        {formError ? (
          <div
            role="alert"
            className={cn(
              "type-body-sm mb-5 flex items-start gap-2 rounded-md border p-3",
              expired && !form.formState.isSubmitted
                ? "bg-warning-surface border-warning-border text-foreground"
                : "bg-destructive-surface border-destructive-border text-foreground",
            )}
          >
            <TriangleAlert
              className={cn(
                "mt-0.5 size-4 shrink-0",
                expired && !form.formState.isSubmitted
                  ? "text-warning"
                  : "text-destructive",
              )}
              aria-hidden
            />
            {formError}
          </div>
        ) : null}

        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse e-mail</Label>
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
            <Label htmlFor="password">Mot de passe</Label>
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
                aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
              <Label htmlFor="tenantId">Identifiant de société</Label>
              <Input
                id="tenantId"
                className="type-identifier"
                placeholder="00000000-0000-0000-0000-000000000000"
                aria-invalid={Boolean(form.formState.errors.tenantId)}
                aria-describedby="tenantId-hint tenantId-error"
                {...form.register("tenantId")}
              />
              <p id="tenantId-hint" className="type-caption text-muted-foreground">
                Fourni par votre administrateur.
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
            Se connecter
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
