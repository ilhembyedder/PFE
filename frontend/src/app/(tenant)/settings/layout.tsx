"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  { href: "/settings/tenant", key: "tenant" },
  { href: "/settings/compliance", key: "compliance" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("settings");
  const pathname = usePathname();

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <nav aria-label={t("sections")} className="border-border mb-6 flex gap-1 border-b">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "type-body-sm focus-visible:focus-ring -mb-px rounded-t-md border-b-2 px-3 py-2 outline-none transition-colors",
                active
                  ? "border-primary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
              style={{ transitionDuration: "var(--duration-fast)" }}
            >
              {t(`tabs.${tab.key}`)}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
