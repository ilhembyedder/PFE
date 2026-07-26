"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/**
 * Light is the default and dark is opt-in. The scene this product is designed
 * around is an all-day desktop session in a normally-lit office reading dense
 * financial tables, so system preference is honoured only when explicitly
 * chosen.
 *
 * The icon swaps via CSS `dark:` variants rather than a mounted flag, so
 * there is no hydration mismatch and no setState inside an effect.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();
  const t = useTranslations("theme");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t("toggle")}>
            <Sun className="dark:hidden" aria-hidden />
            <Moon className="hidden dark:block" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun aria-hidden />
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon aria-hidden />
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor aria-hidden />
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
