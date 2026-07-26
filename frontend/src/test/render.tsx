import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { setTestLocale } from "./i18n-mock";

/**
 * Renders with a locale set, defaulting to French.
 *
 * Pass a locale to assert a component in English; several tests run the same
 * assertions in both, which is what catches a string that was never
 * externalised into the catalogues.
 */
export function render(
  ui: React.ReactElement,
  { locale = DEFAULT_LOCALE, ...options }: RenderOptions & { locale?: Locale } = {},
) {
  setTestLocale(locale);
  return rtlRender(ui, options);
}

export * from "@testing-library/react";
