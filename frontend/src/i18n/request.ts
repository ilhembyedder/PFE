import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  TIME_ZONE,
  isLocale,
  type Locale,
} from "./config";

/**
 * Resolves the active locale per request.
 *
 * Order: an explicit cookie choice, then the browser's Accept-Language, then
 * the default. An explicit choice always wins — a user who selected English
 * should not be flipped back by their browser settings.
 */
async function resolveLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;

  const header = (await headers()).get("accept-language");
  if (header) {
    for (const part of header.split(",")) {
      const tag = part.split(";")[0]?.trim().toLowerCase();
      if (!tag) continue;
      const base = tag.split("-")[0];
      if (isLocale(base)) return base;
    }
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Formatting defaults, so a date or amount rendered without explicit
    // options is still correct for the locale.
    timeZone: TIME_ZONE,
    formats: {
      dateTime: {
        short: { day: "numeric", month: "long", year: "numeric" },
        long: {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        },
      },
    },
    onError(error) {
      // A missing message must be loud in development and non-fatal in
      // production: a blank label is worse than an English fallback.
      if (process.env.NODE_ENV !== "production") console.error(error);
    },
    getMessageFallback({ key }) {
      return process.env.NODE_ENV === "production" ? key.split(".").pop()! : `[${key}]`;
    },
  };
});

export { LOCALES };
