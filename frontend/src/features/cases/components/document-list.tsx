"use client";

import { Download, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/use-format";
import type { DocumentSummary } from "@/types/api";

/**
 * One document list implementation, replacing the three the previous build
 * carried with three different validation rules (The One Vocabulary Rule).
 *
 * Rows, not cards: a list of files is a list.
 */
export function DocumentList({
  documents,
  isPending,
  downloadHref,
  emptyLabel,
}: {
  documents: DocumentSummary[];
  isPending?: boolean;
  downloadHref: (doc: DocumentSummary) => string;
  emptyLabel?: string;
}) {
  const t = useTranslations("caseDetail.documents");
  const tCommon = useTranslations("common");
  const format = useFormat();
  if (isPending) {
    return (
      <ul className="divide-border divide-y">
        {[0, 1].map((i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="size-4 shrink-0 rounded-sm" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  // Never an empty state while a request is in flight — checked above.
  if (documents.length === 0) {
    return (
      <p className="type-body-sm text-muted-foreground py-2">
        {emptyLabel ?? t("emptyEntity")}
      </p>
    );
  }

  return (
    <ul className="divide-border divide-y">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center gap-3 py-3">
          <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="type-body-sm truncate font-medium">{doc.fileName}</p>
            <p className="type-caption text-muted-foreground">
              {doc.uploaderName ? `${doc.uploaderName} · ` : ""}
              <time dateTime={doc.createdAt}>{format.dateTime(doc.createdAt)}</time>
            </p>
          </div>
          <a
            href={downloadHref(doc)}
            download
            className="text-muted-foreground hover:text-foreground focus-visible:focus-ring grid size-8 shrink-0 place-items-center rounded-md outline-none [&_svg]:size-4"
            aria-label={`${tCommon("download")} ${doc.fileName}`}
          >
            <Download aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
