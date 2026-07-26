"use client";

"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/api-error";
import { cn } from "@/lib/utils";

/**
 * Every failure states its specific cause and offers a next step.
 * PRODUCT.md prohibits "Quelque chose a mal tourné".
 */

/** Falls back to a generic key only when the error carries no message. */
export function messageFor(error: unknown): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "";
}

export function ErrorState({
  error,
  onRetry,
  variant = "inline",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  variant?: "inline" | "page";
  className?: string;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");
  const message = messageFor(error) || t("generic");

  if (variant === "page") {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center px-6 py-20 text-center",
          className,
        )}
      >
        <TriangleAlert className="text-destructive mb-4 size-6" aria-hidden />
        <p className="type-title">{t("pageTitle")}</p>
        <p className="type-body-sm text-muted-foreground mt-1 max-w-sm">{message}</p>
        {onRetry ? (
          <Button variant="outline" className="mt-5" onClick={onRetry}>
            <RotateCcw aria-hidden />
            {tCommon("retry")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "bg-destructive-surface border-destructive-border flex items-start gap-3 rounded-md border p-4",
        className,
      )}
    >
      <TriangleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="type-body-sm text-foreground">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="type-label text-primary mt-2 underline underline-offset-4"
          >
            {tCommon("retry")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
