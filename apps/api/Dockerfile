# Base image with Node.js and Corepack enabled for PNPM support
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Build the NestJS app and dependencies
FROM base AS builder
WORKDIR /app

# Copy lockfile and workspace configs
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Generate Prisma Client and build projects
RUN pnpm --filter @creator-os/api db:generate
RUN pnpm --filter @creator-os/shared build
RUN pnpm --filter @creator-os/api build

# Prune dev dependencies for production size optimization
RUN pnpm prune --prod --ignore-scripts

# Stage 2: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy node_modules and built builds from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 3001

# Start the NestJS API server
CMD ["node", "apps/api/dist/main"]
