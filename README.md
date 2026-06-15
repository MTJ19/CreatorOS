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

## 3. Local Development Setup

### Prerequisites

- Node.js (version 20+)
- pnpm (version 9+)
- Docker (for database and Redis services)

### Step 3.1: Install Dependencies

From the root workspace directory, run:

```bash
pnpm install
```

### Step 3.2: Start Services (Database & Redis)

Spin up PostgreSQL and Redis local containers via Docker Compose:

```bash
docker-compose up -d
```

### Step 3.3: Configure Environment Variables

Copy `.env.example` to `.env` in `apps/api`:

```bash
cp apps/api/.env.example apps/api/.env
```

Ensure your database credentials match the `docker-compose.yml` config.

### Step 3.4: Generate Database Client & Seed

Generate the Prisma client and run seed scripts to populate mock deals and analytics:

```bash
pnpm db:generate
pnpm --filter @creator-os/api db:migrate
pnpm --filter @creator-os/api db:seed
```

### Step 3.5: Run Developer Servers

Start both the NestJS API server and Next.js client concurrently:

```bash
pnpm dev
```

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:3001](http://localhost:3001)

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
