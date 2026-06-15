# Phase 4 — Lint Recovery

This document summarizes the linting recovery steps completed to stabilize the monorepo using strict rules without global overrides.

## Summary of Fixes

### 1. Next.js Dynamic Routing Bracket Issue
- **Problem:** ESLint's path glob patterns failed to parse directory names with square brackets, specifically Next.js dynamic routing path `/portal/[token]/page.tsx`.
- **Solution:** Configured pattern mapping in `apps/web/.eslintrc.json` using a wildcard `?token?` instead of square brackets to avoid parsing conflicts.

### 2. Type-Safe Brand Portal Refactoring (`brand-portal/page.tsx`)
- **Problem:** Many lines threw `@typescript-eslint/no-unsafe-assignment`, `@typescript-eslint/no-unsafe-member-access`, and `@typescript-eslint/no-unsafe-argument` due to variables and state elements typed as `any`.
- **Solution:** 
  - Defined strict TypeScript interfaces `PortalDeal`, `PortalSubmission`, `PortalComment`, `BrandPortalToken`, `TokenActivity`, and `GeneratedTokenResponse`.
  - Re-typed React `useState` hooks to use concrete interfaces instead of `any[]` or `any | null`.
  - Cast promise results from API client requests (`listTokens`, `getAll`, `getActivity`, `addCreatorComment`) to their respective interfaces.
  - Replaced catch block arguments (`err: any`) with typed catch handlers, accessing properties conditionally (`err instanceof Error`).
  - Typed the `latestApprovalStatusVariant` helper function return value explicitly as a union literal of Badge variant options, eliminating the unsafe `as any` cast.
  - Unused imports (`Calendar`, `ShieldCheck`) were removed.

### 3. NextAuth Type Extensions (`next-auth.d.ts`)
- **Problem:** NextAuth's `Session` type does not expose custom attributes like `accessToken` or `role`.
- **Solution:** Created `apps/web/src/types/next-auth.d.ts` extending NextAuth module interfaces safely to type check `session?.accessToken`.

### 4. Toast Hooks Dependency Fixes
- **Problem:** React Hook `useCallback` inside `toast.tsx` was missing the `removeToast` dependency.
- **Solution:** Declared `removeToast` hook before `toast` and added `removeToast` to its dependency array.

## Verification
- Ran `pnpm run lint` across the monorepo:
  - `@creator-os/shared`: Cached & clean
  - `@creator-os/api`: Cached & clean
  - `@creator-os/web`: Linted successfully with **zero warnings or errors**.
