# CreatorOS — Environment Requirements Audit

This document summarizes the system and configuration audit for CreatorOS, detailing version checks and environment variable validation.

---

## 1. Tool Version Verification

We have validated the running environments against package engine constraints:

| Component | Required | Detected | Status | Notes |
|---|---|---|---|---|
| **Node.js** | `>=20.0.0` | `22.22.3` | **Pass** | Satisfies requirement. |
| **pnpm** | `>=9.0.0` | `9.12.0` | **Pass** | Satisfies requirement. |
| **TypeScript** | `^5.5.3` | `5.9.3` | **Pass** | Satisfies requirement. |
| **Prisma** | `^5.17.0` | `5.22.0` | **Pass** | Satisfies requirement. |

---

## 2. Infrastructure & Docker Requirements

- **PostgreSQL Database:** `postgres:16-alpine` (Exposed on `5432`).
- **Redis Cache/Queue:** `redis:7-alpine` (Exposed on `6379`).

---

## 3. Environment Variable Audit

We audited files:
- `.env.example` (Root template)
- `apps/api/.env` (API DB lookup)
- `apps/api/.env.local` (API environment)
- `apps/web/.env.local` (Web environment)

### A. Missing / Unset Variables (Required for external service integrations)
These variables exist as placeholders in `.env.example` but are empty in the active local configs:
- **AWS S3 Assets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (Needed for uploading deliverables, PDFs, and invoices)
- **Google Gemini API:** `GEMINI_API_KEY` (Needed for AI contract summary and risk assessment)
- **Stripe Payments:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Needed for invoicing and checkout)
- **Email Service:** `RESEND_API_KEY` (Needed for invoice dispatch and brand portal alerts)
- **Error Logging:** `SENTRY_DSN`

### B. Placeholder / Mock Variables (Functional for local dev but require production secrets)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/web/.env.local` are set to generic/mock OAuth credentials.
- `JWT_SECRET` / `JWT_REFRESH_SECRET` and `AUTH_SECRET` are set to local development keys.

### C. Inconsistent / Duplicate Configuration
- `JWT_SECRET` and `JWT_REFRESH_SECRET` are defined in both `apps/api/.env.local` and `apps/web/.env.local`. They must match exactly for auth sharing/token verification. Currently, they are consistent.
- `DATABASE_URL` is set to `postgresql://postgres:postgres@localhost:5432/creator_os_dev?schema=public` in local env files, but in `docker-compose.yml` for internal containers, it is defined as `postgresql://postgres:postgres@postgres:5432/creator_os_dev?schema=public` (resolved using Docker's bridge network namespace). This is correct since internal network containers communicate using the container hostnames.
