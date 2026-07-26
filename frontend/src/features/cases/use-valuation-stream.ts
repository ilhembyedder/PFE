"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import type { ValuationProgress } from "@/types/api";

/**
 * The AI pipeline progress stream.
 *
 * TanStack Query does not model server-sent events, so this hook owns the
 * EventSource and writes results into the cache. On success it invalidates the
 * valuation AND the prerequisites, because a successful valuation is what
 * unblocks the transition to VENTE.
 *
 * A polling fallback is required, not optional: the backend keeps SSE emitters
 * in an in-memory map on a single JVM, so the stream breaks the moment a
 * second instance exists and the webhook may land on a node holding no
 * emitter (CODE_REVIEW.md H-3, H-4).
 *
 * The previous implementation treated 15 seconds of silence as SUCCESS, which
 * will eventually present a stale or absent valuation as a real one.
 */

const SILENCE_BEFORE_POLLING = 15_000;
const POLL_INTERVAL = 3_000;
const POLL_CEILING = 60_000;

export type StreamState =
  | { phase: "idle" }
  | { phase: "running"; progress: number; message: string; stage?: string }
  | { phase: "success" }
  | { phase: "failed"; message: string };

export function useValuationStream(caseId: string, enabled: boolean) {
  const client = useQueryClient();
  const [state, setState] = useState<StreamState>({ phase: "idle" });
  const [runId, setRunId] = useState(0);
  const active = useRef(false);

  /** Called after a successful upload to begin listening. */
  const start = () => {
    setState({ phase: "running", progress: 5, message: "Envoi du document…" });
    setRunId((n) => n + 1);
  };

  const reset = () => setState({ phase: "idle" });

  useEffect(() => {
    if (!enabled || runId === 0) return;

    active.current = true;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let ceilingTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (next: StreamState) => {
      if (!active.current) return;
      setState(next);
      source?.close();
      clearInterval(pollTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(ceilingTimer);

      if (next.phase === "success") {
        void client.invalidateQueries({ queryKey: queryKeys.cases.valuation(caseId) });
        void client.invalidateQueries({ queryKey: queryKeys.cases.prerequisites(caseId) });
        void client.invalidateQueries({ queryKey: queryKeys.cases.documents(caseId) });
        void client.invalidateQueries({ queryKey: queryKeys.alerts.all });
      }
    };

    /** Fallback: ask the backend directly whether a valuation landed. */
    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => {
        void (async () => {
          try {
            const response = await fetch(`/api/cases/${caseId}/valuation`);
            if (!response.ok) return;
            const body = (await response.json()) as {
              data?: { marketValueCents?: number | null };
            };
            if (body.data?.marketValueCents !== undefined && body.data.marketValueCents !== null) {
              finish({ phase: "success" });
            }
          } catch {
            // Keep polling; the ceiling below decides when to give up.
          }
        })();
      }, POLL_INTERVAL);

      ceilingTimer = setTimeout(() => {
        finish({
          phase: "failed",
          message:
            "L'analyse n'a pas répondu. Le traitement est peut-être toujours en cours ; réessayez dans un instant.",
        });
      }, POLL_CEILING);
    };

    // If no event arrives within the silence window, stop trusting the stream.
    fallbackTimer = setTimeout(startPolling, SILENCE_BEFORE_POLLING);

    try {
      source = new EventSource(`/api/cases/${caseId}/progress`);
    } catch {
      startPolling();
      return;
    }

    const onMessage = (event: MessageEvent<string>) => {
      clearTimeout(fallbackTimer);
      let payload: ValuationProgress;
      try {
        payload = JSON.parse(event.data) as ValuationProgress;
      } catch {
        return;
      }

      client.setQueryData(queryKeys.cases.valuationProgress(caseId), payload);

      if (payload.status === "SUCCESS") {
        finish({ phase: "success" });
      } else if (payload.status === "FAILED") {
        finish({
          phase: "failed",
          message:
            payload.message ||
            "Le document est illisible ou n'est pas un rapport d'expertise valide.",
        });
      } else {
        setState({
          phase: "running",
          progress: Math.min(Math.max(payload.progress, 0), 99),
          message: payload.message,
          stage: payload.stage,
        });
        // Restart the silence watchdog after each genuine event.
        fallbackTimer = setTimeout(startPolling, SILENCE_BEFORE_POLLING);
      }
    };

    source.addEventListener("progress", onMessage as EventListener);
    source.addEventListener("message", onMessage as EventListener);
    source.onerror = () => {
      // Only fatal once the browser has given up reconnecting.
      if (source?.readyState === EventSource.CLOSED) startPolling();
    };

    return () => {
      active.current = false;
      source?.close();
      clearInterval(pollTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(ceilingTimer);
    };
  }, [caseId, enabled, runId, client]);

  return { state, start, reset };
}
