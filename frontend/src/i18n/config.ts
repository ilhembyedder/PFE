/**
 * Locale configuration.
 *
 * French is the default: the product is built for Tunisian and French leasing
 * companies and its domain vocabulary is French. English exists so the
 * platform can be demonstrated and operated outside that market.
 *
 * The locale is a per-user preference held in a cookie, NOT a URL prefix.
 * This is an authenticated internal tool where users log in and stay, so the
 * locale behaves like the theme. It also avoids prefixing every route, which
 * would mean touching the auth guard's matcher and every Link in the app.
 */

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "locale";

/**
 * Fixed rather than inferred from the environment.
 *
 * next-intl reports ENVIRONMENT_FALLBACK when a formatter has no time zone,
 * because the server and the browser can resolve different ones and produce a
 * hydration mismatch. Statutory deadlines must also not shift with the
 * viewer's location: a deadline is a fact about the contract, not the reader.
 */
export const TIME_ZONE = "Europe/Paris";

/** Cookie lifetime: one year. A language choice should not expire. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);
