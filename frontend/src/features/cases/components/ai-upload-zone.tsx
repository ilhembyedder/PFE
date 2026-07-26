"use client";

import { useId, useRef, useState } from "react";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  RotateCcw,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { useUploadCaseDocument } from "@/lib/query/hooks";
import { useValuationStream } from "../use-valuation-stream";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Expertise report upload with narrated pipeline feedback.
 *
 * "Upload-and-pray" is named as an anti-reference: a file input with no
 * progress during a thirty-second wait. The progress bar is determinate,
 * never an indeterminate spinner, because the emotion being designed against
 * is the unexplained wait.
 */
export function AIUploadZone({
  caseId,
  phase,
  onUploaded,
}: {
  caseId: string;
  phase: string;
  onUploaded?: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useUploadCaseDocument(caseId);
  const stream = useValuationStream(caseId, true);
  const isExpertise = phase === "SAISIE";

  const submit = async (file: File) => {
    setError(null);

    // Checked here as well as in the BFF: the backend enforces 10MB in code
    // but never configures multipart, so Boot's 1MB default returns a raw 500.
    if (file.size === 0) return setError("Ce fichier est vide.");
    if (file.size > MAX_BYTES) {
      return setError("Ce fichier dépasse la taille maximale de 10 Mo.");
    }
    if (file.type !== "application/pdf") {
      return setError("Le rapport d'expertise doit être un fichier PDF.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("phase", phase);
    if (isExpertise) formData.append("tag", "EXPERTISE_REPORT");

    try {
      if (isExpertise) stream.start();
      await upload.mutateAsync(formData);
      onUploaded?.();
      if (!isExpertise) stream.reset();
    } catch (cause) {
      stream.reset();
      setError(messageFor(cause));
    }
  };

  const busy = upload.isPending || stream.state.phase === "running";

  if (stream.state.phase === "failed") {
    return (
      <div className="space-y-3">
        <ErrorState error={new Error(stream.state.message)} />
        <Button
          variant="outline"
          onClick={() => {
            stream.reset();
            setError(null);
          }}
        >
          <RotateCcw aria-hidden />
          Réessayer
        </Button>
      </div>
    );
  }

  if (stream.state.phase === "success") {
    return (
      <div
        role="status"
        className="bg-success-surface border-success-border flex items-center gap-3 rounded-md border p-4"
      >
        <CheckCircle2 className="text-success size-4 shrink-0" aria-hidden />
        <p className="text-body-sm flex-1">Analyse terminée. L&apos;estimation est disponible.</p>
        <Button variant="ghost" size="sm" onClick={stream.reset}>
          Téléverser un autre document
        </Button>
      </div>
    );
  }

  if (busy) {
    const running = stream.state.phase === "running" ? stream.state : null;
    const value = running?.progress ?? 5;
    return (
      <div className="bg-card border-border rounded-md border p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <Loader2 className="text-primary size-4 animate-spin" aria-hidden />
          <p className="text-body-sm font-medium">
            {running?.message ?? "Envoi du document…"}
          </p>
        </div>
        {/* aria-live so each stage is announced as it arrives. */}
        <Progress value={value} aria-label="Progression de l'analyse" />
        <p className="text-caption text-muted-foreground mt-2 tabular" aria-live="polite">
          {value}&nbsp;%
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void submit(file);
        }}
        className={cn(
          "border-input bg-card hover:bg-background flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed p-8 text-center transition-colors",
          "focus-within:focus-ring",
          dragging && "border-primary bg-accent",
        )}
        style={{ transitionDuration: "var(--duration-fast)" }}
      >
        {isExpertise ? (
          <FileUp className="text-muted-foreground size-5" aria-hidden />
        ) : (
          <UploadCloud className="text-muted-foreground size-5" aria-hidden />
        )}
        <span className="text-body-sm font-medium">
          {isExpertise
            ? "Téléverser le rapport d'expertise"
            : "Téléverser un document"}
        </span>
        <span className="text-caption text-muted-foreground">
          {isExpertise
            ? "PDF uniquement, 10 Mo maximum. L'analyse démarre automatiquement."
            : "PDF, JPEG ou PNG, 10 Mo maximum."}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={isExpertise ? "application/pdf" : "application/pdf,image/jpeg,image/png"}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void submit(file);
            event.target.value = "";
          }}
        />
      </label>

      {error ? (
        <p role="alert" className="text-body-sm text-destructive flex items-center gap-1.5">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
