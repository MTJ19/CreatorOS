# CreatorOS — Production Deployment & Operations Runbook

This runbook outlines standard procedures for deploying, updating, scaling, and rolling back CreatorOS backend and web applications in production.

---

## 1. System Architecture Summary

- **Frontend**: Next.js (App Router), deployed via ECS (Docker container) or CloudFront/S3 (if statically built).
- **Backend**: NestJS, running on ECS Fargate.
- **Database**: PostgreSQL (Prisma ORM) on AWS RDS.
- **Cache / Message Queue**: Redis (ElastiCache) for dashboard metrics caching and BullMQ queues.
- **Object Storage**: AWS S3 for campaign briefs and PDF attachments.

---

## 2. Infrastructure Setup & Environment

Verify that the following variables are configured in AWS Systems Manager (SSM) Parameter Store or ECS Task Definitions:

### API Server (`apps/api`)

- `DATABASE_URL`: PostgreSQL connection string (`postgresql://...`).
- `REDIS_URL`: Redis endpoint (`redis://...`).
- `JWT_SECRET`: Token signature key.
- `JWT_PORTAL_SECRET`: Dedicated Brand Portal JWT key.
- `AWS_S3_BUCKET`: Upload destination.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
- `NEXT_PUBLIC_APP_URL`: Web app origin (for CORS).

### Web App (`apps/web`)

- `NEXT_PUBLIC_API_URL`: Backend API server endpoint.
- `NEXT_PUBLIC_APP_URL`: Base application domain.
- `NEXTAUTH_SECRET`: NextAuth session encryption key.

---

## 3. Deployment Steps

We utilize Github Actions for fully automated Docker builds and ECS deployments:

### Step 3.1: Automated CI Pipeline

1. Lint, formatting, and unit tests check on every pull request.
2. Production Docker images are automatically compiled upon merging to `main`.

### Step 3.2: Manual Docker Deployments (Fallback)

If CD pipelines are down, build and push images manually:

```bash
# Build API
docker build -t creator-os-api -f apps/api/Dockerfile .
docker tag creator-os-api:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/creator-os-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/creator-os-api:latest

# Build Web
docker build -t creator-os-web -f apps/web/Dockerfile .
docker tag creator-os-web:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/creator-os-web:latest
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/creator-os-web:latest
```

### Step 3.3: Database Migrations

Prisma migrations are run as part of the ECS deployment pre-release step:

```bash
npx prisma migrate deploy
```

---

## 4. Rollback Instructions

In the event of critical alerts, regressions, or service downtime:

### ECS Task Definition Rollback

1. Open the **AWS ECS Console**.
2. Select the **CreatorOS Cluster** and go to **Services**.
3. Select the failing service (`creator-os-api` or `creator-os-web`), click **Update**.
4. Set the **Revision** to the previous stable Task Definition version.
5. Click **Force New Deployment** to roll back running containers immediately.

### S3 & CloudFront Cache Invalidation

If static assets or briefs are updated:

1. Invalidate CDN cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
   ```

---

## 5. Caching & Redis Maintenance

To clear the dashboard counts cache manually:

1. Connect to Redis CLI:
   ```bash
   redis-cli -u redis://<REDIS_ENDPOINT>:6379
   ```
2. Invalidate deal dashboard cache:
   ```redis
   DEL cache:deals:dashboard
   ```
