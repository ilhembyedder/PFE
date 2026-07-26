import { decrypt } from "@/lib/crypto";

export const SESSION_COOKIE = "session_token";

export type Role = "SUPER_ADMIN" | "ADMIN" | "GESTIONNAIRE";

export interface Session {
  /** The raw backend JWT. Server-side only; never sent to the browser. */
  token: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  /** Absent for a super admin, who is not scoped to a tenant. */
  tenantId?: string;
  /** Expiry, seconds since epoch. */
  exp: number;
}

interface JwtClaims {
  sub?: string;
  userId?: string;
  tenantId?: string;
  role?: string;
  name?: string;
  exp?: number;
}

const ROLES: readonly string[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "GESTIONNAIRE",
] as const;

/**
 * Decodes the JWT payload without verifying its signature.
 *
 * That is deliberate and safe here: the token arrives sealed in an AES-GCM
 * cookie that only this server can produce, so the authenticity check has
 * already happened at the cookie layer. The backend verifies the signature
 * again on every call. This decode is only to read claims for routing and
 * for the tenant headers.
 */
function decodeClaims(token: string): JwtClaims | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  try {
    // JWT uses base64url, not base64.
    const json = Buffer.from(segments[1], "base64url").toString("utf-8");
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as JwtClaims;
  } catch {
    return null;
  }
}

export function isExpired(exp: number, skewSeconds = 0): boolean {
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

/**
 * Unseals and validates a session cookie.
 *
 * Returns null when the cookie is absent, forged, malformed, missing
 * required claims, or expired. The previous implementation never checked
 * `exp`, so a token that expired hours earlier still rendered the full UI
 * and then produced a wall of 401s.
 */
export async function readSession(
  sealed: string | undefined,
): Promise<Session | null> {
  const token = await decrypt(sealed);
  if (!token) return null;

  const claims = decodeClaims(token);
  if (!claims) return null;

  const { sub, userId, role, name, tenantId, exp } = claims;

  if (!sub || !userId || !role || typeof exp !== "number") return null;
  if (!ROLES.includes(role)) return null;
  if (isExpired(exp)) return null;

  return {
    token,
    userId,
    email: sub,
    name: name ?? sub,
    role: role as Role,
    tenantId,
    exp,
  };
}

/** The subset safe to expose to the browser. Never includes the token. */
export interface PublicSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  tenantId?: string;
}

export function toPublicSession(session: Session): PublicSession {
  const { userId, email, name, role, tenantId } = session;
  return { userId, email, name, role, tenantId };
}
