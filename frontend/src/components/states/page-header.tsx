import { cn } from "@/lib/utils";

/**
 * Page title, subtitle and action slot.
 * The title belongs to the page, not the shell chrome.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <h1 className="type-display">{title}</h1>
        {subtitle ? (
          <div className="type-body-sm text-muted-foreground mt-1">{subtitle}</div>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
