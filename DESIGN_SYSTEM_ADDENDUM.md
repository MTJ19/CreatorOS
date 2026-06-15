# CreatorOS — Design System Addendum (Phase 7)

This document details the visual guidelines, components, theme-switching mechanisms, and user experience standards introduced in Phase 7 for the Brand Portal, Onboarding, and general frontend refinements.

---

## 1. Theme Toggling (Light / Dark Mode)

### Default Strategy

- **Dark Mode is default** (applies the `.dark` class to `<html>` elements on load).
- All components must support both `.dark` and `.light` states via CSS custom property hooks defined in `apps/web/src/app/globals.css`.

### Theme Switching Mechanism

- A premium, animated Sun/Moon toggle button is fixed in the `<TopNav />` header.
- State is synchronized with the document root and persisted in client-side `localStorage`.
- Direct DOM manipulation is utilized on mount to prevent SSR hydration mismatches:
  ```typescript
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.className = savedTheme;
  ```

---

## 2. Reusable Visual feedback Blocks

### A. Dark Shimmer Skeletons (`components/ui/skeleton.tsx`)

Used for asynchronous card, list, and details loading grids to reduce perceived latency:

- **Style**: Subtle grey-pulse shimmer (`bg-muted-foreground/10 animate-pulse`).
- **Variants**:
  - `circle`: For profile avatars.
  - `card`: For large Kanban cards or stat boxes.
  - `default`: For table columns or details rows.

### B. Empty States (`components/ui/empty-state.tsx`)

Utilized across dashboard, portals, and lists when zero records exist:

- **Structure**: Center-aligned layout, purple-glow outline icon box (`bg-primary-muted/20 border-primary/20 shadow-glow-sm`), white heading, muted description, and secondary action button.

### C. Animated Toasts (`components/ui/toast.tsx`)

Success, Error, and Info push alerts with smooth slide-in/fade-out animations powered by `framer-motion`.

- **Contrast Compliance**:
  - Success toasts (`bg-emerald-950/80 border-emerald-500/30 text-emerald-100`).
  - Error toasts (`bg-red-950/80 border-red-500/30 text-red-100`).
  - Info toasts (`bg-background-surface/90 border-border/80 text-foreground`).

---

## 3. Brand Portal Visual Standards

The public Brand Portal is designed as a standalone consumer-grade workspace featuring a modern space-purple glow aesthetic.

### Visual Elements

- **Glow Header**: Ambient gradient glow wrapping around a building icon badge (`bg-primary-muted border-primary/20 text-primary`).
- **Grid Layout**: Large 12-column grid prioritizing deliverables checklist on the left, and review status/comment cards on the right.
- **Micro-interactions**: Hover-lifts on deliverables and status cards, and smooth progress tracking bars for file uploads.

---

## 4. Accessibility (WCAG AA Compliance)

All pages have been audited for contrast and keyboard navigability.

- **Focus Rings**: Added default 2px high-visibility electric indigo border offsets to inputs, buttons, and selectable cards (`focus-visible:ring-2 focus-visible:ring-ring`).
- **Text Contrast**: Text colors adapt dynamically to theme changes, avoiding hardcoded hex colors and using HSL tokens like `--foreground-muted` and `--foreground-subtle` with verified 4.5:1 contrast ratios.
