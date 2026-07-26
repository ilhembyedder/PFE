"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { isApiError } from "@/lib/api/api-error";

/**
 * TanStack Query owns all server state.
 * Defaults and rationale: docs/DESIGN_SCREENS.md §12.
 */
export function makeQueryClient(onUnauthorized: () => void) {
  const handle = (error: unknown) => {
    // 401 is the ONLY globally handled status. Everything else is handled
    // locally so the message can be specific to what failed.
    if (isApiError(error) && error.status === 401) onUnauthorized();
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: handle }),
    mutationCache: new MutationCache({ onError: handle }),
    defaultOptions: {
      queries: {
        // Fresh enough to trust, quiet enough not to thrash.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        // Returning from a meeting should show current alerts.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        // Errors render inline with a specific cause, never as a thrown
        // boundary. PRODUCT.md prohibits generic error screens.
        throwOnError: false,
        retry: (failureCount, error) =>
          isApiError(error) ? error.isRetryable && failureCount < 2 : false,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      },
      mutations: {
        throwOnError: false,
        retry: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() =>
    makeQueryClient(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/login?expired=1";
      }
    }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
