"use client";

import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { QueryProvider } from "@/lib/query/query-provider";
import { TIME_ZONE } from "@/i18n/config";

/**
 * `locale` and `messages` are passed explicitly from the server layout.
 *
 * NextIntlClientProvider can only infer them when it is rendered from a
 * Server Component; this file is "use client", so it cannot. Passing them
 * down is the supported arrangement and keeps every provider in one place.
 */
export function Providers({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={TIME_ZONE}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
