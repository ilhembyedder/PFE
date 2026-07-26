---
name: LeasRecover
description: The visual system for a leasing-recovery platform that reads like an official record, not an operations console.
colors:
  paper: "#FAF5F8"
  surface: "#FEFCFD"
  panel: "#F1EBEE"
  border-subtle: "#E5DFE3"
  border: "#D3CBD0"
  border-strong: "#91898E"
  ink-muted: "#746C71"
  ink-secondary: "#5B5258"
  ink: "#20171D"
  plum: "#633481"
  plum-hover: "#521D71"
  plum-subtle: "#F3EBFA"
  plum-border: "#E1D0EE"
  critical: "#B71824"
  critical-surface: "#FFECE9"
  critical-border: "#FDC9C4"
  warning: "#975800"
  warning-surface: "#FDF1D9"
  warning-border: "#F2D5A5"
  success: "#00713E"
  success-surface: "#E1F8EB"
  success-border: "#BAE3CA"
  dark-paper: "#151013"
  dark-surface: "#201A1D"
  dark-panel: "#0D090B"
  dark-border: "#383035"
  dark-border-strong: "#6F666B"
  dark-ink: "#F0EBEE"
  dark-ink-secondary: "#B0A8AD"
  dark-ink-muted: "#857E82"
  dark-plum: "#BE8CE1"
  dark-critical: "#F66D67"
  dark-warning: "#E8AA4E"
  dark-success: "#61C28E"
typography:
  figure-hero:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  figure:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  body-sm:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  caption:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.01em"
  identifier:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  sm: "3px"
  md: "5px"
  lg: "8px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.plum}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.plum-hover}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-danger:
    backgroundColor: "{colors.critical}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  tag-neutral:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  tag-critical:
    backgroundColor: "{colors.critical-surface}"
    textColor: "{colors.critical}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  tag-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  tag-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "34px"
  nav-item-active:
    backgroundColor: "{colors.plum-subtle}"
    textColor: "{colors.plum}"
  table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0 16px"
    height: "48px"
  table-header:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0 16px"
    height: "36px"
---

# Design System: LeasRecover

> Visual specification. Strategy, users and principles live in [`PRODUCT.md`](PRODUCT.md).
> This system is **designed, not extracted**: it describes the target, not the code as it stands today. The current build predates it and violates most of it.

## 1. Overview

**Creative North Star: "The Open Dossier"**

A case file laid open on a desk. Warm paper stock, ink that has dried into it, tabbed sections, a chronological record you can trust because it is complete. Everything findable, nothing decorated. That is the object this software is trying to be, and the object it is replacing: the incumbent here is not a competing SaaS product, it is a paper folder and a spreadsheet.

The register is deliberately institutional. This platform sits between a leasing company and a court, handling formal notices, seizure records and statutory deadlines under two legal regimes, carrying an immutable audit trail that exists so decisions can be defended later. It should feel like a well-kept official record: authoritative, unhurried, exact. The emotional reference is a bank statement or a land registry.

This explicitly rejects the reflex answer for its own category. **No slate-900 shell, no blue-500 accent, no dark operations-console theme.** That palette is the first thing anyone reaches for when told "financial dashboard," which is exactly the reason it is not ours. It also rejects the decoration the current build accumulated: twenty-four gradient buttons, five glassmorphic surfaces, coloured left-border stripes. None of it means anything, and in a product whose core discipline is *colour only ever signals state*, decoration is not neutral, it is corrosive.

Where it does not reject convention is structure. Side navigation, breadcrumbs, dense tables, tabs and standard forms are used exactly as expected. In a tool someone operates for eight hours a day, strangeness is a cost paid every day. Distinctiveness is spent only where it is free: the ground, the ink, the typeface, and the single reveal that earns a moment.

**Key Characteristics:**
- Warm paper ground, ink text. Light by default; dark is a real second theme, not an afterthought.
- Restrained colour. One plum accent under 10% of any screen; everything else chromatic is semantic state.
- Flat surfaces separated by hairlines. Shadows only for things genuinely floating.
- Dense but breathable. 48px table rows, designed to scan 60 cases without scrolling.
- Tabular figures everywhere a number can be compared vertically.
- One family, IBM Plex Sans, carrying the entire interface.
- Motion under 200ms, except once.

