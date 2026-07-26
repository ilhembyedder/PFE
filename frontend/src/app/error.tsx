"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global error boundary. The previous build had none, so any unhandled render
 * error produced a white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error("[render]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="type-headline">{t("renderTitle")}</h1>
      <p className="type-body-sm text-muted-foreground mt-2">
        {t("renderBody")}
      </p>
      {error.digest ? (
        <p className="type-caption text-muted-foreground mt-3">
          {t("reference")}&nbsp;: <span className="type-identifier">{error.digest}</span>
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw aria-hidden />
        {tCommon("retry")}
      </Button>
    </main>
  );
}
