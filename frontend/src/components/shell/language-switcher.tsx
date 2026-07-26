"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/set-locale";

/**
 * Language selection.
 *
 * Each option is labelled in its OWN language ("Français", "English") rather
 * than translated, so a user who has landed in the wrong locale can still
 * recognise the one they want.
 */
export function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const t = useTranslations("language");
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("change")}
            disabled={pending}
          >
            <Languages aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => startTransition(() => void setLocale(locale))}
          >
            {locale === current ? (
              <Check aria-hidden />
            ) : (
              <span aria-hidden className="size-4" />
            )}
            <span lang={locale}>{LOCALE_LABELS[locale]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
