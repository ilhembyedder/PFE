import { cn } from "@/lib/utils";

/**
 * Label/value pairs. Replaces the nested-card soup the previous build used
 * for every detail panel.
 */
export function DefinitionList({
  items,
  columns = 2,
  className,
}: {
  items: ReadonlyArray<{ label: string; value: React.ReactNode; mono?: boolean }>;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {items.map(({ label, value, mono }) => (
        <div key={label} className="min-w-0">
          <dt className="type-label text-muted-foreground">{label}</dt>
          <dd
            className={cn(
              "mt-1 truncate",
              mono ? "type-identifier" : "type-body text-foreground",
            )}
          >
            {value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
