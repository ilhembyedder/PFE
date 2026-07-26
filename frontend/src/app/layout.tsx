import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "LeasRecover",
  description: "Plateforme de recouvrement pour sociétés de leasing",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(plexSans.variable, plexMono.variable)}
    >
      <body className="font-sans type-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
