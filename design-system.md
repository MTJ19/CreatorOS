# Creator OS — Design System

Created before Phase 1, Step 4 (`docs/architecture.md §8`). Every frontend
prompt in `docs/BUILD_PLAN.md` wires from these tokens — no component
introduces a color, radius, or type value not defined here, and none falls
back to a framework default.

**Reference image:** place the uploaded landing-page reference at
`docs/design/reference/antimetal-landing.jpg` in the repo. It's a marketing
site for an unrelated product (Antimetal) — do not copy its copy, its exact
palette, or its literal dot-grid motif. What's worth taking: **restraint**
(one accent color, generous whitespace, a serif used sparingly for
emphasis), and — more directly useful — **the embedded product dashboard
screenshot inside that image** (sidebar nav, stat tiles with a big number +
small trend label, an "ask anything" assistant panel docked on the right).
That dashboard mock is the closer reference for Creator OS's own screens
than the marketing page around it.

---

## The bar

"Impressive" isn't a vibe, it's specific, checkable things. A screen is not
done until:

- It's been built against **realistic seed data** (real-sounding creator
  handles, deal names, INR amounts, dates) — never "Lorem ipsum," "Test
  Deal 1," or `$0.00` placeholders. Screens get judged on first look; empty
  or fake-looking data reads as unfinished even when the code is correct.
- Every list, table, and empty state has a **designed empty state** (an
  icon + one line + a next action), not a blank div.
- Every async action has a **loading skeleton** matching the shape of the
  content it replaces, not a spinner dropped in the middle of the page.
- Interactive elements have real **hover, focus, and active states** —
  focus rings must be visible (accessibility, and it reads as polish).
- Icons come from one set only (`lucide-react`) at one consistent stroke
  width — never mixed with emoji or a second icon library.
- Motion is subtle and purposeful (150–200ms ease-out on hover/open/close)
  — never a demo-reel animation on page load.

---

## Color

```css
--color-canvas: #F6F4EF;       /* page background — warm paper, not pure white */
--color-surface: #FFFFFF;      /* cards, panels */
--color-surface-sunken: #EFEBE2; /* table stripes, inset panels */
--color-border: #DEDAD0;       /* hairlines */
--color-ink: #15151A;          /* primary text, dark section backgrounds */
--color-ink-soft: #5B5B57;     /* secondary text, captions */
--color-ink-faint: #8C897F;    /* placeholder text, disabled */

--color-accent: #3457D5;       /* primary actions, links, focus rings, brand */
--color-accent-soft: #E7ECFB;  /* accent-tinted backgrounds (selected rows, badges) */

/* Reserved for contract-flag / deal-status semantics ONLY — never used as a
   generic brand or decorative color, so they keep their meaning everywhere: */
--color-success: #1F8A55;      /* clean clause, paid, approved */
--color-success-soft: #E4F3EA;
--color-warning: #C98A1D;      /* yellow-flag clause, pending review */
--color-warning-soft: #FBF0DE;
--color-danger: #C4351C;       /* red-flag clause, overdue, rejected */
--color-danger-soft: #FBE7E2;
```

Dark sections (landing-style CTA bands, if/when built) invert: `--color-ink`
becomes the background, `--color-canvas` becomes the text color, `--color-
accent` stays the same hex (it's chosen to hold contrast against both).

---

## Typography

- **Display / editorial serif** (hero numbers, pull-quotes, the occasional
  emphasis word inside a headline): `Fraunces` (variable, via `next/font/
  google`) — this is the one place a serif shows up; never in UI chrome.
- **UI sans** (everything else — nav, body, tables, buttons, forms): `Inter`
  (via `next/font/google`).

```
--font-display: 'Fraunces', serif;
--font-sans: 'Inter', system-ui, sans-serif;

--text-display: 56px / 60px, font-display, weight 500
--text-h1:      36px / 42px, font-sans, weight 600
--text-h2:      24px / 30px, font-sans, weight 600
--text-h3:      18px / 24px, font-sans, weight 600
--text-body:    15px / 22px, font-sans, weight 400
--text-small:   13px / 18px, font-sans, weight 400
--text-label:   12px / 16px, font-sans, weight 500, letter-spacing 0.02em, uppercase
```

Use `--text-display` only for the one or two numbers/phrases on a screen
that should draw the eye first (e.g. a stat tile's headline number, a
landing hero line) — if everything is emphasized, nothing is.

---

## Spacing, radius, elevation

```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;

--radius-sm: 6px;    /* inputs, small buttons, badges */
--radius-md: 10px;   /* buttons, pills-off */
--radius-lg: 16px;   /* cards, panels, modals */
--radius-pill: 999px;/* status pills, avatar */

--shadow-sm: 0 1px 2px rgba(21,21,26,0.06);
--shadow-md: 0 4px 16px rgba(21,21,26,0.08);
--shadow-lg: 0 12px 32px rgba(21,21,26,0.12);
```

---

## Component patterns

These are the specific patterns pulled from the reference dashboard mock —
build to these shapes, not a generic admin-template layout.

**App shell:** fixed left sidebar (240px, `--color-canvas` background,
`--color-border` right hairline) with a logo mark, primary nav (Deals,
Negotiate, Contracts, Deliverables, Activity), and role/account switcher
pinned to the bottom. Main content area on `--color-canvas`, cards on
`--color-surface`.

**Stat tile:** a `--color-surface` card, `--radius-lg`, `--shadow-sm`. Small
uppercase `--text-label` caption at top ("Checklist complete", "Time to
counter"), a large `--text-display`-or-`--text-h1` number below it, and a
small trend/status line underneath (colored with the semantic tokens where
it's a status, e.g. green "on track" / amber "review needed"). This is the
"90% / 2m 12s / 99.97%" pattern from the reference — use it for agency
dashboard KPIs and the creator negotiation summary.

**Status pill:** `--radius-pill`, semantic soft background + matching text
color (`--color-success-soft` bg / `--color-success` text, etc.), used for
contract status, deliverable status, and clause flags consistently — the
same pill component everywhere a status appears, never a re-implementation
per screen.

**Data table:** `--color-surface`, row hover = `--color-surface-sunken`,
`--color-border` row dividers only (no full grid lines), sticky header,
right-aligned numeric columns, status column always rendered as the Status
pill above. Pagination controls bottom-right, never infinite scroll for
agency-facing tables.

**Assistant panel** (introduce once there's a real LLM-backed feature behind
it — Phase 2, Step 4 for clause explanations is the first natural home; do
not build this in Phase 1, there's no AI yet to back it): a docked right-
rail panel, `--color-surface`, header "Ask about this contract" /
"Ask about this negotiation" depending on context, message list + input at
bottom — mirrors the "Ask anything about your payment" pattern in the
reference, scoped to whatever Gemini-backed explanation/script feature
already exists at that point in the build. Never a panel with no real
function behind it.

**Empty state:** centered icon (lucide, 32px, `--color-ink-faint`), one
`--text-body` line describing what goes here, one primary-button next
action. Used consistently — activity log with no entries, deal list with no
deals, benchmark panel with insufficient data.

---

## What this unlocks later

Because every screen pulls from this file instead of inventing values
inline, a future rebrand or theme change is a token edit here, not a
find-and-replace across components — the same future-proofing principle as
the backend's contract-first rule (`docs/architecture.md §4`), applied to
the frontend.
