import { ApiError } from "./api-error";
import type { JSend } from "@/types/api";

/**
 * Client-side fetch wrapper over the BFF routes.
 *
 * Unwraps the JSend envelope and maps HTTP status onto ApiError, so callers
 * receive either data or a typed error carrying a status. That status is what
 * lets each screen render a specific message: docs/DESIGN_SCREENS.md §12
 * prohibits generic failures.
 *
 * Never talks to the Spring backend directly. Only /api/* on this origin,
 * so the sealed session cookie is applied by the browser and the JWT stays
 * server-side.
 */

const MESSAGES: Record<number, string> = {
  401: "Session expirée. Reconnectez-vous.",
  403: "Vous n'avez pas les droits nécessaires.",
  404: "Ressource introuvable.",
  409: "Cette action n'est plus possible : le dossier a changé.",
  413: "Ce fichier dépasse la taille maximale de 10 Mo.",
  415: "Format de fichier non accepté.",
  502: "Réponse invalide reçue du serveur.",
  503: "Connexion au serveur impossible.",
};

async function parse<T>(response: Response): Promise<T> {
  // 204 and empty bodies are legitimate for mutations.
  const text = await response.text();

  if (!text) {
    if (response.ok) return undefined as T;
    throw new ApiError(response.status, MESSAGES[response.status] ?? "Erreur.");
  }

  let payload: JSend<T>;
  try {
    payload = JSON.parse(text) as JSend<T>;
  } catch {
    throw new ApiError(502, MESSAGES[502]);
  }

  if (!response.ok || payload.status !== "success") {
    const message =
      payload.status !== "success" && payload.message
        ? payload.message
        : (MESSAGES[response.status] ?? "Une erreur est survenue.");
    throw new ApiError(response.status, message);
  }

  return payload.data;
}

async function send<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
  } catch {
    // No response at all: distinct from a server error, and retryable.
    throw ApiError.network();
  }
  return parse<T>(response);
}

const jsonInit = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  get: <T>(path: string, init?: RequestInit) => send<T>(path, init),

  post: <T>(path: string, body?: unknown) => send<T>(path, jsonInit("POST", body)),

  put: <T>(path: string, body?: unknown) => send<T>(path, jsonInit("PUT", body)),

  delete: <T>(path: string) => send<T>(path, { method: "DELETE" }),

  /** Multipart upload. Content-Type is left to fetch, for the boundary. */
  upload: <T>(path: string, formData: FormData) =>
    send<T>(path, { method: "POST", body: formData }),

  /** Binary download, returned as a Blob for the caller to save. */
  async download(path: string): Promise<{ blob: Blob; filename?: string }> {
    let response: Response;
    try {
      response = await fetch(path);
    } catch {
      throw ApiError.network();
    }
    if (!response.ok) {
      throw new ApiError(
        response.status,
        MESSAGES[response.status] ?? "Le téléchargement a échoué.",
      );
    }
    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return {
      blob: await response.blob(),
      filename: match ? decodeURIComponent(match[1]) : undefined,
    };
  },
};

/** Serialises filters into a querystring, omitting empty values. */
export function toSearchParams(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters) as [string, unknown][]) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
