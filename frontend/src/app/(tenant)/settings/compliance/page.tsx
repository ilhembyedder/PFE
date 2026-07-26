"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip, chipIcons } from "@/components/ui/chip";
import { NumericInput } from "@/components/ui/numeric-input";
import { Panel } from "@/components/states/panel";
import { ErrorState, messageFor } from "@/components/states/error-state";
import {
  useTenantConfig,
  useThresholds,
  useUpdateTenantConfig,
  useUpdateThresholds,
} from "@/lib/query/hooks";
import { PHASE_LABELS } from "@/lib/format";
import { PHASES, type Phase } from "@/types/api";

/**
 * Compliance thresholds.
 *
 * Seven numbers that change how the platform behaves for everyone in the
 * tenant. Grouped and explained, with a live consequence readout: a number
 * without its consequence is exactly the configuration that gets set wrong
 * once and discovered six months later.
 */

// The last phase has no deadline of its own: it is terminal.
const DELAY_PHASES = PHASES.filter((phase) => phase !== "CLOTURE");

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

export default function CompliancePage() {
  const config = useTenantConfig();
  const thresholds = useThresholds();
  const updateConfig = useUpdateTenantConfig();
  const updateThresholds = useUpdateThresholds();

  const [dormancy, setDormancy] = useState<number | null>(null);
  const [delays, setDelays] = useState<Partial<Record<Phase, number | null>>>({});
  const [moderate, setModerate] = useState<number | null>(null);
  const [critical, setCritical] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [partial, setPartial] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const pending = config.isPending || thresholds.isPending;

  if (pending) {
    return (
      <div className="max-w-[720px] space-y-5">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (config.isError || thresholds.isError) {
    return (
      <ErrorState
        variant="page"
        error={config.error ?? thresholds.error}
        onRetry={() => {
          void config.refetch();
          void thresholds.refetch();
        }}
      />
    );
  }

  // Server values are the baseline; local state overrides once touched.
  const dormancyValue = touched ? dormancy : (config.data?.dormancyThresholdDays ?? null);
  const delayFor = (phase: Phase) =>
    touched && phase in delays
      ? (delays[phase] ?? null)
      : (config.data?.phaseLegalDelays?.[phase] ?? null);
  const moderateValue = touched ? moderate : toNumber(thresholds.data?.aiDeviationModerate);
  const criticalValue = touched ? critical : toNumber(thresholds.data?.aiDeviationCritical);

  const begin = () => {
    if (touched) return;
    setDormancy(config.data?.dormancyThresholdDays ?? null);
    setDelays(
      Object.fromEntries(
        DELAY_PHASES.map((phase) => [phase, config.data?.phaseLegalDelays?.[phase] ?? null]),
      ) as Partial<Record<Phase, number | null>>,
    );
    setModerate(toNumber(thresholds.data?.aiDeviationModerate));
    setCritical(toNumber(thresholds.data?.aiDeviationCritical));
    setTouched(true);
  };

  const bandsInvalid =
    moderateValue !== null && criticalValue !== null && moderateValue >= criticalValue;

  const validate = (): string[] => {
    const found: string[] = [];
    if (dormancyValue === null || dormancyValue <= 0) {
      found.push("Le seuil de dormance doit être un nombre de jours positif.");
    }
    for (const phase of DELAY_PHASES) {
      const value = delayFor(phase);
      if (value === null || value <= 0) {
        found.push(`Le délai de la phase « ${PHASE_LABELS[phase]} » doit être positif.`);
      }
    }
    if (moderateValue === null || moderateValue < 0 || moderateValue > 100) {
      found.push("Le seuil d'écart modéré doit être compris entre 0 et 100.");
    }
    if (criticalValue === null || criticalValue < 0 || criticalValue > 100) {
      found.push("Le seuil d'écart critique doit être compris entre 0 et 100.");
    }
    if (bandsInvalid) {
      found.push("Le seuil modéré doit être strictement inférieur au seuil critique.");
    }
    return found;
  };

  const submit = async () => {
    setPartial(null);
    setSaved(false);
    const found = validate();
    setErrors(found);
    if (found.length) return;

    // Two independent endpoints. If one fails the other's success must be
    // preserved and reported precisely, not collapsed into a generic failure.
    const results = await Promise.allSettled([
      updateConfig.mutateAsync({
        dormancyThresholdDays: dormancyValue as number,
        phaseLegalDelays: Object.fromEntries(
          DELAY_PHASES.map((phase) => [phase, delayFor(phase) as number]),
        ),
      }),
      updateThresholds.mutateAsync({
        aiDeviationModerate: moderateValue as number,
        aiDeviationCritical: criticalValue as number,
      }),
    ]);

    const failedDelays = results[0].status === "rejected";
    const failedThresholds = results[1].status === "rejected";

    if (failedDelays && failedThresholds) {
      setPartial(messageFor((results[0] as PromiseRejectedResult).reason));
    } else if (failedDelays) {
      setPartial(
        `Les seuils d'écart IA ont été enregistrés, mais les délais n'ont pas pu l'être : ${messageFor(
          (results[0] as PromiseRejectedResult).reason,
        )}`,
      );
    } else if (failedThresholds) {
      setPartial(
        `Les délais ont été enregistrés, mais les seuils d'écart IA n'ont pas pu l'être : ${messageFor(
          (results[1] as PromiseRejectedResult).reason,
        )}`,
      );
    } else {
      setTouched(false);
      setSaved(true);
    }
  };

  const busy = updateConfig.isPending || updateThresholds.isPending;

  return (
    <div className="max-w-[720px] space-y-5">
      <Panel title="Dormance">
        <p className="type-body-sm text-muted-foreground mb-4">
          Un dossier sans action pendant cette durée déclenche une alerte.
        </p>
        <div className="max-w-[200px] space-y-1.5">
          <Label htmlFor="dormancy">Seuil de dormance</Label>
          <NumericInput
            id="dormancy"
            integer
            suffix="jours"
            value={dormancyValue}
            onValueChange={(value) => {
              begin();
              setDormancy(value);
            }}
            min={1}
          />
        </div>
      </Panel>

      <Panel title="Délais légaux par phase">
        <p className="type-body-sm text-muted-foreground mb-4">
          Durée maximale d&apos;une phase avant alerte d&apos;échéance. Une alerte
          d&apos;avertissement est émise 2 jours avant l&apos;expiration.
        </p>
        <div className="space-y-3">
          {DELAY_PHASES.map((phase) => (
            <div key={phase} className="flex items-center justify-between gap-4">
              <Label htmlFor={`delay-${phase}`} className="type-body-sm font-normal">
                {PHASE_LABELS[phase]}
              </Label>
              <div className="w-[180px]">
                <NumericInput
                  id={`delay-${phase}`}
                  integer
                  suffix="jours"
                  value={delayFor(phase)}
                  onValueChange={(value) => {
                    begin();
                    setDelays((previous) => ({ ...previous, [phase]: value }));
                  }}
                  min={1}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Seuils d'écart IA">
        <p className="type-body-sm text-muted-foreground mb-4">
          Détermine l&apos;indicateur de fiabilité affiché sur chaque estimation.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="moderate">Écart modéré à partir de</Label>
            <NumericInput
              id="moderate"
              suffix="%"
              value={moderateValue}
              onValueChange={(value) => {
                begin();
                setModerate(value);
              }}
              min={0}
              max={100}
              aria-invalid={bandsInvalid}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="critical">Écart critique à partir de</Label>
            <NumericInput
              id="critical"
              suffix="%"
              value={criticalValue}
              onValueChange={(value) => {
                begin();
                setCritical(value);
              }}
              min={0}
              max={100}
              aria-invalid={bandsInvalid}
            />
          </div>
        </div>

        {/* The consequence preview: the values restated as the outcome they
            produce, using the real chips. */}
        <div className="bg-background border-border mt-5 rounded-md border p-4">
          <p className="type-label text-muted-foreground mb-3">Résultat de cette configuration</p>
          {bandsInvalid ? (
            <p role="alert" className="type-body-sm text-destructive">
              Configuration invalide : le seuil modéré doit être inférieur au seuil
              critique.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="type-body-sm inline-flex items-center gap-1.5">
                <Chip tone="success" icon={chipIcons.success}>
                  Fiable
                </Chip>
                <span className="text-muted-foreground tabular">
                  écart &lt; {moderateValue ?? "—"}&nbsp;%
                </span>
              </span>
              <span className="type-body-sm inline-flex items-center gap-1.5">
                <Chip tone="warning" icon={chipIcons.warning}>
                  Écart modéré
                </Chip>
                <span className="text-muted-foreground tabular">
                  de {moderateValue ?? "—"} à {criticalValue ?? "—"}&nbsp;%
                </span>
              </span>
              <span className="type-body-sm inline-flex items-center gap-1.5">
                <Chip tone="critical" icon={chipIcons.critical}>
                  Écart critique
                </Chip>
                <span className="text-muted-foreground tabular">
                  &ge; {criticalValue ?? "—"}&nbsp;%
                </span>
              </span>
            </div>
          )}
        </div>
      </Panel>

      {errors.length ? (
        <div
          role="alert"
          className="bg-destructive-surface border-destructive-border rounded-md border p-4"
        >
          <p className="type-body-sm text-destructive font-semibold">
            {errors.length} valeur{errors.length > 1 ? "s" : ""} à corriger
          </p>
          <ul className="type-body-sm mt-1 list-disc space-y-0.5 pl-4">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {partial ? <ErrorState error={new Error(partial)} /> : null}

      <div className="flex items-center justify-end gap-3">
        {touched ? (
          <span className="type-body-sm text-muted-foreground">
            Modifications non enregistrées
          </span>
        ) : saved ? (
          <span className="type-body-sm text-success" role="status">
            Enregistré
          </span>
        ) : null}
        <Button onClick={() => void submit()} disabled={!touched || busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
