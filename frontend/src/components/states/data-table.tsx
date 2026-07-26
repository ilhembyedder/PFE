"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Server-driven data table.
 *
 * 48px rows, sticky header, tabular numerics. Sorting and pagination are
 * server-side and live in the URL, so a filtered view is shareable and
 * survives a refresh.
 *
 * Loading renders skeleton rows at the real row height, never a spinner over
 * content. While a new page loads the previous one stays visible at reduced
 * opacity (keepPreviousData) rather than flashing back to skeletons.
 */

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isPending: boolean;
  isPlaceholder?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Makes the whole row a link. Keyboard-activatable. */
  rowHref?: (row: T) => string;
  rowLabel?: (row: T) => string;
  onRowPrefetch?: (row: T) => void;
  empty: React.ReactNode;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  data,
  isPending,
  isPlaceholder = false,
  sorting = [],
  onSortingChange,
  rowHref,
  rowLabel,
  onRowPrefetch,
  empty,
  skeletonRows = 10,
}: DataTableProps<T>) {
  const router = useRouter();

  /* eslint-disable-next-line react-hooks/incompatible-library --
     TanStack Table returns fresh function identities each render, so the
     React Compiler declines to memoize this component. That is acceptable
     here and contained: nothing derived from `table` is passed to a memoized
     child, and the table instance never leaves this file. */
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    manualSorting: true,
    manualPagination: true,
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      onSortingChange(typeof updater === "function" ? updater(sorting) : updater);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending && !isPlaceholder) {
    return (
      <div className="bg-card border-border overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead key={index} className="bg-background h-9">
                  <Skeleton className="h-3 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent">
                {columns.map((_column, cellIndex) => (
                  // Skeletons match the real 48px row height exactly.
                  <TableCell key={cellIndex} className="h-12">
                    <Skeleton className="h-3.5 w-full max-w-[140px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className="bg-card border-border rounded-md border">{empty}</div>;
  }

  return (
    <div
      className={cn(
        "bg-card border-border overflow-hidden rounded-md border transition-opacity",
        isPlaceholder && "opacity-60",
      )}
      style={{ transitionDuration: "var(--duration-base)" }}
      aria-busy={isPlaceholder || undefined}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort();
                const direction = header.column.getIsSorted();
                const numeric = header.column.columnDef.meta?.numeric;

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "type-label text-muted-foreground bg-background h-9",
                      numeric && "text-right",
                    )}
                    aria-sort={
                      direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="focus-visible:focus-ring hover:text-foreground inline-flex items-center gap-1 rounded-sm outline-none [&_svg]:size-3"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {direction === "asc" ? (
                          <ArrowUp aria-hidden />
                        ) : direction === "desc" ? (
                          <ArrowDown aria-hidden />
                        ) : (
                          <ChevronsUpDown className="opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const href = rowHref?.(row.original);
            return (
              <TableRow
                key={row.id}
                // The row itself is the link target: keyboard-activatable,
                // and prefetched on intent so opening feels instantaneous.
                tabIndex={href ? 0 : undefined}
                role={href ? "link" : undefined}
                aria-label={href ? rowLabel?.(row.original) : undefined}
                onClick={href ? () => router.push(href) : undefined}
                onKeyDown={
                  href
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(href);
                        }
                      }
                    : undefined
                }
                onMouseEnter={() => onRowPrefetch?.(row.original)}
                onFocus={() => onRowPrefetch?.(row.original)}
                className={cn(
                  "focus-visible:focus-ring outline-none",
                  href && "hover:bg-background cursor-pointer",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      "type-body h-12",
                      cell.column.columnDef.meta?.numeric && "text-right tabular",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Right-aligned and tabular. Money and counts. */
    numeric?: boolean;
  }
}