## 2. Colors: The Dossier Palette

Warm rose-tinted neutrals carrying near-black ink, with a single deep plum accent and a semantic triad that is legible rather than bright.

Canonical values are OKLCH; the frontmatter carries sRGB hex for tooling compatibility. Neutrals are tinted to hue 340 at chroma 0.006–0.018, which reads as warm paper rather than cool grey without ever becoming pink. Nothing in this system is `#000` or `#fff`.

### Primary

- **Dossier Plum** (`#633481` / `oklch(42% 0.13 310)`): The only non-semantic colour in the system. Primary buttons, the active navigation item, current selection, links, and every focus ring. Chosen because it must not collide with the red/amber/green semantic triad, and because it reads institutional, closer to a wax seal or a ledger binding than to a technology brand. 8.38:1 on paper, so it is legible as text and as a border, not merely as a fill.
- **Plum Deep** (`#521D71` / `oklch(35.5% 0.14 310)`): Hover and pressed states on primary surfaces.
- **Plum Wash** (`#F3EBFA` / `oklch(95% 0.022 310)`): The active navigation background and the selected table row. Never a decorative fill.
- **Plum Hairline** (`#E1D0EE` / `oklch(88% 0.045 310)`): Border of a selected or focused container.

### Secondary

There is no secondary accent. This is a deliberate omission, not an oversight. See **The One Voice Rule**.

### Tertiary

The semantic triad. These are states, never styling. Each is paired with an icon and a text label at every point of use, so meaning survives colour blindness and greyscale printing.

- **Overdue Red** (`#B71824` / `oklch(50% 0.19 25)`): Critical only. A breached statutory deadline, a dormant case, a blocked transition, a destructive action. Nothing else may be red. 6.16:1 on paper.
- **Approaching Amber** (`#975800` / `oklch(52% 0.13 70)`): A deadline within its warning window, a moderate valuation deviation, a vehicle discrepancy. 5.25:1 on paper.
- **Settled Green** (`#00713E` / `oklch(48% 0.12 155)`): A completed phase, a reliable valuation, a successful action. 5.71:1 on paper.
- Each has a **surface** (`#FFECE9`, `#FDF1D9`, `#E1F8EB`) for banner and tag backgrounds, and a **border** (`#FDC9C4`, `#F2D5A5`, `#BAE3CA`) for their hairline. Text on its own surface clears 5:1 in all three cases.

### Neutral

- **Paper** (`#FAF5F8` / `oklch(97.5% 0.006 340)`): The application background. Warm, very slightly rosy, never clinical white.
- **Leaf** (`#FEFCFD` / `oklch(99.2% 0.003 340)`): Cards, panels, table body, dialogs. Sits *above* paper by being lighter. This inversion, content lighter than ground, is what makes panels read as sheets on a desk.
- **Board** (`#F1EBEE` / `oklch(94.5% 0.008 340)`): The second neutral layer. Sidebar, toolbars, table headers. Deeper than paper, so navigation recedes behind content without becoming a dark slab.
- **Hairline** (`#E5DFE3`) and **Rule** (`#D3CBD0`): Decorative separators, table row dividers, card edges. Low contrast on purpose.
- **Edge** (`#91898E` / `oklch(64% 0.012 340)`): Form control boundaries only. 3.14:1 on paper, which is the non-text contrast minimum. Inputs, checkboxes and select triggers use this; row dividers must not.
- **Ink Muted** (`#746C71`): Placeholders, disabled labels, timestamps. 4.73:1, so it is still real text.
- **Ink Secondary** (`#5B5258`): Field labels, metadata, secondary columns. 6.96:1.
- **Ink** (`#20171D`): All primary content. 16.16:1 on paper. Near-black with a warm cast, the colour of a document rather than of a screen.

### Dark theme

Same hues, inverted lightness, recomputed for contrast rather than algorithmically flipped. Ground `#151013`, panels `#0D090B`, sheets `#201A1D`, ink `#F0EBEE` at 16.01:1. The accent lightens to `#BE8CE1` (7.22:1) and the semantic triad lightens with it. Dark is a genuine second theme, opt-in for late sessions, and it is never the default: the physical scene is an all-day desktop session in a normally-lit office reading dense financial tables.

