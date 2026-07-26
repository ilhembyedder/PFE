"use client";

import { useTheme } from "next-themes";

/**
 * Token proof surface. Phase 1 exit criterion: every colour, type role and
 * radius renders correctly in both themes.
 *
 * Development only — not linked from anywhere and removed once the design
 * system is exercised by real screens.
 */

const SURFACES = [
  ["background", "foreground", "Paper / Ink"],
  ["card", "card-foreground", "Leaf / Ink"],
  ["panel", "foreground", "Board / Ink"],
  ["secondary", "secondary-foreground", "Board / Ink"],
  ["muted", "muted-foreground", "Board / Ink Muted"],
  ["primary", "primary-foreground", "Dossier Plum / Leaf"],
  ["accent", "accent-foreground", "Plum Wash / Plum  (hover surface)"],
  ["destructive", "destructive-foreground", "Overdue Red / Leaf"],
  ["destructive-surface", "destructive", "Red surface / Red"],
  ["warning", "warning-foreground", "Approaching Amber / Leaf"],
  ["warning-surface", "warning", "Amber surface / Amber"],
  ["success", "success-foreground", "Settled Green / Leaf"],
  ["success-surface", "success", "Green surface / Green"],
  ["sidebar", "sidebar-foreground", "Sidebar / Ink Secondary"],
] as const;

const TYPE_ROLES = [
  ["text-figure-hero", "−16,4 %"],
  ["text-figure", "18 400,00 €"],
  ["text-display", "Dossiers"],
  ["text-headline", "Délais légaux par phase"],
  ["text-title", "Client & contrat"],
  ["text-body", "Le dossier est en phase de saisie du véhicule."],
  ["text-body-sm", "Dernière action il y a 3 jours"],
  ["text-label", "Valeur résiduelle initiale"],
  ["text-caption", "12 mars 2026 à 14:30"],
  ["text-identifier", "LC-2024-0892 · VF1RFA00123456789"],
] as const;

export default function TokensPage() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <main className="mx-auto max-w-5xl px-8 py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display">Token proof</h1>
          <p className="text-body-sm text-muted-foreground mt-1">
            The Open Dossier — DESIGN.md
          </p>
        </div>
        {/* Label swaps via CSS `dark:` variants rather than a `mounted`
            flag, so there is no hydration mismatch to guard against and no
            setState-in-effect. Carry this pattern to the real switcher. */}
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Basculer le thème"
          className="bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:focus-ring text-label h-9 rounded-md px-4 transition-colors"
          style={{ transitionDuration: "var(--duration-fast)" }}
        >
          <span className="dark:hidden">Thème sombre</span>
          <span className="hidden dark:inline">Thème clair</span>
        </button>
      </header>

      <section className="mb-10">
        <h2 className="text-headline mb-4">Surfaces</h2>
        <div className="grid grid-cols-2 gap-3">
          {SURFACES.map(([bg, fg, label]) => (
            <div
              key={bg}
              className="border-border rounded-md border p-4"
              style={{
                background: `var(--${bg})`,
                color: `var(--${fg})`,
              }}
            >
              <div className="text-label">{label}</div>
              <div className="text-caption mt-1 opacity-80">
                --{bg} / --{fg}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-headline mb-4">Type scale</h2>
        <div className="bg-card border-border divide-border divide-y rounded-md border">
          {TYPE_ROLES.map(([cls, sample]) => (
            <div key={cls} className="flex items-baseline gap-6 p-4">
              <code className="text-caption text-muted-foreground w-40 shrink-0">
                .{cls}
              </code>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-headline mb-4">Borders &amp; radius</h2>
        <div className="flex flex-wrap gap-4">
          {(["sm", "md", "lg"] as const).map((r) => (
            <div
              key={r}
              className="bg-card flex h-20 w-32 items-center justify-center border"
              style={{
                borderRadius: `var(--radius-${r})`,
                borderColor: "var(--input)",
              }}
            >
              <span className="text-label">radius-{r}</span>
            </div>
          ))}
          <div className="bg-card border-border-rule flex h-20 w-32 items-center justify-center rounded-md border">
            <span className="text-label">--border-rule</span>
          </div>
          <div
            className="bg-card flex h-20 w-32 items-center justify-center rounded-md"
            style={{ boxShadow: "var(--shadow-overlay)" }}
          >
            <span className="text-label">overlay</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-headline mb-4">Focus ring</h2>
        <button type="button" className="bg-card border-input text-label focus:focus-ring h-9 rounded-md border px-4">
          Tab to me
        </button>
      </section>
    </main>
  );
}
