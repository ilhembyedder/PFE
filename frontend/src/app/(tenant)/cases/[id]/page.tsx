"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  Download,
  Loader2,
  PenLine,
  StepForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/states/panel";
import { DefinitionList } from "@/components/states/definition-list";
import { ErrorState, messageFor } from "@/components/states/error-state";
import { PhaseStepper } from "@/features/cases/components/phase-stepper";
import { BlockedNotice } from "@/features/cases/components/blocked-notice";
import { ValuationCard, ValuationCardSkeleton } from "@/features/cases/components/valuation-card";
import { AIUploadZone } from "@/features/cases/components/ai-upload-zone";
import { DocumentList } from "@/features/cases/components/document-list";
import { CaseEditSheet } from "@/features/cases/components/case-edit-sheet";
import {
  useAddNote,
  useAdvancePhase,
  useAssignCase,
  useAssignees,
  useCase,
  useCaseDocuments,
  useCaseHistory,
  useCaseNotes,
  useCasePrerequisites,
  useCaseValuation,
} from "@/lib/query/hooks";
import { api } from "@/lib/api/client";
import {
  PHASE_LABELS,
  PHASE_SHORT,
  formatDate,
  formatDateTime,
  formatMoney,
  formatRelative,
  initials,
  phaseLabel,
  statusLabel,
} from "@/lib/format";
import { PHASES, type Phase } from "@/types/api";

/**
 * Case detail.
 *
 * The stepper and the blocking state sit at the TOP of the page, not as one
 * card among many: this is the screen where "Urgency first" matters most and
 * where the previous build buried it.
 *
 * Two columns with a sticky aside, so assignee and residual value stay visible
 * while the main column scrolls. No nested panels anywhere.
 */

const TABS = ["details", "notes", "history", "documents"] as const;
type Tab = (typeof TABS)[number];

const VALUATION_PHASES: Phase[] = ["SAISIE", "VENTE", "CLOTURE"];

function Breadcrumb({ client }: { client?: string }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-body-sm flex items-center gap-1.5">
      <Link href="/cases" className="text-muted-foreground hover:text-foreground">
        Dossiers
      </Link>
      <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
      <span className="text-foreground truncate">{client ?? "Dossier"}</span>
    </nav>
  );
}