### Named Rules

**The One Voice Rule.** Exactly one non-semantic colour exists in this system, and it appears on no more than 10% of any screen. Its rarity is what makes an active nav item or a primary button unmistakable. If a screen needs a second accent, the screen has a hierarchy problem, not a palette problem.

**The Signal Rule.** Red, amber and green are reserved. They may only appear where they carry state. A red that means "brand" or "emphasis" destroys the red that means "this deadline has passed." Every use of the triad carries an icon and a text label alongside the colour, always.

**The Verified Contrast Rule.** No colour enters this system until its ratio is computed against every surface it will sit on. This is not a formality: the previous specification's five core colours all fail AA as text on white (`#EF4444` at 3.76, `#F59E0B` at 2.15, `#10B981` at 2.54, `#3B82F6` at 3.68, `#94A3B8` at 2.56) while claiming every combination had been verified. Bright is not the same as legible.

## 3. Typography

**Display Font:** IBM Plex Sans (with `system-ui, sans-serif`)
**Body Font:** IBM Plex Sans (with `system-ui, sans-serif`)
**Label/Mono Font:** IBM Plex Mono (with `ui-monospace, monospace`), for identifiers only

**Character:** One family carries the entire interface. Plex was drawn for an institution rather than for a startup, and it shows: slightly mechanical, unfussy, with real tabular figures and complete French diacritics. It is familiar enough to disappear into the task and specific enough not to be the Inter reflex that every product in this category reaches for. Plex Mono appears in exactly three places, and only where a string is meant to be compared character by character.

### Hierarchy

The UI scale is deliberately tight, roughly 1.2 between steps. A dense product screen has far more type roles than a marketing page, and exaggerated contrast between them reads as noise. The hierarchy is carried by weight and colour as much as by size. All the contrast this system needs is spent in one place: the valuation figure, which leaps to 40px because it is the one number the product exists to produce.

- **Figure Hero** (600, 40px / 2.5rem, 1.0, -0.02em, tabular): The valuation deviation, and nothing else. One per screen, in one place in the product.
- **Figure** (600, 24px / 1.5rem, 1.1, -0.01em, tabular): Market value and residual value inside the valuation card. Supporting inputs to the hero figure, deliberately smaller than it.
- **Display** (600, 28px / 1.75rem, 1.2): Page titles.
- **Headline** (600, 20px / 1.25rem, 1.3): Section headers.
- **Title** (600, 16px / 1rem, 1.4): Card and panel titles.
- **Body** (400, 14px / 0.875rem, 1.6): Default. Prose caps at 70ch; table and panel content may run denser.
- **Body Small** (400, 13px / 0.8125rem, 1.5): Secondary columns, metadata, helper text. This is the floor.
- **Label** (500, 12px / 0.75rem, 1.4, +0.01em): Form labels, table headers, tags. Sentence case, never all-caps.
- **Caption** (400, 11px / 0.6875rem, 1.4, +0.01em): Timestamps and footnotes only. Never for anything a user must read to complete a task.
- **Identifier** (Plex Mono, 400, 13px / 0.8125rem, -0.01em): Case references, VIN, licence plates. Never money, never dates.

### Named Rules

**The Ledger Rule.** Every number that can be compared vertically is set in tabular figures (`font-variant-numeric: tabular-nums`). Currency in table cells, deviation percentages, dates, case counts. In a sixty-row table of amounts, proportional digits are a defect: the eye cannot compare columns whose digits do not align. This is functional, not stylistic, and it is not optional.

**The Sourced Number Rule.** A figure never appears without its provenance within the same visual block. A market value is always accompanied by the extracted brand, model, year and mileage that produced it. An unsourced number in a financial tool invites scepticism, and scepticism is the emotion this product most needs to avoid.

**The Thirteen Pixel Floor.** No readable content below 13px. Caption at 11px is permitted only for timestamps and footnotes, never for a value, a label or an instruction.

## 4. Elevation

