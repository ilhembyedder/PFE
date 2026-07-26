"use client";

import { useTranslations } from "next-intl";
import { FileQuestion, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty states teach the interface rather than reporting absence.
 *
 * Two DISTINCT components, deliberately not one with a flag: "you have no
 * cases yet" and "no case matches these filters" require different copy and
 * different actions, and the previous build conflated them.
 */

function Shell({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-panel text-muted-foreground mb-4 grid size-10 place-items-center rounded-md [&_svg]:size-5">
        {icon}
      </div>
      <p className="type-title">{title}</p>
      <p className="type-body-sm text-muted-foreground mt-1 max-w-sm">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Nothing exists yet. Offers the action that creates the first one. */
export function NoDataState(props: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return <Shell icon={<FileQuestion aria-hidden />} {...props} />;
}

/** Records exist but the filters exclude them. Offers to clear them. */
export function NoResultsState({
  onReset,
  className,
}: {
  onReset: () => void;
  className?: string;
}) {
  const t = useTranslations("empty");
  return (
    <Shell
      icon={<SearchX aria-hidden />}
      title={t("noResultsTitle")}
      body={t("noResultsBody")}
      className={className}
      action={
        <button
          type="button"
          onClick={onReset}
          className="type-label text-primary underline underline-offset-4"
        >
          {t("resetFilters")}
        </button>
      }
    />
  );
}
