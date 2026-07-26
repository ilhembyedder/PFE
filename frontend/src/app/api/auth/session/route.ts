import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSession, toPublicSession } from "@/lib/auth/session";

/**
 * GET /api/auth/session
 *
 * Derives the session from the sealed HttpOnly token. It previously parsed
 * and echoed a client-writable cookie, so `document.cookie = 'user_session=
 * {"role":"SUPER_ADMIN"}'` was enough to enter the admin console.
 *
 * Returns 200 with `data: null` rather than 401 when unauthenticated: this
 * endpoint answers "who am I", and "nobody" is a valid answer that should
 * not trip the global 401 redirect.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({
    status: "success",
    data: session ? toPublicSession(session) : null,
  });
}