This system is flat. Surfaces are separated by hairlines and by tonal layering, not by shadow. Board recedes, Paper is the ground, Leaf sits above it, and the entire hierarchy of a screen is legible without a single shadow being cast. This is what makes the interface read as sheets of paper rather than as floating glass panels, and it is the direct antidote to the five glassmorphic surfaces in the current build.

Shadow is reserved for elements that genuinely float above the page and will be dismissed: dropdowns, popovers, tooltips, dialogs and toasts. In those cases the shadow is doing real work, communicating that the element is transient and above everything else. A card does not float. A table does not float. A sidebar does not float.

### Shadow Vocabulary

- **Overlay** (`box-shadow: 0 4px 12px -2px rgba(32, 23, 29, 0.10), 0 2px 4px -2px rgba(32, 23, 29, 0.06)`): Dropdowns, select menus, popovers, tooltips. Tinted with the ink hue rather than pure black, so it reads warm against paper.
- **Dialog** (`box-shadow: 0 16px 40px -8px rgba(32, 23, 29, 0.18), 0 4px 12px -4px rgba(32, 23, 29, 0.10)`): Modal dialogs and drawers only.
- **Focus** (`box-shadow: 0 0 0 3px rgba(99, 52, 129, 0.20)`): The soft halo behind a focus ring. Paired with, never replacing, the 2px solid outline.

### Named Rules

**The Paper Rule.** Surfaces are flat at rest and separated by 1px hairlines. A shadow means the element is *actually floating and dismissible*. If it cannot be dismissed, it does not cast a shadow. Cards, panels, tables, sidebars and headers are flat, permanently.

**The No Glass Rule.** `backdrop-filter` is prohibited except on a modal scrim. Translucency and blur used as surface decoration are forbidden outright. Audit test: if a panel's background shifts when the content behind it scrolls, it is wrong.

## 5. Components

Every interactive component ships with all seven states: default, hover, focus-visible, active, disabled, loading, error. A component with four of them is unfinished and must not merge.

### Buttons

- **Shape:** Gently squared (5px radius), 36px tall for standard actions, 32px for compact and ghost. Never pill-shaped.
- **Primary:** Dossier Plum fill (`#633481`), Leaf text, 16px horizontal padding, Label typography at weight 500. One primary action per view. Two primaries on a screen means the hierarchy has not been decided.
- **Secondary:** Leaf fill, Ink text, 1px Edge border. The default for most actions.
- **Ghost:** No fill, no border, Ink Secondary text. Toolbar and table row actions.
- **Danger:** Overdue Red fill, Leaf text. Deactivation and deletion only.
- **Hover:** Background steps one level (`#521D71` for primary, Board for secondary). 120ms. No lift, no scale, no shadow.
- **Focus:** 2px solid Plum outline at 2px offset, plus the Focus halo. Identical on every interactive element in the system.
- **Disabled:** 45% opacity, `cursor: not-allowed`. A disabled button is always accompanied by text explaining what would enable it, per PRODUCT.md's *Actions, not options*.
- **Loading:** Inline 14px spinner replacing the leading icon; the label stays visible and the width does not change.
- **Prohibited:** gradients of any kind, uppercase text, letter-spacing above 0.02em, icon-only buttons without `aria-label`.

### Chips

Used for phase, status, alert criticality and reliability. Small (11px Caption, 2px/8px padding, 3px radius), never interactive unless they are filters.

- **Style:** Semantic surface fill with semantic text and a 1px semantic border. Neutral variant uses Board with Ink Secondary.
- **Composition:** Always icon + colour + text. A chip that conveys state through colour alone is a defect, not a style choice.
- **State:** Filter chips carry a Plum Wash background with a Plum Hairline border when selected. Unselected filter chips are neutral, never a faded version of the accent.

### Cards / Containers

- **Corner Style:** 5px radius. 8px for dialogs.
- **Background:** Leaf on Paper.
- **Shadow Strategy:** None. See **The Paper Rule**.
- **Border:** 1px Hairline.
- **Internal Padding:** 20px, 16px on compact variants.
- **Prohibited:** nested cards, absolutely. A card inside a card means the outer container should have been a section with a heading. Uniform grids of identical icon-plus-heading-plus-text cards are also prohibited; if the content is a list, render a list.

