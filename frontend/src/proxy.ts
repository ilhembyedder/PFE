import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSession, type Role } from "@/lib/auth/session";

/**
 * Route guard. (Next 16 renamed the `middleware` convention to `proxy`.)
 *
 * Two defects this replaces:
 *
 * 1. The matcher covered only `/dashboard/*` and `/admin/*`, but
 *    next.config rewrote those onto `/cases`, `/leasing`, `/settings` and
 *    `/tenants`, which were directly reachable and completely unguarded.
 *    Those rewrites are gone; these are now the real, and only, URLs.
 *
 * 2. Decrypting proved the cookie was authentic but said nothing about
 *    expiry, so a token that expired hours earlier still rendered the full
 *    UI. `readSession` validates `exp`.
 */

/** Route prefix -> roles allowed to reach it. */
const PROTECTED: ReadonlyArray<{ prefix: string; roles?: readonly Role[] }> = [
  { prefix: "/cases", roles: ["ADMIN", "GESTIONNAIRE"] },
  { prefix: "/leasing", roles: ["ADMIN", "GESTIONNAIRE"] },
  { prefix: "/settings", roles: ["ADMIN", "GESTIONNAIRE"] },
  { prefix: "/tenants", roles: ["SUPER_ADMIN"] },
];

const landingFor = (role: Role) =>
  role === "SUPER_ADMIN" ? "/tenants" : "/cases";

/** Each audience has its own login screen; pick the one for the route. */
const loginFor = (roles?: readonly Role[]) =>
  roles?.length === 1 && roles[0] === "SUPER_ADMIN" ? "/login/platform" : "/login";

const isLogin = (pathname: string) =>
  pathname === "/login" || pathname === "/login/platform";

function redirect(request: NextRequest, to: string, clear = false) {
  const response = NextResponse.redirect(new URL(to, request.url));
  if (clear) {
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete("user_session"); // legacy
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const route = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  // Signed in already: skip the login screens.
  if (isLogin(pathname) && session) {
    return redirect(request, landingFor(session.role));
  }

  if (!route) return NextResponse.next();

  if (!session) {
    const sealed = request.cookies.get(SESSION_COOKIE);
    const login = loginFor(route.roles);
    // A cookie that exists but does not validate means expired or tampered.
    // Say which, so the login screen can explain rather than appear blank.
    const to = sealed ? `${login}?expired=1` : login;
    return redirect(request, to, Boolean(sealed));
  }

  if (route.roles && !route.roles.includes(session.role)) {
    return redirect(request, landingFor(session.role));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/login/platform",
    "/cases/:path*",
    "/leasing/:path*",
    "/settings/:path*",
    "/tenants/:path*",
  ],
};
