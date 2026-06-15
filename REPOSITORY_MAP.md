# CreatorOS — Repository Map

This document outlines the high-level architecture, module breakdown, and configurations of the CreatorOS repository.

---

## 1. Monorepo & Directory Structure

The repository is organized as a pnpm monorepo managed with Turborepo.

```
AI-Manager/                          # Monorepo root
├── .github/
│   └── workflows/
│       └── ci.yml                   # CI/CD pipelines
├── .husky/                          # Git hooks (pre-commit, commit-msg)
├── apps/
│   ├── api/                         # NestJS API backend
│   │   ├── prisma/                  # Prisma Database schema and migrations
│   │   ├── src/                     # NestJS application source code
│   │   └── test/                    # NestJS end-to-end (E2E) tests
│   └── web/                         # Next.js 14 App Router frontend
│       └── src/                     # Next.js application source code (app, components, lib)
├── packages/
│   └── shared/                      # Shared types & schemas between api and web
│       └── src/                     # Shared TypeScript source code
├── scripts/                         # Initialization and helper scripts
├── docker-compose.yml               # Local development services (Postgres, Redis, api, web)
├── package.json                     # Monorepo root configuration and workspace scripts
├── pnpm-workspace.yaml              # Define monorepo packages
├── tsconfig.json                    # Base TypeScript config
├── turbo.json                       # Turborepo task pipeline configuration
├── .eslintrc.js                     # Shared ESLint rule configuration
└── .env.example                     # Environment template file
```

---

## 2. Workspaces & Packages

| Workspace / Package  | Directory         | Tech Stack                                           | Description                                                                                           |
| -------------------- | ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@creator-os/api`    | `apps/api`        | NestJS, Prisma, PostgreSQL, Redis, BullMQ, Jest      | Core API services supporting creator profile, deals, contracts, invoicing, and tax calculations.      |
| `@creator-os/web`    | `apps/web`        | Next.js 14 (App Router), Tailwind CSS, Framer Motion | User-facing dashboard, deal pipeline (Kanban), rates, tax estimates, invoices, and brand portal view. |
| `@creator-os/shared` | `packages/shared` | TypeScript, Zod, tsup                                | Shared validation schemas and TypeScript types used for type safety across client and server.         |

---

## 3. Infrastructure & Services

- **Database:** PostgreSQL database containing tables for `User`, `CreatorProfile`, `Deal`, `Deliverable`, `Contract`, `Invoice`, `PerformanceLog`, and `BrandPortalToken`.
- **Cache / Job Queue:** Redis (using BullMQ in NestJS) for performance caching and job scheduling.
- **Docker Dev Environment:** A unified `docker-compose.yml` spins up `postgres`, `redis`, `api`, and `web` in connected bridge network development environments.