### Inputs / Fields

- **Style:** Leaf fill, 1px Edge border (`#91898E`, the 3:1 boundary), 5px radius, 36px tall, 12px horizontal padding, Body typography.
- **Label:** Always present, always above the field, Label typography in Ink Secondary. Placeholder-only fields are prohibited.
- **Focus:** Border becomes Plum, plus the 2px outline and Focus halo. 120ms.
- **Error:** Border becomes Overdue Red, message below the field in Body Small with a leading alert icon, wired via `aria-describedby`. Never colour alone.
- **Disabled:** Board fill, Ink Muted text, Rule border.
- **Numeric fields** (residual value, thresholds, delays) use tabular figures and are right-aligned.

### Navigation

- **Style:** Fixed 240px sidebar on Board, collapsing to 56px icons at tablet and to a drawer below 768px. Structural, breakpoint-driven collapse, not a manual toggle.
- **Items:** 34px tall, 5px radius, 12px padding, Body typography in Ink Secondary.
- **Hover:** Background lifts to Leaf.
- **Active:** Plum Wash background with Plum text and a Plum leading icon.
- **Prohibited:** the coloured left-border stripe currently used to mark the active item. The active state is a filled shape, not a stripe.
- **Breadcrumb:** Body Small in Ink Muted with `/` separators, current page in Ink. Present on every detail view: `Dossiers / Dupont Logistics / LC-2024-0892`.

### Data table

The workhorse of this product and the reason density matters.

- **Header:** 36px, Paper background, Label typography in Ink Muted, sticky.
- **Row:** 48px, Leaf background, 1px Hairline bottom divider, 16px cell padding.
- **Hover:** Row background shifts to Paper. No shadow, no scale, no border change.
- **Selected:** Plum Wash background.
- **Numeric columns:** right-aligned, tabular figures.
- **Loading:** skeleton rows matching the real row height. Never a spinner over an empty table, and never an empty state while a request is still in flight.
- **Empty:** a sentence explaining what would populate the table and a primary action that starts it. "Aucun dossier" alone is a failure.

### AI Valuation Card (signature)

The single most important component in the product and the only place that earns a moment. It appears exclusively inside a case at the sale-decision point, never on a dashboard.

- **Structure:** the deviation is the hero at 40px Figure Hero; market value and residual value sit beneath at 24px Figure as the inputs that produced it. Three equal numbers would be three facts; this hierarchy is an answer.
- **Colour:** the reliability band tints only the deviation figure and its chip, using the semantic triad. The card surface stays Leaf. A critical deviation does not turn the whole card red.
- **Provenance:** extracted brand, model, year, mileage and condition are shown inside the same block, per **The Sourced Number Rule**.
- **Reveal:** a 300ms fade with a 6px upward translate on `ease-out-quart`, the only animation in the product permitted above 200ms. Under `prefers-reduced-motion` it becomes a plain opacity fade.
- **Semantics:** `role="region"` with an `aria-label` naming the vehicle.
- **Prohibited:** it must not become the hero-metric template. No big-number-plus-sparkline-plus-three-supporting-stats, no gradient, no glass.

### Phase stepper (signature)

Five sequential phases with explicit locked and unlocked states.

- Completed steps carry Settled Green with a check icon; the current step carries Plum; future steps are Ink Muted on Board.
- A blocked next step shows a lock icon in Overdue Red, `aria-disabled="true"`, and a tooltip listing every unmet prerequisite as text.
- The blocking reason is *also* rendered inline below the stepper, not only in a tooltip. A tooltip is not an accessible home for information the user needs to act.

### Motion

150–250ms across the interface on `ease-out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`). Hover and focus at 120ms; state changes, tab switches and disclosure at 180ms. Motion conveys state and nothing else: no entrance choreography, no page-load sequences, no parallax, no decorative transitions. Only `opacity` and `transform` are animated. `prefers-reduced-motion: reduce` collapses every duration to 0.01ms and keeps opacity fades only.

### Named Rules

