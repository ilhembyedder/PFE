"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Range statement plus page controls. The registry is paginated and stays
 * paginated: sixty cases with statutory deadlines need a stable, addressable,
 * shareable page rather than a feed.
 */
export function Pagination({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
}: {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalElements === 0) return null;

  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="type-body-sm text-muted-foreground tabular" aria-live="polite">
        {from}–{to} sur {totalElements}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
          Précédent
        </Button>
        <span className="type-body-sm text-muted-foreground tabular px-1">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
