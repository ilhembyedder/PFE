import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSession, type Role, type Session } from "@/lib/auth/session";

/**
 * The BFF layer.
 *
 * Every route handler goes through `withAuth`. The previous implementation
 * repeated the same twenty-line preamble in 26 files, which is how the
 * un-awaited `params` bug reached six call sites and how the super-admin
 * routes ended up with no role check at all.
 */

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
export const API_BASE = `${BACKEND_URL}/api/v1`;

type JSend =
  | { status: "success"; data?: unknown }
  | { status: "fail" | "error"; message: string };

export const fail = (status: number, message: string) =>
  NextResponse.json<JSend>({ status: "fail", message }, { status });

export const serverError = (message = "Une erreur interne est survenue.") =>
  NextResponse.json<JSend>({ status: "error", message }, { status: 500 });

export interface RouteContext<P = Record<string, never>> {
  session: Session;
  /** Route params, already awaited. Next 16 makes these a Promise. */
  params: P;
  request: NextRequest;
}

interface Options {
  /** Roles permitted to reach the handler. Omit to allow any authenticated user. */
  roles?: readonly Role[];
}

type Handler<P> = (ctx: RouteContext<P>) => Promise<Response>;

/**
 * Wraps a route handler with session unsealing, expiry validation and an
 * optional role gate.
 *
 * `params` is awaited here exactly once, which is what makes the Next 16
 * Promise-params change impossible to get wrong at a call site.
 */
export function withAuth<P = Record<string, never>>(
  handler: Handler<P>,
  options: Options = {},
) {
  return async (
    request: NextRequest,
    context: { params: Promise<P> } = { params: Promise.resolve({} as P) },
  ): Promise<Response> => {
    const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      return fail(401, "Session expirée ou invalide.");
    }

    if (options.roles && !options.roles.includes(session.role)) {
      // Defence in depth. The backend enforces this too, but the BFF must
      // not forward a request it can already tell is unauthorised.
      return fail(403, "Vous n'avez pas les droits nécessaires.");
    }

    try {
      const params = (await context.params) ?? ({} as P);
      return await handler({ session, params, request });
    } catch (error) {
      console.error("[bff] unhandled handler error", error);
      return serverError();
    }
  };
}

/** Headers the Spring backend expects on every tenant-scoped call. */
export function backendHeaders(session: Session, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Authorization", `Bearer ${session.token}`);
  if (session.tenantId) headers.set("X-Tenant-ID", session.tenantId);
  headers.set("X-User-Email", session.email);
  return headers;
}

/**
 * Proxies a JSON call to the backend and mirrors its status.
 *
 * Distinguishes an unreachable backend (503) from a non-JSON response (502)
 * from a genuine backend error, so the interface can say which happened.
 * PRODUCT.md prohibits generic failure messages.
 */
export async function proxyJson(
  session: Session,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = backendHeaders(session, init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
  } catch (error) {
    console.error(`[bff] backend unreachable: ${path}`, error);
    return NextResponse.json<JSend>(
      { status: "error", message: "Connexion au serveur impossible." },
      { status: 503 },
    );
  }

  // 204 and empty bodies are legitimate.
  const text = await upstream.text();
  if (!text) {
    return new NextResponse(null, { status: upstream.status });
  }

  try {
    return NextResponse.json(JSON.parse(text) as unknown, {
      status: upstream.status,
    });
  } catch {
    console.error(`[bff] non-JSON response from ${path}`, text.slice(0, 200));
    return NextResponse.json<JSend>(
      { status: "error", message: "Réponse invalide reçue du serveur." },
      { status: 502 },
    );
  }
}

/** Proxies a multipart upload. Body is streamed through unchanged. */
export async function proxyFormData(
  session: Session,
  path: string,
  formData: FormData,
): Promise<Response> {
  // Content-Type is deliberately not set: fetch derives it, including the
  // multipart boundary.
  const headers = backendHeaders(session);

  try {
    const upstream = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
    const text = await upstream.text();
    if (!text) return new NextResponse(null, { status: upstream.status });
    return NextResponse.json(JSON.parse(text) as unknown, {
      status: upstream.status,
    });
  } catch (error) {
    console.error(`[bff] upload failed: ${path}`, error);
    return NextResponse.json<JSend>(
      { status: "error", message: "Connexion au serveur impossible." },
      { status: 503 },
    );
  }
}

/** Proxies a binary download, preserving disposition and content type. */
export async function proxyBinary(
  session: Session,
  path: string,
  fallback: { contentType?: string; filename?: string } = {},
): Promise<Response> {
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}${path}`, {
      headers: backendHeaders(session),
    });
  } catch (error) {
    console.error(`[bff] backend unreachable: ${path}`, error);
    return fail(503, "Connexion au serveur impossible.");
  }

  if (!upstream.ok) {
    return fail(upstream.status, "Le fichier n'a pas pu être téléchargé.");
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("Content-Type") ??
      fallback.contentType ??
      "application/octet-stream",
  );

  const disposition = upstream.headers.get("Content-Disposition");
  if (disposition) {
    headers.set("Content-Disposition", disposition);
  } else if (fallback.filename) {
    // Quoted and stripped of CR/LF: the filename originates from user input
    // and is interpolated into a response header.
    const safe = fallback.filename.replace(/["\r\n]/g, "");
    headers.set("Content-Disposition", `attachment; filename="${safe}"`);
  }

  return new NextResponse(upstream.body, { status: 200, headers });
}

/**
 * Builds a querystring from allowed keys only.
 *
 * The documents proxy previously interpolated caller-supplied values
 * straight into the backend URL, letting a value containing `&` inject
 * additional backend parameters.
 */
export function buildQuery(
  source: URLSearchParams,
  allowed: readonly string[],
): string {
  const out = new URLSearchParams();
  for (const key of allowed) {
    const value = source.get(key);
    if (value !== null && value !== "") out.set(key, value);
  }
  const qs = out.toString();
  return qs ? `?${qs}` : "";
}