**The One Moment Rule.** Exactly one animation in this product exceeds 200ms: the valuation reveal, at 300ms. Everything else is state feedback, fast enough to feel instant. A product used for eight hours a day must never make its user wait for choreography.

**The Seven States Rule.** Default, hover, focus-visible, active, disabled, loading, error. Every interactive component, every time. Shipping four of them is shipping a bug.

**The One Vocabulary Rule.** A save button looks identical on every screen. One upload implementation, one error-surfacing pattern, one empty state pattern, one date format. The current build has three upload implementations and four ways of reporting an error; each divergence is a defect to be closed, not a variation to be preserved.

## 6. Do's and Don'ts

### Do:

- **Do** use OKLCH as the canonical colour format, with hue 340 for neutrals at chroma 0.006–0.018 and hue 310 for the accent.
- **Do** verify every text and background pairing against WCAG AA (4.5:1 body, 3:1 large text and UI boundaries) before adding a colour, and record the ratio.
- **Do** use `#91898E` (Edge) for form control boundaries and `#D3CBD0` (Rule) for decorative dividers. They are not interchangeable: only one of them meets the 3:1 requirement.
- **Do** pair every semantic colour with an icon and a text label, everywhere, without exception.
- **Do** set every vertically comparable number in tabular figures.
- **Do** show extracted source data alongside any AI-produced value.
- **Do** keep the accent under 10% of any screen.
- **Do** ship all seven interaction states on every component.
- **Do** use skeletons that match real row heights for loading, never a spinner over content.
- **Do** write empty states that teach the interface and offer the action that resolves them.
- **Do** use conventional patterns for navigation, breadcrumbs, tables, tabs and forms. Predictability is the feature.
- **Do** default to light. Ship dark as a real, fully specified second theme.
- **Do** declare `lang="fr"`, localise the component library to French, and map every enum to a French label.
- **Do** honour `prefers-reduced-motion` completely.

### Don't:

- **Don't** use the B2B fintech reflex palette: slate-900 shell, blue-500 accent, dark operations-console theme. Named as an anti-reference in PRODUCT.md. It is the first answer to this category and therefore not ours.
- **Don't** use decorative gradients. The current build has twenty-four gradient buttons in two subtly different blues; every one of them is wrong. Gradient text (`background-clip: text`) is prohibited outright.
- **Don't** use glassmorphism. `backdrop-filter` is permitted only on a modal scrim. The five blurred surfaces in the current build must all go.
- **Don't** use a coloured `border-left` or `border-right` greater than 1px as an accent stripe. This appears three times today, on `AlertCard` and on both sidebar active states. Replace with a full border, a background tint, or a leading icon.
- **Don't** nest cards. Ever. A card inside a card means the outer one should have been a section with a heading.
- **Don't** build uniform grids of identical icon-plus-heading-plus-text cards. If it is a list, render a list.
- **Don't** reach for a modal first. Exhaust inline and progressive alternatives. Modals are permitted for genuinely destructive confirmations and for focused creation flows, nothing else.
- **Don't** build the hero-metric template: big number, small label, three supporting stats, gradient accent. The valuation card must not drift into it.
- **Don't** let red mean anything other than critical. No red for branding, no red for emphasis, no red for a decorative divider.
- **Don't** use bright semantic colours as text. `#EF4444`, `#F59E0B` and `#10B981` all fail AA on white. Use the darkened variants for text and icons; reserve bright fills for shapes that carry no text.
- **Don't** ship a disabled control without adjacent text explaining what would enable it.
- **Don't** ship a generic error. Every failure states its specific cause and offers a specific next step. "Quelque chose a mal tourné" is prohibited.
- **Don't** show an empty state while a request is in flight.
- **Don't** use all-caps for labels, or letter-spacing above 0.02em.
- **Don't** put text below 13px anywhere a user needs to read it to complete a task.
- **Don't** animate layout properties, and don't exceed 200ms anywhere except the valuation reveal.
- **Don't** hardcode a hex value in a component. Every colour comes from a token. The current build contains 565 inline hex literals across eighteen distinct values; that number must reach zero.
- **Don't** hardcode a currency. Tenants operate in both TND and EUR.
