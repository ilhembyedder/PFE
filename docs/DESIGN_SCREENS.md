# Screen Specifications

Design briefs for every surface in LeasRecover. Produced with `impeccable shape`.

**This document specifies. It does not implement.** No application code exists for this direction yet.

| Layer | Document |
|---|---|
| Strategy: who, what, why | [`../PRODUCT.md`](../PRODUCT.md) |
| Visual system: tokens, rules | [`../DESIGN.md`](../DESIGN.md) |
| Machine-readable tokens | [`../.impeccable/design.json`](../.impeccable/design.json) |
| **Screens: layout, states, copy** | **this file** |
| Technical reference | [`../README.md`](../README.md) |
| Defects in the current build | [`CODE_REVIEW.md`](CODE_REVIEW.md) |

---

## Contents

- [0. Global direction](#0-global-direction)
- [1. App shell — Gestionnaire](#1-app-shell--gestionnaire)
- [2. App shell — Super Admin](#2-app-shell--super-admin)
- [3. Login](#3-login)
- [4. Case registry (Command Center)](#4-case-registry-command-center)
- [5. Case detail](#5-case-detail)
- [6. Case creation](#6-case-creation)
- [7. Leasing registry](#7-leasing-registry)
- [8. Settings — Branding](#8-settings--branding)
- [9. Settings — Compliance](#9-settings--compliance)
- [10. Admin — Tenants](#10-admin--tenants)
- [11. Component build inventory](#11-component-build-inventory)
- [12. Token implementation reference](#12-token-implementation-reference)
- [13. Responsive specification](#13-responsive-specification)
- [14. Accessibility conformance checklist](#14-accessibility-conformance-checklist)
- [15. Copy register](#15-copy-register)
- [16. Open questions](#16-open-questions)

---

## 0. Global direction

These apply to every screen. Individual briefs note only their deviations.

**Colour strategy: Restrained**, on every surface without exception. One plum accent under 10%; everything else chromatic is semantic state. No surface in this product earns Committed or Drenched. A login screen is the usual temptation and it is refused here: see §3.

**Theme scene sentence.** *A recovery manager working a sixty-case portfolio from 8am to 5pm on a desktop monitor in a normally-lit Tunisian office, scanning dense financial tables and statutory deadlines.* Forces light. Dark ships as a real second theme for late sessions, never as the default.

**Anchor references.** A bank statement. A land registry extract. Stripe's audit log. Note that Linear and Notion, named in the original UX spec, are deliberately *not* anchors here: their register is a fast internal tool, and this product's register is an official record.

**Scope, for every screen.** Fidelity: production-ready specification. Breadth: the whole surface, 9 screens plus 2 shells. Interactivity: shipped-quality components with all seven states. Time intent: polish until it ships.

**Constraints.** Next.js 16 App Router, React 19, Tailwind + Radix/shadcn (Ant Design is being removed). French UI. Desktop-first. WCAG 2.1 AA as a release gate. Tenants operate in both TND and EUR, so currency is never hardcoded.

**Anti-goals, every screen.** Not an operations console. Not a CRM. Not Excel. No gradient, no glass, no side-stripe, no nested card, no modal-first, no hero-metric template. The biggest single risk across the product is *flat hierarchy*: sixty cases where nothing looks more urgent than anything else. That failure mode is what most of these layouts are designed against.

**Recommended references during implementation.** `spatial-design.md` for §4 and §5, `interaction-design.md` for §6 and §9, `motion-design.md` for the valuation reveal in §5.

### The grid

- Content column: max 1280px, centred, 32px horizontal padding. The current build's 1400px is too wide for 14px body text at comfortable measure.
- Section rhythm: 32px between major sections, 24px between related blocks, 16px standard, 12px between tight pairs.
- Page header: 28px Display title, 8px gap, 13px Body Small subtitle in Ink Secondary, 24px below before content.
- **Never** wrap a whole page in a card. The page background is Paper; content sits directly on it and only genuine panels become Leaf sheets.

---

## 1. App shell — Gestionnaire

**Summary.** The persistent frame around every manager-facing screen: sidebar, header, content well. It is the most-seen surface in the product and must be the quietest.

**Primary user action.** Get to the right case. Everything else in the shell is subordinate to navigation and orientation.

**Layout strategy.** Two columns. A 240px fixed sidebar on Board recedes behind a content well on Paper. The header is a 56px bar carrying breadcrumb and account, *not* a second navigation layer. The current build's header is nearly empty and its sidebar collapse is a manual toggle; both change.

**Sidebar, top to bottom**
1. Tenant identity block: logo (28px square, 3px radius) and tenant name in Title. 16px padding, hairline beneath. Falls back to the tenant's initials on a Board tile when no logo is set, never a broken image.
2. Navigation, 8px padding, 2px between items:
   - `Dossiers` — the case registry
   - `Clients & contrats` — the leasing registry
   - `Paramètres` — settings
3. Spacer.
4. Account block, pinned bottom, above a hairline: 28px initials avatar, name in Body, role in Caption, and a menu trigger opening `Thème clair / sombre` and `Se déconnecter`.

Three items. The current build advertises four by listing both `Dashboard` and `Cases`, which resolve to the same page; that duplicate is deleted along with the rewrite aliasing that caused it.

**Header.** Breadcrumb on the left in Body Small, current page in Ink. Right side reserved and empty at MVP. No search, no notification bell, no page title: the title belongs to the page, not the chrome.

**Key states**
| State | Treatment |
|---|---|
| Default | As above. |
| Loading (branding not yet fetched) | Skeleton tile and 96px skeleton bar in the identity block. Navigation renders immediately; it does not depend on branding. |
| Branding fetch failed | Fall back to initials and the literal product name. Log it; do not surface an error. The user cannot act on it. |
| Collapsed (tablet) | 56px icon rail, tooltips on hover and focus. Breakpoint-driven, not a toggle. |
| Drawer (mobile) | Off-canvas, triggered by a header button, focus-trapped, Escape closes. |
| Idle timeout warning | At 14 of 15 minutes, a toast: *"Votre session expire dans 1 minute."* with a `Rester connecté` action. Never log out without warning. |
| Session expired | Redirect to login with `?expired=1`; login renders the reason. |

**Interaction model.** Active item is a Plum Wash filled shape with Plum text, never a left stripe. Hover lifts the background to Leaf at 120ms. The whole item is the hit target, minimum 34px tall, 44px on touch.

**Content requirements.** Nav labels are French and final: `Dossiers`, `Clients & contrats`, `Paramètres`. The role label under the account name is a mapped French string (`Gestionnaire`, `Administrateur`), never the raw enum.

---

## 2. App shell — Super Admin

**Summary.** A visibly different frame for a different job. The super admin manages tenants and is barred from case content by design; the shell should make that separation legible.

**Primary user action.** Provision or deactivate a tenant.

**Layout strategy.** Same skeleton as §1, three differences:
1. The identity block shows the product name, not a tenant. There is no tenant to brand.
2. A persistent 24px strip beneath the header, Board background with a hairline, reading *"Console plateforme — accès aux dossiers clients désactivé."* in Caption. This is the visible expression of NFR12, and it prevents the disorientation of an admin wondering where the cases went.
3. Navigation is a single item, `Sociétés`, so it renders as a plain list without a section heading.

**Key states.** As §1, minus branding: this shell never fetches tenant branding and must not skeleton for it.

**Content requirements.** The current build's hardcoded English `Platform Editor` role label is deleted. The role reads `Super administrateur`.

---

## 3. Login

**Summary.** Two audiences on one form. A tenant manager signs in with email, password and a tenant identifier; a super admin signs in without one. The current build handles this with a toggle switch, which is the right idea, wrongly presented.

**Primary user action.** Sign in on the first attempt. This screen is used daily by people who are not thinking about it.

**Design direction override: none.** A drenched or dramatic login is the standard temptation and is refused. This is the first impression of a product whose personality is *composed, precise, institutional*, and a marketing-flavoured entrance would misrepresent everything behind it. The login is Paper ground with a single Leaf sheet, identical vocabulary to the rest of the product.

**Layout strategy.** Single centred column, 400px wide, vertically centred with a 64px minimum top offset. Product name in Display above the sheet, no logo lockup, no tagline, no illustration, no split-screen hero panel. The sheet holds the form and nothing else.

**Form**
| Field | Type | Notes |
|---|---|---|
| `Adresse e-mail` | email | Autofocus. `autocomplete="username"`. |
| `Mot de passe` | password | `autocomplete="current-password"`. A reveal toggle with `aria-label` and `aria-pressed`. |
| `Identifiant de société` | text | UUID. Identifier typography. Helper: *"Fourni par votre administrateur."* Hidden when super-admin mode is on. |

Mode selector sits above the fields as a two-option segmented control, `Société` / `Plateforme`, not a switch. A switch asks the user to infer what the on position means; a segmented control states both options. Toggling to `Plateforme` removes the tenant field with a 180ms height collapse and clears its value.

**Key states**
| State | Treatment |
|---|---|
| Default | Submit enabled. Never disable a submit button pending validation; validate on submit. |
| Validating | Submit shows an inline spinner, label stays `Se connecter`, width unchanged. Fields become read-only, not disabled, so the values remain selectable. |
| Field error | Overdue Red border, message below in Body Small with a leading icon, `aria-describedby`. |
| Credentials rejected | One Overdue Red banner above the form: *"Adresse e-mail, mot de passe ou identifiant de société incorrect."* Deliberately ambiguous across all three, to avoid the account enumeration the backend currently permits (see `CODE_REVIEW.md` S-11). Focus moves to the banner. |
| Account suspended | *"Ce compte est désactivé. Contactez votre administrateur."* **Only after** the password verifies. The backend returns this before checking the password today, which leaks account existence. |
| Session expired arrival | Approaching Amber banner: *"Votre session a expiré. Reconnectez-vous."* |
| Network failure | *"Connexion au serveur impossible. Réessayez dans un instant."* with a `Réessayer` action. Distinct from a credentials error. |

**Interaction model.** Enter submits from any field. Tab order: mode selector, email, password, tenant, submit. No "remember me", no "forgot password" at MVP, because no password reset endpoint exists (`CODE_REVIEW.md`, §4.4). Do not render a link to a route that does not exist.

---

## 4. Case registry (Command Center)

**Summary.** The screen a manager opens first and returns to all day. It answers one question: what needs me right now? It carries an alert feed and a registry of every case, filterable and server-paginated.

**Primary user action.** Identify the most urgent case and open it. Secondarily, find a specific case by client or reference.

**Layout strategy.** A single column, stacked in strict priority order. This is the screen where *Urgency first* is enforced structurally rather than chromatically.

```
Page header        "Dossiers"  ·  "62 dossiers actifs · 4 nécessitent une action"
                                                        [ Nouveau dossier ]
─────────────────────────────────────────────────────────  hairline, 24px below
Alert region       Up to 5 priority alerts, most critical first
                   Absent entirely when there are none
─────────────────────────────────────────────────────────  32px gap
Filter bar         Search · Phase · Statut · Alerte · active filter chips
─────────────────────────────────────────────────────────  16px gap
Table              48px rows, sticky header, server-paginated
Pagination         Range, page controls, page size
```

The alert region is **not** a banner above a table. It is the first content of the page and it is composed of individually actionable rows. When it is empty it collapses completely: no empty container, no "no alerts" placeholder, no reserved space. Its absence is the signal.

**Alert row anatomy.** A full-bordered Leaf sheet on the semantic surface tint, 1px semantic border. Never a left stripe.
- Leading semantic icon, 16px.
- Line one: client name in Title, then case reference in Identifier, then a semantic chip.
- Line two: the alert message in Body.
- Trailing: a Secondary button whose label is the action, not "voir". `DORMANCY` → `Ajouter une note`. `DEADLINE` → `Faire avancer la phase`. `MISSING_PREREQUISITE` → `Téléverser un rapport`. Each deep-links to the case with the correct tab and focus target.

**Table columns.** Client, Référence, Phase, Responsable, Fiabilité, Dernière action, and a trailing action cell.
- Référence uses Identifier typography.
- Phase and Fiabilité are chips: icon plus colour plus text, always.
- Dernière action is a relative French string (`il y a 3 jours`) with the absolute date in a `title` attribute. Rows dormant beyond the tenant threshold render this cell in Overdue Red with a leading icon.
- No currency column. Residual value belongs in the case, not the registry, and putting money in the list invites scanning for the wrong thing.
- Sortable: Client, Phase, Dernière action. Sort resets to page 1, which the current build fails to do.

**Key states**
| State | Treatment |
|---|---|
| Loading | 10 skeleton rows at exactly 48px. Header, filter bar and pagination render immediately. |
| Default | As above. |
| Empty, no cases at all | Centred in the table area: *"Aucun dossier pour le moment."* / *"Créez un dossier de recouvrement pour lancer le suivi d'un contrat en défaut."* plus a Primary `Nouveau dossier`. Teaches the interface. |
| Empty, filters applied | *"Aucun dossier ne correspond à ces filtres."* plus a Secondary `Réinitialiser les filtres`. A different message from the above; conflating them is a defect. |
| Alerts loading | The region renders nothing. It must never flash a placeholder that then disappears. |
| Alerts failed | A single neutral row: *"Les alertes n'ont pas pu être chargées."* with `Réessayer`. The table still loads; one failure must not block the other. |
| Table failed | Inline Overdue Red block in the table area with the specific cause and `Réessayer`. Never a blank table. |
| Row hover | Background shifts to Paper. No shadow, no lift. |
| Row focus | Focus ring on the row; Enter opens the case. |

**Interaction model.** The whole row is a link to the case. The trailing cell holds one Ghost action, `Ouvrir`, for pointer users who expect an explicit affordance; it is `aria-hidden` because the row itself is already the link. Filters apply immediately, no apply button, and write to the URL so a filtered view is shareable and survives a refresh. Active filters render as removable chips beneath the bar.

**Content requirements.** Subtitle is dynamic and states two numbers: total active and count needing action. Phase labels are mapped French: `Pré-contentieux`, `Mise en demeure`, `Saisie`, `Vente`, `Clôture`. Reliability labels: `Fiable`, `Écart modéré`, `Écart critique`, and `Non estimé` where no valuation exists. The raw enums must never reach the screen.

---

## 5. Case detail

**Summary.** The deepest surface in the product and the one that carries the signature moment. It shows one case, its position in the five-phase workflow, its financial picture, and everything attached to it. The current implementation is 1201 lines of card-soup; this restructures it.

**Primary user action.** Understand where this case stands and advance it. Every other affordance on the page is secondary to the phase transition.

**Layout strategy.** A two-column split below a full-width header region. The single most important change from the current build: **the phase stepper and the blocking state are the top of the page**, not one card among many.

```
Breadcrumb    Dossiers / Dupont Logistics / LC-2024-0892
─────────────────────────────────────────────────────────
Header        Client name (Display) · phase chip · status chip
              Reference in Identifier beneath
                                    [Exporter] [Modifier] [Avancer ▸]
─────────────────────────────────────────────────────────
Stepper       Five phases, full width, current and locked states
Blocker       Inline, immediately beneath, only when blocked
─────────────────────────────────────────────────────────
┌── Main column, ~2fr ──────────┐  ┌── Aside, ~1fr, sticky ──┐
│  Valuation card (SAISIE+ only)│  │  Résumé                 │
│  Tabs: Détails · Notes ·      │  │   Responsable (select)  │
│        Historique · Documents │  │   Valeur résiduelle     │
│  Tab panel                    │  │   Ouvert le             │
│                               │  │   Dernière action       │
└───────────────────────────────┘  └─────────────────────────┘
```

The aside is a plain bordered sheet, not a stack of cards, and it is sticky so the assignee and residual value stay visible while the main column scrolls. No nested cards anywhere on this page.

**Phase stepper.** Five steps, horizontal, full width. Completed steps carry Settled Green and a check; the current step carries Plum and a filled marker; future steps are Ink Muted on Board. A blocked next step carries an Overdue Red lock, `aria-disabled="true"`, and a tooltip. **The blocking reason is also rendered inline beneath the stepper as text**, because a tooltip is not an accessible home for information the user must act on. That inline block lists every unmet prerequisite and links directly to what resolves it.

**Valuation card.** Specified in `DESIGN.md` §5. Appears only when the case has reached `SAISIE` and only inside this page. Deviation is the hero at 40px; market and residual sit beneath at 24px as its inputs; the extracted vehicle data sits in the same block as provenance. The reliability band tints the deviation figure and its chip only, never the card surface.

**Tabs**

*Détails.* Two bordered sheets side by side: `Client` and `Contrat`, then `Véhicule` full width beneath. Definition lists, not tables. Where a vehicle is not yet linked, the sheet becomes an inline empty state with a `Lier un véhicule` action rather than a modal-first flow.

*Notes.* A composer at the top, always visible, never behind a button: a 3-row textarea with a `Publier` Primary. Beneath, a reverse-chronological list, each entry showing author initials, name, relative timestamp, and the note body. Deep-linked from a dormancy alert with focus placed in the textarea.

*Historique.* The Envers timeline. A vertical rule with event markers, each showing actor, timestamp, event type and a human-readable description of what changed. Events are grouped by day with a sticky day heading. Field changes render as `Valeur résiduelle : 22 000,00 € → 19 500,00 €` using Identifier typography for the values.

*Documents.* One disclosure section per phase, in workflow order, each showing its document count. The section for the current phase is expanded by default and is the only one carrying an upload zone. In `SAISIE` that zone is the AI upload zone with pipeline narration; elsewhere it is a plain drop zone. Documents list as rows with filename, uploader, timestamp and a download action, not as cards.

**Key states**
| State | Treatment |
|---|---|
| Loading | Skeleton for header, stepper, and the first tab panel. Six requests currently fire sequentially; they must be parallel, and the page must not render progressively enough to jump. |
| Not found / wrong tenant | Full-page state: *"Ce dossier est introuvable."* with a link back to the registry. Never a blank page. |
| Phase blocked | Inline blocker beneath the stepper. The `Avancer` button is disabled **and** accompanied by the reason. Never a disabled control without an explanation. |
| Terminal phase (`CLOTURE`) | `Avancer` is replaced, not disabled, by a Settled Green status line: *"Dossier clôturé le 12 mars 2026."* |
| Advancing | Button spinner; on success a toast *"Phase avancée : Saisie."* and the stepper animates the marker across at 180ms. |
| Valuation pending | The valuation card is replaced by the pipeline progress state, never by a bare spinner. |
| Valuation failed | Inline Overdue Red block inside the card slot: the specific message, plus `Téléverser un nouveau rapport`. Data is never lost. |
| No valuation, phase ≥ SAISIE | Empty state in the card slot: *"Aucune estimation. Téléversez un rapport d'expertise pour lancer l'analyse."* plus an action that opens the Documents tab focused on the upload zone. |
| Export in progress | Button spinner, then the browser download. |

**Interaction model.** Editing opens a side sheet, not a modal, so the case stays visible behind it. The assignee select in the aside saves on change with an inline confirmation, no save button. Tab selection writes to the URL (`?tab=notes`) so alert deep-links work and the back button behaves. The `?focus=` parameter moves focus to the note composer, the stepper, or the upload zone, and must move real DOM focus rather than only scrolling.

**AI upload zone.** Idle, uploading, then three narrated stages driven by the SSE stream: `Lecture du document`, `Extraction des données`, `Calcul de l'écart`. A determinate progress bar, never an indeterminate spinner, because the anxiety this design targets is the thirty-second unexplained wait. On failure, the specific message with a retry. Under `prefers-reduced-motion` the progress bar still updates but does not animate between values.

---

## 6. Case creation

**Summary.** Creates a recovery case, and with it a client, contract and vehicle if they do not already exist. It is the only long form in the product and the one place a manager can silently corrupt master data.

**Primary user action.** Create a case correctly on the first pass.

**Layout strategy.** A single 720px column of numbered sections, each a bordered sheet with a Headline title. Not a wizard: the manager has the contract in front of her and wants to enter it in one pass, and a five-step wizard would add clicks without reducing load. Not a single undifferentiated form either. Numbered sections give the structure of a wizard with the throughput of a form.

1. **Contrat existant** — an optional combobox. Selecting a contract pre-fills sections 2 to 4 and collapses them to a read-only summary with a `Modifier` affordance.
2. **Client**
3. **Contrat**
4. **Véhicule**
5. **Données financières** — residual value and currency

A sticky footer bar holds `Annuler` (Ghost) and `Créer le dossier` (Primary) with a live validation summary.

**The master-data hazard.** `CODE_REVIEW.md` H-7: creating a case for an existing client silently overwrites that client's name, registration number, email, phone and address. The interface must make this impossible. When the entered registration number or email matches an existing client, the section switches to a matched state showing the existing record read-only with the message *"Client existant. Ses informations ne seront pas modifiées."* and a `Modifier ce client` link that navigates to the leasing registry. The creation form never edits an existing entity.

**Key states**
| State | Treatment |
|---|---|
| Default | Section 1 focused. |
| Contract selected | Sections 2–4 collapse to read-only summaries. |
| Client matched | Section 2 switches to the matched state above. |
| Validating | Footer button spinner; the form stays readable. |
| Validation errors | Footer summary lists each error as a link that focuses the field. Per-field errors render inline. Focus moves to the summary on submit. |
| Server error | Overdue Red block above the footer with the specific cause. Entered values are never cleared. |
| Success | Redirect to the new case detail with a toast: *"Dossier créé."* Landing on the case, not the registry, because the next thing she does is work it. |

**Content requirements.** Currency is a select of the tenant's configured currencies, defaulting to the tenant default, never hardcoded to `TND`. Residual value uses tabular figures, right-aligned, with the currency symbol as a suffix adornment and French decimal formatting. Dates use a date input with `fr` locale. `Date de fin` must validate as later than `Date de début`, which the backend does not check.

---

## 7. Leasing registry

**Summary.** Clients and contracts, with vehicles nested under contracts, plus their attached documents. The reference data behind cases.

**Primary user action.** Find a client or contract and inspect or correct it.

**Layout strategy.** Two tabs, `Clients` and `Contrats`, each a filter bar plus a table with the same vocabulary as §4. Selecting a row opens a side sheet, not a modal. The current build's four drawers plus modal collapse into one sheet pattern with two modes, view and edit.

- **Client sheet.** Header with name and registration. Definition list of contact details. A `Contrats` section listing that client's contracts as rows, each linking to its own sheet. A `Documents` section using the shared document list.
- **Contract sheet.** Header with reference and status chip. Definition list of dates and client. A `Véhicule` section that is either the vehicle detail or an inline empty state with `Lier un véhicule`. A `Documents` section, plus a second document list scoped to the vehicle when one exists.

Vehicle linking happens inline within the sheet, not in a modal stacked on a drawer. Stacked overlays are the single worst pattern in the current build.

**Key states.** Loading is skeleton rows. Empty differs by tab and teaches: *"Aucun client enregistré."* / *"Ajoutez un client pour pouvoir créer des contrats et des dossiers."* Deletion is a destructive confirmation, the only justified modal on this screen, and it must state consequences: *"Supprimer Dupont Logistics ? Ce client est lié à 3 contrats et 2 dossiers."* The backend performs no referential check, so the interface must count and warn.

**Content requirements.** Contract status labels in French: `Actif`, `Suspendu`, `Résilié`. The current build misspells the last as `Résilé` in one of three places.

---

## 8. Settings — Branding

**Summary.** Tenant name and logo. The smallest screen in the product.

**Primary user action.** Change the logo and see it take effect.

**Layout strategy.** Settings is a shared layout: a page header, a horizontal tab bar (`Société`, `Conformité`), and the panel beneath. Content is a single 560px column, left-aligned, not centred and not full width, because a two-field form spanning 1280px looks broken.

One sheet with two fields, then a live preview block showing exactly how the sidebar identity will render, at the sidebar's real size on Board. The preview is the point: a logo URL field with no preview is a guess.

**Key states.** Loading is a skeleton form. Dirty state enables `Enregistrer` and shows *"Modifications non enregistrées"* in Ink Secondary next to it; navigating away with a dirty form prompts. Invalid URL errors inline. A URL that fails to load renders the initials fallback in the preview with a note: *"L'image n'a pas pu être chargée."* Success is a toast plus an immediate sidebar update.

---

## 9. Settings — Compliance

**Summary.** Seven numbers that change how the platform behaves for everyone in the tenant: the dormancy threshold, four statutory phase delays, and two AI deviation thresholds. Karim touches this rarely and must not get it wrong.

**Primary user action.** Set a threshold with confidence about what it will do.

**Layout strategy.** Three grouped sheets in a 720px column, each with a Headline title and one sentence of Body Small explaining what the group controls. This directly answers PRODUCT.md's *single-page settings dump* anti-reference: the fields are on one page, but they are grouped, explained and consequence-annotated.

1. **Dormance** — one field. *"Un dossier sans action pendant cette durée déclenche une alerte."*
2. **Délais légaux par phase** — four fields, one per phase, laid out as a labelled row each with a `jours` suffix. *"Durée maximale d'une phase avant alerte d'échéance. Une alerte d'avertissement est émise 2 jours avant l'expiration."*
3. **Seuils d'écart IA** — two fields with a `%` suffix. *"Détermine l'indicateur de fiabilité affiché sur chaque estimation."*

**The consequence preview.** Beneath group 3, a live three-band readout that restates the current values as the outcome they produce, using the real reliability chips:

> `Fiable` écart inférieur à 10 % · `Écart modéré` de 10 % à 20 % · `Écart critique` supérieur à 20 %

It updates as the fields change. A number without its consequence is exactly the kind of configuration that gets set wrong once and discovered six months later.

**Key states.** Validation is inline and immediate: every value positive, moderate strictly less than critical, both within 0–100. When moderate is raised above critical the error attaches to both fields and the preview shows an Overdue Red invalid state rather than nonsense bands. Save currently fires two parallel requests; if one fails the interface must say which group did not save and leave the other's success intact, not report a generic failure for both.

**Content requirements.** Phase labels in French, matching §4 exactly. Suffixes `jours` and `%` are adornments inside the field, not part of the label. All numeric inputs are tabular and right-aligned.

---

## 10. Admin — Tenants

**Summary.** The super admin's only screen. Lists leasing companies and provisions new ones with their first administrator account.

**Primary user action.** Provision a tenant, and hand its administrator working credentials.

**Layout strategy.** Page header with `Nouvelle société`, then a table: Société (logo plus name), Identifiant (Identifier typography, with a copy affordance), Rétention, Statut chip, Créée le, and a trailing action.

The identifier column matters more than it looks: that UUID is what the tenant's users must type on the login screen. It needs a one-click copy with a confirmation, because the alternative is an administrator transcribing a UUID by hand.

**Provisioning.** A side sheet, not a modal, in two labelled groups: `Société` (name, logo URL, retention months) and `Premier administrateur` (email, password). A password field with a generate action and a strength indicator; the backend applies **no** password rule here at all, though it requires eight characters everywhere else, so the interface must enforce a minimum of twelve.

**The success state is the important one.** After provisioning, the sheet does not simply close. It becomes a summary panel showing the new tenant's identifier, the administrator's email, and the password, each individually copyable, with a warning: *"Le mot de passe ne sera plus affiché. Transmettez-le à l'administrateur maintenant."* Closing requires an explicit `J'ai transmis les accès`. Provisioning an account whose password is then unrecoverable, with no reset endpoint in the product, is a real operational trap.

**Key states.** Loading skeletons. Empty teaches: *"Aucune société enregistrée."* / *"Provisionnez une société de leasing pour lui donner accès à la plateforme."* Deactivation is a destructive confirmation naming the consequence: *"Désactiver MediLease SA ? Ses 12 utilisateurs ne pourront plus se connecter."* Deactivated rows render at reduced emphasis with an `Inactive` chip and offer reactivation.

---

## 11. Component build inventory

What to build, in what order, and on what primitive. Ordered so that nothing is blocked by something later in the list.

### Tier 1 — Primitives (no screen ships without these)

| Component | Base | Notes |
|---|---|---|
| `Button` | shadcn | Variants: primary, secondary, ghost, danger. Sizes: default 36px, compact 32px. All seven states. |
| `Input` / `Textarea` | shadcn | Edge border, label always external. |
| `NumericInput` | custom | Tabular, right-aligned, suffix adornment, French decimal parsing. |
| `Select` / `Combobox` | Radix Select, Popover + cmdk | Combobox needed for the contract picker in §6. |
| `Label` / `FormField` / `FormError` | react-hook-form + zod | Wires `aria-describedby` and `aria-invalid` automatically. |
| `Chip` | custom | Semantic and neutral variants. **Icon + colour + text is enforced by the API**: the icon prop is required for semantic variants. |
| `Tooltip` | Radix | Never the sole carrier of required information. |
| `Skeleton` | custom | Must accept an explicit height so it matches real content. |
| `Toast` | Radix Toast / sonner | Manually dismissible, per WCAG timeouts. |
| `Dialog` / `Sheet` | Radix Dialog | Sheet is the default; Dialog reserved for destructive confirmations. |
| `Tabs` | Radix Tabs | URL-synced variant needed for §5. |
| `Disclosure` | Radix Accordion | Used by the documents tab. |

### Tier 2 — Composites

| Component | Replaces | Notes |
|---|---|---|
| `DataTable` | AntD `Table` | TanStack Table. Server pagination, sorting, URL-synced filters, sticky header, 48px rows, skeleton and two distinct empty states. The single largest build item. |
| `FilterBar` | — | Search, selects, removable active-filter chips, URL sync. |
| `EmptyState` | — | Title, body, optional action. Two variants: no-data and no-results. |
| `ErrorState` | — | Specific cause plus retry. Inline and full-page variants. |
| `PageHeader` | — | Title, subtitle, action slot. |
| `Breadcrumb` | — | Does not exist today; required on every detail view. |
| `DefinitionList` | — | The `Détails` tab and every sheet. Replaces the card-soup. |
| `DocumentList` | — | One implementation replacing the current three upload paths. |
| `AppShell` | both layouts | One shell, two configurations. Breakpoint-driven collapse. |

### Tier 3 — Signature

| Component | Notes |
|---|---|
| `ValuationCard` | `DESIGN.md` §5. Deviation as hero, provenance inline, 300ms reveal, `role="region"`. |
| `PhaseStepper` | Five phases, locked states, inline blocker beneath. |
| `AIUploadZone` | Determinate SSE-driven progress, three narrated stages, retry. |
| `AlertRow` | Full border, no stripe, action-labelled button, deep links. |
| `HistoryTimeline` | Day-grouped Envers events with before/after value rendering. |
| `ThresholdPreview` | The live consequence readout in §9. |

### Build order

1. Token layer (§12), fonts, base reset.
2. Tier 1 primitives.
3. `AppShell` + `Breadcrumb`, then login. Proves the shell and the auth flow.
4. `DataTable`, `FilterBar`, `EmptyState`, `ErrorState`. Then the case registry.
5. `PhaseStepper`, `ValuationCard`, `AIUploadZone`, tabs. Then case detail.
6. Forms: case creation, both settings screens.
7. Leasing registry and admin tenants, which reuse everything above.

---

## 12. Token implementation reference

Normative values live in [`../DESIGN.md`](../DESIGN.md) frontmatter. This is the naming contract between that file and the code, so the two cannot drift.

**Every token is a CSS custom property on `:root`, themed by a `data-theme` attribute on `<html>`.** Tailwind reads the custom properties rather than redefining the values, so there is exactly one source of truth and dark mode requires no Tailwind changes.

### Naming contract

| CSS custom property | Tailwind utility | DESIGN.md token |
|---|---|---|
| `--color-paper` | `bg-paper` | `colors.paper` |
| `--color-surface` | `bg-surface` | `colors.surface` |
| `--color-panel` | `bg-panel` | `colors.panel` |
| `--color-border-subtle` | `border-subtle` | `colors.border-subtle` |
| `--color-border` | `border-DEFAULT` | `colors.border` |
| `--color-border-strong` | `border-strong` | `colors.border-strong` |
| `--color-ink` / `-secondary` / `-muted` | `text-ink` / `-secondary` / `-muted` | `colors.ink*` |
| `--color-accent` / `-hover` / `-subtle` / `-border` | `bg-accent`, `text-accent`, … | `colors.plum*` |
| `--color-critical` / `-surface` / `-border` | `text-critical`, `bg-critical-surface`, … | `colors.critical*` |
| `--color-warning` / `-surface` / `-border` | idem | `colors.warning*` |
| `--color-success` / `-surface` / `-border` | idem | `colors.success*` |
| `--radius-sm` / `-md` / `-lg` | `rounded-sm` / `-md` / `-lg` | `rounded.*` |
| `--shadow-overlay` / `-dialog` / `-focus` | `shadow-overlay` / … | sidecar `extensions.shadows` |
| `--ease-out-quart` | `ease-out-quart` | sidecar `extensions.motion` |
| `--duration-fast` / `-base` / `-reveal` | `duration-fast` / … | sidecar `extensions.motion` |

The accent is named `accent`, not `plum`, in code. A future palette change must not require renaming every call site.

### Rules

- Spacing uses Tailwind's default 4px scale. Do not redefine it; `DESIGN.md` `spacing` documents which steps are sanctioned (`1 2 3 4 5 6 8 10 12 16`).
- Typography ships as a component layer: `.text-body`, `.text-label`, `.text-figure-hero`, one class per role from `DESIGN.md` `typography`. Roles are applied as named classes, never as ad-hoc `text-[13px] font-medium` combinations.
- `font-variant-numeric: tabular-nums` is bound to a `.tabular` utility and applied by `NumericInput`, `DataTable` numeric columns, and every figure role.
- The focus ring is a single `.focus-ring` utility used by every interactive component. It must not be reimplemented per component.
- **Zero raw hex in components.** The current build has 565. Add an ESLint rule failing on hex literals in `src/**` so this cannot regress.

### Fonts

IBM Plex Sans and IBM Plex Mono, self-hosted via `next/font/local` rather than a Google Fonts request, subset to `latin` and `latin-ext` (the latter is required for French diacritics). Weights 400, 500, 600 only; 700 is not used anywhere in the scale and must not be loaded.

---

## 13. Responsive specification

Desktop-first, three breakpoints, structural rather than fluid. The current build has no responsive behaviour at all: no media queries in application code, no breakpoint hook, and a fixed 240px sidebar.

| | `< 768px` mobile | `768–1023px` tablet | `≥ 1024px` desktop |
|---|---|---|---|
| Sidebar | Off-canvas drawer, focus-trapped | 56px icon rail, tooltips | 240px, labels |
| Content padding | 16px | 24px | 32px, max 1280px |
| Case registry | Card-style rows, not a table | Table minus Responsable and Fiabilité | Full table |
| Case detail | Single column, aside above tabs, not sticky | Single column, aside above tabs | Two columns, sticky aside |
| Phase stepper | Vertical | Horizontal, labels beneath markers | Horizontal, inline labels |
| Valuation card | Stacked figures | Stacked figures | Hero plus two-column inputs |
| Forms | Full width | 560px | 720px |
| Sheets | Full-screen | 480px | 560px |
| Touch targets | 44px minimum | 44px minimum | 34px minimum |

**Mobile is consultation-only** and out of MVP scope, per the PRD. Upload, case creation and phase transition are not supported below 768px; those affordances render a Board notice: *"Cette action nécessite un écran plus large."* Silently hiding a control the user came for is worse than explaining the limit.

Typography does **not** scale fluidly. No `clamp()` on UI text. Users view this at consistent DPI and a heading that shrinks in a narrow column reads as a bug.

---

## 14. Accessibility conformance checklist

WCAG 2.1 AA is a release gate. Every item is verifiable, and every one of them currently fails.

### Per-component

- [ ] Focus ring on every interactive element via the shared `.focus-ring` utility. 3:1 against both adjacent surfaces.
- [ ] `aria-label` on every icon-only control. Six exist unlabelled today.
- [ ] Every semantic state carries icon **and** colour **and** text. Enforced by making `Chip`'s icon prop required for semantic variants.
- [ ] Every input has an explicit `<label for>`. No placeholder-only fields.
- [ ] Errors wired via `aria-describedby` and `aria-invalid`, stated in text, never colour alone.
- [ ] Disabled controls always accompanied by text explaining what would enable them.
- [ ] No nested interactive elements. The current download link wraps a button.

### Per-screen

- [ ] Landmarks: one `<main>`, one `<nav>`, `<aside>` for the case-detail sidebar, `<header>`.
- [ ] One `<h1>` per screen, no skipped heading levels.
- [ ] Skip-to-content link as the first focusable element.
- [ ] Full keyboard path: login, filter, open a case, upload, advance a phase, export. No mouse.
- [ ] Escape closes every sheet and dialog; focus returns to the trigger.
- [ ] Sheets and dialogs trap focus.

### Live regions

- [ ] `AIUploadZone` status: `aria-live="polite"`.
- [ ] `ValuationCard`: `role="region"` with an `aria-label` naming the vehicle.
- [ ] Critical alert: `role="alert"`. Moderate: `role="status"`.
- [ ] Toasts announce and are manually dismissible.
- [ ] Table filtering announces the new result count.

### Global

- [ ] `<html lang="fr">`. It says `en` today.
- [ ] `prefers-reduced-motion` honoured everywhere; no information conveyed by motion alone.
- [ ] Every colour pairing verified and recorded. The five colours in the previous spec all fail.
- [ ] Nothing below 13px that a user must read to complete a task.
- [ ] Deuteranopia and protanopia simulation on the reliability indicator and the alert hierarchy.
- [ ] 200% browser zoom without horizontal scroll or content loss.

**Verification.** Zero axe violations at AA per screen, before each merge. Full keyboard walkthrough of the five critical flows. VoiceOver pass on case detail and the valuation card.

---

## 15. Copy register

The product language is French. Enum values never reach the screen raw. This table is normative; deviations are defects.

**Phases** — `PRE_CONTENTIEUX` → Pré-contentieux · `MISE_EN_DEMEURE` → Mise en demeure · `SAISIE` → Saisie du véhicule · `VENTE` → Vente · `CLOTURE` → Clôture

**Reliability** — `RELIABLE` → Fiable · `MODERATE_RISK` → Écart modéré · `CRITICAL_RISK` → Écart critique · *(no valuation)* → Non estimé

**Alerts** — `DORMANCY` → Dossier dormant · `DEADLINE` → Échéance · `MISSING_PREREQUISITE` → Prérequis manquant · `VEHICLE_DISCREPANCY` → Incohérence véhicule

**Criticality** — `CRITICAL` → Critique · `WARNING` → Avertissement

**Status** — `ACTIVE` → Actif · `SUSPENDED` → Suspendu · `TERMINATED` → Résilié · `INACTIVE` → Inactive

**Roles** — `SUPER_ADMIN` → Super administrateur · `ADMIN` → Administrateur · `GESTIONNAIRE` → Gestionnaire

**Formatting.** Dates `12 mars 2026`; with time `12 mars 2026 à 14:30`. Relative under seven days (`il y a 3 jours`) with the absolute date in `title`. Currency via `Intl.NumberFormat('fr-FR', { style: 'currency', currency: tenantCurrency })` — the currency code comes from the case, never a literal. Percentages one decimal with a French separator and an explicit sign (`−16,4 %`), using a true minus sign. Non-breaking space before `%`, `€` and `:`, per French typography.

**Voice.** Errors state cause then remedy. No apology, no "Oops", no exclamation marks. Buttons are verbs describing the outcome (`Créer le dossier`, not `Soumettre`). Empty states teach rather than report absence.

---

## 16. Open questions

Genuinely unresolved. Everything else has been decided and is written above.

1. **TypeScript.** shadcn is TypeScript-first and the frontend is plain JavaScript with no shared API types. Adopting TS during this rebuild would also close a documented drift finding, at the cost of scope. This is the one decision that materially changes the build and it is not a design decision.

2. **Revising the BMad specs.** `architecture.md` and `ux-design-specification.md` both name Ant Design, a slate/blue palette and a dark-first build. They now contradict `PRODUCT.md` and this document. For a thesis, that inconsistency is a defect in its own right. Options: revise both, or add a superseding-decision appendix to each.

3. **Dark mode timing.** Fully specified, roughly a day of work once the token layer exists, and not required for the MVP. Ship with light only and add it later, or build both from the start.

4. **The valuation card cannot be honestly designed until the AI is real.** It currently receives a hardcoded BMW for every upload (`CODE_REVIEW.md` C7), so the reliability bands, the deviation ranges and the vehicle-discrepancy alert have never been seen with real data. The component can be built to this spec, but it should be reviewed against genuine extractions before it is called finished.
