import fr from "../../messages/fr.json";
import en from "../../messages/en.json";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

/**
 * Test double for next-intl.
 *
 * next-intl and use-intl ship ESM only, with no CJS entry point, so Jest
 * cannot load them without native ESM. Rather than reconfigure the whole
 * runner, tests resolve messages against the REAL catalogues through this
 * mock: assertions still fail if a key is missing or a placeholder is wrong,
 * which is the property that matters.
 */

const CATALOGUES: Record<Locale, unknown> = { fr, en };

let locale: Locale = DEFAULT_LOCALE;

export const setTestLocale = (next: Locale) => {
  locale = next;
};

export const getTestLocale = () => locale;

function lookup(path: string): string | undefined {
  let node: unknown = CATALOGUES[locale];
  for (const segment of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === "string" ? node : undefined;
}

type Values = Record<string, string | number | undefined>;

/** Minimal ICU: {name} interpolation plus {n, plural, =0 {} one {} other {}}. */
function interpolate(message: string, values?: Values): string {
  if (!values) return message;

  let out = message.replace(
    /\{(\w+),\s*plural,\s*([\s\S]*?)\}\s*$/,
    (_whole, name: string, body: string) => {
      const count = Number(values[name] ?? 0);
      const branches = new Map<string, string>();
      for (const match of body.matchAll(/(=\d+|zero|one|two|few|many|other)\s*\{([^{}]*)\}/g)) {
        branches.set(match[1]!, match[2]!);
      }
      const chosen =
        branches.get(`=${count}`) ??
        (count === 1 ? branches.get("one") : undefined) ??
        branches.get("other") ??
        "";
      return chosen.replace(/#/g, String(count));
    },
  );

  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{${key}}`, String(value ?? ""));
  }
  return out;
}

function translator(namespace?: string) {
  const fn = (key: string, values?: Values) => {
    const path = namespace ? `${namespace}.${key}` : key;
    const message = lookup(path);
    if (message === undefined) {
      // Mirrors the production getMessageFallback, so a missing key is
      // visible in an assertion rather than silently empty.
      throw new Error(`Missing message: ${path} (${locale})`);
    }
    return interpolate(message, values);
  };
  return Object.assign(fn, { rich: fn, markup: fn, raw: lookup, has: (k: string) => lookup(namespace ? `${namespace}.${k}` : k) !== undefined });
}

export const useTranslations = (namespace?: string) => translator(namespace);
export const getTranslations = async (namespace?: string) => translator(namespace);
export const useLocale = () => locale;
export const getLocale = async () => locale;
export const useMessages = () => CATALOGUES[locale];

/**
 * Pass-through. The locale is set by `render()` in src/test/render.tsx before
 * the tree mounts, so this must not mutate anything during render.
 */
export const NextIntlClientProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
