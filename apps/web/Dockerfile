# Base image with Node.js and Corepack enabled for PNPM support
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Build Next.js project
FROM base AS builder
WORKDIR /app

# Copy monorepo workspace configurations and locks
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Set defaults for build environment variables
ARG NEXT_PUBLIC_API_URL="http://localhost:3001"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build shared package and Next.js app
RUN pnpm --filter @creator-os/shared build
RUN pnpm --filter @creator-os/web build

# Stage 2: Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and Next.js build files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./app/apps/web/package.json
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js

EXPOSE 3000

# Start Next.js server
CMD ["pnpm", "--filter", "@creator-os/web", "start"]
