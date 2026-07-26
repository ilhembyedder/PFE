import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 *
 * Clears the sealed session. Also clears the legacy `user_session` cookie,
 * which no longer exists but may still be present in a browser from before
 * the rebuild; leaving it would keep a stale role readable client-side.
 */
export async function POST(): Promise<Response> {
  const response = NextResponse.json({ status: "success" });
  for (const name of [SESSION_COOKIE, "user_session"]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
