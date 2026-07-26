import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="type-headline">{t("notFoundTitle")}</h1>
      <p className="type-body-sm text-muted-foreground mt-2">
        {t("notFoundBody")}
      </p>
      <Button render={<Link href="/cases" />} className="mt-6">
        {t("backToCases")}
      </Button>
    </main>
  );
}
