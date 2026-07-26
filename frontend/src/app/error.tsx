"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    console.error("[render]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="type-headline">Cette page n&apos;a pas pu s&apos;afficher</h1>
      <p className="type-body-sm text-muted-foreground mt-2">
        L&apos;erreur a été enregistrée. Vous pouvez réessayer sans perdre votre
        session.
      </p>
      {error.digest ? (
        <p className="type-caption text-muted-foreground mt-3">
          Référence&nbsp;: <span className="type-identifier">{error.digest}</span>
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw aria-hidden />
        Réessayer
      </Button>
    </main>
  );
}
