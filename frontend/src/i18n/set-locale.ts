"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from "./config";

/**
 * Persists the language choice.
 *
 * A server action rather than a route handler, so the new locale is applied on
 * the very next render without a client-side reload.
 */
export async function setLocale(value: string): Promise<void> {
  if (!isLocale(value)) return;

  (await cookies()).set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    // Readable by the client: it is a display preference, not a credential.
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
}
