# CreatorOS — AI-Powered Creator Deal Management Platform

CreatorOS (DEALOS) is a monorepo platform designed for content creators to manage brand sponsorship inquiries, evaluate rate benchmarks, parse briefs, analyze contracts, track performance, and handle invisible tax calculations and invoices.

---

## 1. Project Architecture

This project is configured as a **pnpm monorepo workspace** managed with **Turborepo** for build caching and task pipelines:

```
├── apps
│   ├── api          # NestJS backend (API Server)
│   └── web          # Next.js frontend (Client Application)
├── packages
│   └── shared       # Shared TypeScript schemas, DTOs, and validation logic
```

---

## 2. Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion.
- **Backend**: NestJS, Prisma ORM, Passport, Multer, BullMQ, Helmet, Throttle.
- **Databases**: PostgreSQL (Main store) & Redis (Caching and queues).

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- pnpm

### Database
This project uses Supabase (PostgreSQL). Create a free project at https://supabase.com and copy your connection string into apps/api/.env as DATABASE_URL.

### Cache
This project uses Upstash Redis. Create a free database at https://upstash.com and copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN into apps/api/.env.

### Running locally
```bash
# Install dependencies
pnpm install

# Apply database migrations
cd apps/api && pnpm prisma migrate deploy

# Seed benchmark data
cd apps/api && pnpm prisma db seed

# Start dev servers
pnpm dev
```

The API runs on http://localhost:3001
The web app runs on http://localhost:3000

---

## 4. Workspaces & Commands

Run commands from the root using Turborepo filters:

| Task       | Command           | Description                                  |
| ---------- | ----------------- | -------------------------------------------- |
| Run Dev    | `pnpm dev`        | Starts frontend & backend dev servers        |
| Build All  | `pnpm build`      | Compiles shared packages, backend & frontend |
| Lint Code  | `pnpm lint`       | Audits style and formatting rules            |
| Type Check | `pnpm type-check` | Compiles TS without outputting files         |
| Run Tests  | `pnpm test`       | Runs unit tests across all workspaces        |
| E2E Tests  | `pnpm test:e2e`   | Runs NestJS E2E integration tests            |

---

## 5. API Documentation (Swagger)

When the NestJS backend is running, Swagger docs are exposed at:
👉 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**
Use this to test request body schemas, parameters, and authentication guards.
