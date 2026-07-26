import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

/* IBM Plex: institutional character without strangeness, true tabular
   figures for the currency tables, complete French diacritics.
   latin-ext is required for French accents. Weights 400/500/600 only —
   700 does not appear anywhere in the type scale. */
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return { title: t("name"), description: t("description") };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Declared from the resolved locale, not hardcoded. The previous build
  // shipped lang="en" on an entirely French interface.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(plexSans.variable, plexMono.variable)}
    >
      <body className="font-sans type-body antialiased">
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
