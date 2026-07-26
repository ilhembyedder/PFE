# Product

> Strategic design context for LeasRecover. Answers who, what and why.
> Visual decisions (colour, type, spacing, components) live in [`DESIGN.md`](DESIGN.md).
> Screen layouts, states and copy live in [`docs/DESIGN_SCREENS.md`](docs/DESIGN_SCREENS.md).
> Product background and technical reference: [`README.md`](README.md). Known issues: [`docs/CODE_REVIEW.md`](docs/CODE_REVIEW.md).

## Register

product

## Users

**Sonia B., 34 — Gestionnaire de Recouvrement.** The primary user. She runs 30 to 60 active recovery cases simultaneously, each at a different phase, each with its own statutory clock. She works a full day on a desktop monitor in a normally-lit office. She is comfortable with software but is not technical, and she is French-speaking.

Her job to be done: *know what needs attention right now, act on it, and be able to prove afterwards that she did.*

What she is escaping: Excel files, scanned paper, and email threads. When an appraisal report arrives she currently reads the estimated market value out of a PDF by hand and compares it to the residual value in the original leasing contract. That takes 45 to 60 minutes per case and she has no automatic warning when a legal deadline is approaching.

**Karim T., 40 — Administrateur.** Configures the tenant before the managers arrive: user accounts, statutory delays per phase, dormancy threshold, AI deviation thresholds, company branding. He touches the product rarely but decisively, and every value he sets changes how the platform behaves for everyone else. He needs to feel confident he has configured it correctly, which means guided structure rather than a single wall of fields.

**Super Administrateur.** Platform-level. Provisions and deactivates tenants. Deliberately walled off from case content: he can create a leasing company but must never see its dossiers.

**Context that shapes everything:** the volume is 300 to 1000+ active cases per company. Nothing can be designed as though the user has five items. Density is a requirement, not a preference.

## Product Purpose

LeasRecover digitizes the full vehicle recovery workflow for leasing companies, from pre-litigation to closure, and automates the one calculation that drives the money: comparing the appraised market value of a repossessed vehicle against the residual value fixed in the original contract.

Cases move through five sequential phases. Each phase has a configurable statutory deadline. Uploading an appraisal report during the seizure phase extracts the vehicle data, computes the deviation, and produces a reliability indicator that gates the transition to sale.

**What success looks like**

- Analysis time per case drops from 45–60 minutes to under 5.
- Zero missed statutory deadlines. The platform warns before the clock runs out, every time.
- Excel is abandoned entirely, not partially.
- A manager returning from leave sees, within seconds of logging in, exactly which cases went critical while she was away.
- The valuation result is trusted enough to be acted on without re-checking the source PDF.

**What the product is not.** It is not a CRM, not an ERP module, and not a generic workflow builder. The five phases are fixed and identical for every customer. There is no process customisation. The product's opinion about how recovery works is the product.

## Brand Personality

**Composed. Precise. Institutional.**

This software sits between a leasing company and a court. It handles formal notices, seizure records, statutory delays under two legal regimes, and financial provisions. It carries an immutable audit trail that exists specifically so decisions can be defended later.

The interface should feel like a well-kept official record: authoritative, unhurried, exact. The closest emotional reference is a bank statement or a land registry, not an operations console.

**Voice**

- French. Direct. Specific. Short sentences.
- Never playful. No exclamation marks, no mascots, no encouraging copy.
- Never apologetic. Errors state what happened and what to do next.
- Never alarmist. A critical alert is stated plainly; the design carries the urgency, not the wording.
- Numbers are always shown with their source. A market value never appears without the extracted data that produced it.

**Target emotional state: confident efficiency.** Sonia should feel she is above a complex portfolio, that nothing is slipping, and that the platform is doing the heavy cognitive work for her.

| Moment | Intended feeling |
|---|---|
| Arriving in the morning | Oriented. What matters is already at the top. |
| Seeing critical alerts | Urgency without panic. |
| Waiting for the valuation | Anticipation, not anxiety. Never a bare spinner. |
| Seeing the valuation result | Impressed, then decisive. This is the signature moment. |
| Completing a phase transition | A small, clean win. |
| Hitting a blocked transition | Guided. She learns what to do, not just that she cannot proceed. |
| An extraction fails | Reassured. Specific cause, immediate retry, nothing lost. |

**Emotions to design against:** anxiety about deadlines, confusion at a blocked state, scepticism about the AI figures, frustration at a dead-end error.

## Anti-references

**Do not look like these.** Most are named explicitly in the UX specification; the last four are added from the design audit of the current build.

- **Generic ERP and CRM dashboards.** Stacked confirmation modals for routine actions, flat visual hierarchy where every element weighs the same, forms that feel bureaucratic. This product replaces those tools; it must not resemble them.
- **Legacy financial software.** Six different status colours with a legend. Once users need a legend, they stop reading colour entirely.
- **Excel.** The incumbent. Undifferentiated rows, no priority signal, nothing surfaced.
- **Single-page settings dumps.** Every configuration field on one massive page. Karim cannot configure with confidence without structure.
- **Generic error pages.** "Something went wrong." Every failure in this product has a specific cause and a specific next step.
- **Upload-and-pray.** A file input with no progress and no feedback during a 30-second wait.
- **Phantom blocking.** An action disabled with no explanation of why or how to unblock it.
- **The B2B fintech reflex palette.** Slate-900 base, blue-500 accent, on a dark shell. This is the first answer any designer or model gives for "financial dashboard," which is precisely why it is not ours.
- **Decorative gradients.** The current build has 24 gradient buttons in two subtly different blues. Gradients here carry no meaning and undermine the semantic colour discipline.
- **Glassmorphism.** Blur and translucency used as default surface treatment rather than for a specific purpose.
- **Side-stripe accents.** Coloured left borders on cards, alerts and nav items. Never the right answer; use full borders, background tints, or leading icons.

