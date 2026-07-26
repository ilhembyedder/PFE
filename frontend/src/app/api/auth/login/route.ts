import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { API_BASE, fail, serverError } from "@/lib/bff";

const SESSION_MAX_AGE = 60 * 60 * 24; // 24h, matching the backend JWT.

interface LoginBody {
  email?: string;
  password?: string;
  tenantId?: string;
}

/**
 * POST /api/auth/login
 *
 * Seals the backend JWT into an HttpOnly cookie. Nothing readable by the
 * browser is set: the previous implementation also wrote a `user_session`
 * cookie with `httpOnly: false` containing the role, and `/api/auth/session`
 * trusted it, which let anyone grant themselves the super-admin console by
 * editing document.cookie. The client now reads its session from
 * GET /api/auth/session, which derives it from this sealed token.
 */
export async function POST(request: NextRequest): Promise<Response> {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return fail(400, "Requête invalide.");
  }

  const { email, password, tenantId } = body;
  if (!email || !password) {
    return fail(400, "Adresse e-mail et mot de passe requis.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // An absent tenantId means a super-admin login.
      body: JSON.stringify({ email, password, tenantId: tenantId || null }),
    });
  } catch (error) {
    console.error("[bff] login: backend unreachable", error);
    return NextResponse.json(
      { status: "error", message: "Connexion au serveur impossible." },
      { status: 503 },
    );
  }

  let payload: { status?: string; data?: { token?: string }; message?: string };
  try {
    payload = (await upstream.json()) as typeof payload;
  } catch {
    return NextResponse.json(
      { status: "error", message: "Réponse invalide reçue du serveur." },
      { status: 502 },
    );
  }

  if (!upstream.ok || payload.status !== "success") {
    // The backend distinguishes "unknown user" from "wrong password" from
    // "suspended", which leaks which accounts exist. Collapse the
    // credential cases into one message here; a suspended account is only
    // surfaced because the backend has already verified the password.
    const message =
      upstream.status === 403
        ? (payload.message ?? "Ce compte est désactivé.")
        : "Adresse e-mail, mot de passe ou identifiant de société incorrect.";
    return fail(upstream.status === 403 ? 403 : 401, message);
  }

  const token = payload.data?.token;
  if (!token) {
    console.error("[bff] login: no token in a successful response");
    return serverError("Réponse d'authentification incomplète.");
  }

  const response = NextResponse.json({ status: "success" });
  response.cookies.set(SESSION_COOKIE, await encrypt(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
