"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/states/page-header";
import { cn } from "@/lib/utils";

/**
 * Settings shell. A tab bar plus a narrow content column: a two-field form
 * spanning 1280px looks broken.
 *
 * The "single-page settings dump" is a named anti-reference, so configuration
 * is grouped and sectioned rather than presented as one wall of fields.
 */
const TABS = [
  { href: "/settings/tenant", label: "Société" },
  { href: "/settings/compliance", label: "Conformité" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration de votre société et des règles de conformité."
      />

      <nav aria-label="Sections des paramètres" className="border-border mb-6 flex gap-1 border-b">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-body-sm focus-visible:focus-ring -mb-px rounded-t-md border-b-2 px-3 py-2 outline-none transition-colors",
                active
                  ? "border-primary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