## Design Principles

**1. Urgency first.** Every screen states what needs attention now, without the user searching for it. Priority is a layout decision before it is a colour decision. With 60 concurrent cases, anything that requires scanning to find the important item has failed.

**2. The result is the product.** The valuation comparison is the reason this platform exists and the moment that justifies it. It is a signature component, not a data readout, and it appears only where it matters: inside a case at the point of the sale decision, never on the general dashboard. Everything else in the interface may recede; this may not.

**3. Actions, not options.** Every state points to the next step. A blocked phase transition explains what is missing and links directly to the thing that resolves it. A failed extraction offers an immediate retry. The user is never left holding a problem without a handle.

**4. Invisible compliance.** Statutory delays, audit trails and phase prerequisites run in the background. The user should feel protected by the rules, never obstructed by them. Compliance surfaces only as a timely warning or a clear explanation, never as friction or as paperwork.

**5. Earned familiarity.** In a tool people use all day, strangeness is a cost. Navigation, breadcrumbs, tables, tabs and forms follow established conventions exactly, because predictability is what makes the tool disappear into the task. Distinctiveness is spent where it is free: the surface, the ink, the typeface, and the one reveal that earns a moment.

## Accessibility & Inclusion

**Target: WCAG 2.1 Level AA.** This is the documented requirement (PRD NFR22) and is treated as a release gate, not an aspiration. The current build does not meet it.

| Requirement | Commitment |
|---|---|
| **Contrast** | ≥ 4.5:1 for body text, ≥ 3:1 for large text, icons and UI boundaries. Every pairing verified, including disabled and placeholder states. |
| **Never colour alone** | Every semantic state carries icon **and** colour **and** text label. Phase tags, reliability indicators and alert criticality all fail this today. |
| **Focus** | A visible focus ring on every interactive element, in the accent colour, meeting 3:1 against both adjacent surfaces. |
| **Keyboard** | Every workflow completable without a mouse, including upload, phase transition and PDF export. Logical tab order. Escape closes overlays. |
| **Screen readers** | Semantic landmarks (`main`, `nav`, `aside`, `header`). `aria-label` on every icon-only control. The valuation card is a labelled region; extraction progress is an `aria-live="polite"` region; a critical alert is `role="alert"`, a moderate one `role="status"`. |
| **Motion** | `prefers-reduced-motion` fully honoured. No essential information conveyed only through animation. |
| **Minimum type size** | 13px for any readable content. |
| **Forms** | Explicit `<label for>` on every input. No placeholder-only fields. Errors linked via `aria-describedby`, stated in text. |
| **Colour vision** | The reliability indicator and the alert hierarchy must remain unambiguous under deuteranopia and protanopia simulation. |
| **Touch targets** | 44×44px minimum on tablet. |

**Language and locale.** The product language is **French**. The document language must be declared as `fr`, the component library localised to French, and every enum value mapped to a French label rather than rendered raw. Currency is per-tenant (TND and EUR both in use) and must never be hardcoded. Dates and numbers follow French formatting.

**Platform.** Desktop-first, and unapologetically so: this is an all-day professional tool used on a monitor. Tablet is fully functional. Mobile is consultation-only and out of MVP scope.

---

## Recorded decisions

Decisions taken during design setup that supersede earlier project documents.

| Decision | Rationale | Consequence |
|---|---|---|
| **Light theme is the default**, with dark as a genuine opt-in | Derived from the physical scene: an all-day desktop session in a normally-lit office reading dense financial tables. Red and amber also cut through far better on a light ground, which matters in a deadline tool. | Matches the UX spec's own chosen Direction A, which was never built. The current dark-only implementation is replaced. |
| **Move off Ant Design** to Tailwind + Radix/shadcn | Full token control, no v5/v6 drift, components owned in-repo rather than themed around. | Substantial. `Table` (server pagination, sorting, filtering), `Steps`, `Timeline`, `Upload` and `Form` validation must be rebuilt on TanStack Table and react-hook-form. |
| **TypeScript from the first file** | shadcn is TypeScript-first, so this removes friction rather than adding it. Typed API responses also close a drift finding: `architecture.md` mandated OpenAPI-generated types that were never produced. | API types are hand-written per domain, mirroring the backend DTOs, until a spec generator exists. |
| **TanStack Query v5 owns all server state** | Every loading, empty and error state in the screen specs is driven by a query state. Backend alert auto-healing in particular requires disciplined cache invalidation to stay visually correct. | No Redux, Zustand or Jotai. The URL owns navigational state, `useState` owns ephemeral state. `branding-context.js` is deleted: branding is server data. Specified in `docs/DESIGN_SCREENS.md` §12. |
| **Light and dark ship together** | Once the token layer exists the second theme is a second block of custom properties plus a `next-themes` provider. Deferring it would only create a migration later. | Light stays the default. No component or Tailwind changes required for dark. |
| **The UX specification is superseded, not revised** | The new direction is derived from the product rather than from the existing UI. | `ux-design-specification.md` remains as the historical record of the original direction. `PRODUCT.md`, `DESIGN.md` and `docs/DESIGN_SCREENS.md` are authoritative from here. Worth adding a pointer note to that file and to `architecture.md` so the contradiction reads as a decision rather than an oversight. |
| **All nine screens are in scope** | Login, admin tenants, case registry, case detail, case creation, leasing registry, and both settings pages. | The redesign is a full frontend rebuild, not a reskin. |