function NotesTab({ caseId, focus }: { caseId: string; focus: boolean }) {
  const notes = useCaseNotes(caseId);
  const addNote = useAddNote(caseId);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Deep-linked from a dormancy alert: move real focus, not just scroll.
    if (focus) ref.current?.focus();
  }, [focus]);

  const submit = async () => {
    if (!content.trim()) return;
    setError(null);
    try {
      await addNote.mutateAsync(content.trim());
      setContent("");
    } catch (cause) {
      setError(messageFor(cause));
    }
  };

  return (
    <div className="space-y-5">
      {/* Composer always visible, never behind a button. */}
      <div className="space-y-2">
        <label htmlFor="note" className="text-label text-muted-foreground block">
          Ajouter une note
        </label>
        <Textarea
          id="note"
          ref={ref}
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Décrivez l'action réalisée ou l'information à conserver."
        />
        {error ? (
          <p role="alert" className="text-body-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={() => void submit()} disabled={!content.trim() || addNote.isPending}>
            {addNote.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            Publier
          </Button>
        </div>
      </div>

      {notes.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : notes.isError ? (
        <ErrorState error={notes.error} onRetry={() => void notes.refetch()} />
      ) : notes.data?.length ? (
        <ul className="divide-border divide-y">
          {notes.data.map((note) => (
            <li key={note.id} className="flex gap-3 py-4">
              <span
                aria-hidden
                className="bg-panel border-border text-caption grid size-7 shrink-0 place-items-center rounded-full border font-semibold"
              >
                {initials(note.authorName)}
              </span>
              <div className="min-w-0">
                <p className="text-body-sm">
                  <span className="font-medium">{note.authorName}</span>
                  <span className="text-muted-foreground">
                    {" · "}
                    <time dateTime={note.createdAt} title={formatDateTime(note.createdAt)}>
                      {formatRelative(note.createdAt)}
                    </time>
                  </span>
                </p>
                <p className="text-body mt-1 whitespace-pre-wrap">{note.content}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-muted-foreground">
          Aucune note. Les notes constituent la trace des actions réalisées sur le dossier.
        </p>
      )}
    </div>
  );
}

function HistoryTab({ caseId }: { caseId: string }) {
  const history = useCaseHistory(caseId);

  if (history.isPending) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (history.isError) {
    return <ErrorState error={history.error} onRetry={() => void history.refetch()} />;
  }
  if (!history.data?.length) {
    return (
      <p className="text-body-sm text-muted-foreground">
        Aucun événement enregistré pour ce dossier.
      </p>
    );
  }

  // Grouped by day, with a heading per day.
  const groups = new Map<string, typeof history.data>();
  for (const event of history.data) {
    const day = formatDate(event.timestamp);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([day, events]) => (
        <section key={day}>
          <h3 className="text-label text-muted-foreground bg-card sticky top-14 z-10 py-1">
            {day}
          </h3>
          <ol className="border-border mt-2 space-y-4 border-l pl-4">
            {events.map((event, index) => (
              <li key={`${event.timestamp}-${index}`} className="relative">
                <span
                  aria-hidden
                  className="bg-primary absolute top-1.5 -left-[1.3125rem] size-2 rounded-full"
                />
                <p className="text-body-sm">
                  <span className="font-medium">{event.actor ?? "Système"}</span>
                  <span className="text-muted-foreground">
                    {" · "}
                    <time dateTime={event.timestamp}>
                      {new Intl.DateTimeFormat("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(event.timestamp))}
                    </time>
                  </span>
                </p>
                <p className="text-body mt-0.5">{event.description}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function DocumentsTab({
  caseId,
  currentPhase,
  focusUpload,
}: {
  caseId: string;
  currentPhase: Phase;
  focusUpload: boolean;
}) {
  const documents = useCaseDocuments(caseId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusUpload) ref.current?.scrollIntoView({ block: "center" });
  }, [focusUpload]);

  const byPhase = (phase: Phase) =>
    (documents.data ?? []).filter((doc) => doc.phaseUploadedIn?.startsWith(phase));

  return (
    <div className="space-y-4" ref={ref}>
      <Accordion defaultValue={[currentPhase]}>
        {PHASES.map((phase) => {
          const docs = byPhase(phase);
          const isCurrent = phase === currentPhase;
          return (
            <AccordionItem key={phase} value={phase}>
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  {PHASE_LABELS[phase]}
                  <span className="text-caption text-muted-foreground tabular">
                    {docs.length}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <DocumentList
                  documents={docs}
                  isPending={documents.isPending}
                  downloadHref={(doc) => `/api/cases/${caseId}/documents/${doc.id}/download`}
                  emptyLabel="Aucun document pour cette phase."
                />
                {/* Only the current phase carries an upload zone. */}
                {isCurrent ? (
                  <div className="mt-4">
                    <AIUploadZone caseId={caseId} phase={phase} />
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function CaseDetail({ caseId }: { caseId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const focus = params.get("focus");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "details";

  const [editing, setEditing] = useState(params.get("edit") === "1");
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const stepperRef = useRef<HTMLDivElement>(null);

  const detail = useCase(caseId);
  const prerequisites = useCasePrerequisites(caseId);
  const assignees = useAssignees();
  const advance = useAdvancePhase(caseId);
  const assign = useAssignCase(caseId);

  const phase = detail.data?.currentPhase;
  const valuation = useCaseValuation(caseId, Boolean(phase && VALUATION_PHASES.includes(phase)));

  useEffect(() => {
    if (focus === "stepper") stepperRef.current?.scrollIntoView({ block: "center" });
  }, [focus]);

  const setTab = (next: string) => {
    const merged = new URLSearchParams(params.toString());
    merged.set("tab", next);
    merged.delete("focus");
    router.replace(`/cases/${caseId}?${merged.toString()}`, { scroll: false });
  };

  const exportPdf = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await api.download(`/api/cases/${caseId}/export`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename ?? `dossier-${caseId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (detail.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (detail.isError) {
    return (
      <ErrorState
        variant="page"
        error={detail.error}
        onRetry={() => void detail.refetch()}
      />
    );
  }

  const data = detail.data;
  if (!data || !phase) return null;

  const terminal = phase === "CLOTURE";
  const blocked = prerequisites.data?.isBlocked ?? false;

  return (
    <>
      <Breadcrumb client={data.client?.fullNameOrCompany} />

      <header className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display truncate">
            {data.client?.fullNameOrCompany ?? "Dossier"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-identifier text-muted-foreground">
              {data.contract?.referenceNumber ?? "—"}
            </span>
            <Chip>{phaseLabel(phase)}</Chip>
            <Chip>{statusLabel(data.status)}</Chip>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void exportPdf()} disabled={downloading}>
            {downloading ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            Exporter
          </Button>
          <Button variant="outline" onClick={() => setEditing(true)}>
            <PenLine aria-hidden />
            Modifier
          </Button>
          {/* At the terminal phase the action is REPLACED, not disabled. */}
          {terminal ? (
            <span className="text-body-sm text-success flex items-center gap-1.5">
              Dossier clôturé
            </span>
          ) : (
            <Button
              disabled={blocked || advance.isPending}
              onClick={() => {
                setAdvanceError(null);
                advance.mutate(undefined, {
                  onError: (cause) => setAdvanceError(messageFor(cause)),
                });
              }}
            >
              {advance.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <StepForward aria-hidden />
              )}
              {prerequisites.data?.nextPhase
                ? `Passer en ${PHASE_SHORT[prerequisites.data.nextPhase]}`
                : "Avancer la phase"}
            </Button>
          )}
        </div>
      </header>

      {/* Stepper and blocker at the top, where they belong. */}
      <div ref={stepperRef} className="space-y-3">
        <PhaseStepper
          currentPhase={phase}
          prerequisites={prerequisites.data}
          className="bg-card border-border rounded-md border p-5"
        />
        {blocked && prerequisites.data ? (
          <BlockedNotice
            caseId={caseId}
            nextPhase={prerequisites.data.nextPhase}
            reasons={prerequisites.data.missingPrerequisites}
          />
        ) : null}
        {advanceError ? <ErrorState error={new Error(advanceError)} /> : null}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-6">
          {VALUATION_PHASES.includes(phase) ? (
            valuation.isPending ? (
              <ValuationCardSkeleton />
            ) : valuation.data?.marketValueCents !== undefined &&
              valuation.data?.marketValueCents !== null ? (
              <ValuationCard
                valuation={valuation.data}
                caseId={caseId}
                extracted={
                  data.vehicle
                    ? {
                        brand: data.vehicle.brand,
                        model: data.vehicle.model,
                        year: data.vehicle.year,
                      }
                    : null
                }
              />
            ) : (
              <Panel title="Estimation de valeur">
                <p className="text-body-sm text-muted-foreground">
                  Aucune estimation. Téléversez un rapport d&apos;expertise pour lancer
                  l&apos;analyse.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setTab("documents")}
                >
                  Aller aux documents
                </Button>
              </Panel>
            )
          ) : null}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 pt-4">
              <Panel title="Client">
                <DefinitionList
                  items={[
                    { label: "Nom ou raison sociale", value: data.client?.fullNameOrCompany },
                    {
                      label: "Numéro d'immatriculation",
                      value: data.client?.registrationNumber,
                      mono: true,
                    },
                    { label: "E-mail", value: data.client?.contactEmail },
                    { label: "Téléphone", value: data.client?.contactPhone },
                  ]}
                />
              </Panel>

              <Panel title="Contrat">
                <DefinitionList
                  items={[
                    { label: "Référence", value: data.contract?.referenceNumber, mono: true },
                    { label: "Statut", value: statusLabel(data.contract?.status) },
                    { label: "Date de début", value: formatDate(data.contract?.startDate) },
                    { label: "Date de fin", value: formatDate(data.contract?.endDate) },
                  ]}
                />
              </Panel>

              <Panel title="Véhicule">
                {data.vehicle ? (
                  <DefinitionList
                    items={[
                      { label: "VIN", value: data.vehicle.vin, mono: true },
                      {
                        label: "Immatriculation",
                        value: data.vehicle.licensePlate,
                        mono: true,
                      },
                      { label: "Marque", value: data.vehicle.brand },
                      { label: "Modèle", value: data.vehicle.model },
                      { label: "Année", value: data.vehicle.year },
                    ]}
                    columns={3}
                  />
                ) : (
                  <p className="text-body-sm text-muted-foreground">
                    Aucun véhicule lié à ce contrat. Liez-le depuis{" "}
                    <Link href="/leasing" className="text-primary underline underline-offset-4">
                      Clients &amp; contrats
                    </Link>
                    .
                  </p>
                )}
              </Panel>
            </TabsContent>

            <TabsContent value="notes" className="pt-4">
              <NotesTab caseId={caseId} focus={focus === "note"} />
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              <HistoryTab caseId={caseId} />
            </TabsContent>

            <TabsContent value="documents" className="pt-4">
              <DocumentsTab
                caseId={caseId}
                currentPhase={phase}
                focusUpload={focus === "upload"}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky, so assignee and residual value stay visible while scrolling. */}
        <aside className="bg-card border-border rounded-md border p-5 lg:sticky lg:top-20">
          <h2 className="text-title mb-4">Résumé</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="assignee"
                className="text-label text-muted-foreground mb-1.5 block"
              >
                Responsable
              </label>
              <Select
                value={data.assigneeId ?? "none"}
                onValueChange={(value) => {
                  if (value && value !== "none") assign.mutate(value);
                }}
              >
                <SelectTrigger id="assignee" className="w-full">
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>
                    Non assigné
                  </SelectItem>
                  {(assignees.data ?? []).map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assign.isError ? (
                <p role="alert" className="text-body-sm text-destructive mt-1.5">
                  {messageFor(assign.error)}
                </p>
              ) : null}
            </div>

            <DefinitionList
              columns={1}
              items={[
                {
                  label: "Valeur résiduelle initiale",
                  value: (
                    <span className="tabular">
                      {formatMoney(data.initialResidualValueCents, data.currencyCode)}
                    </span>
                  ),
                },
                { label: "Ouvert le", value: formatDate(data.createdAt) },
                {
                  label: "Dernière action",
                  value: formatRelative(data.lastActionAt ?? data.createdAt),
                },
                { label: "Phase depuis", value: formatDate(data.phaseStartedAt) },
              ]}
            />
          </div>
        </aside>
      </div>

      <CaseEditSheet
        open={editing}
        onOpenChange={setEditing}
        caseId={caseId}
        detail={data}
      />
    </>
  );
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={null}>
      <CaseDetail caseId={id} />
    </Suspense>
  );
}
