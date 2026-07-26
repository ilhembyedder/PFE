import { cn } from "@/lib/utils";

/**
 * A Leaf sheet on Paper: 1px hairline, 5px radius, no shadow.
 *
 * The Paper Rule (DESIGN.md §4): surfaces are flat and separated by
 * hairlines. Never nest one of these inside another — that means the outer
 * one should have been a section with a heading.
 */
export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("bg-card border-border rounded-md border", className)}>
      {title ? (
        <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-3">
          <h2 className="type-title">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
