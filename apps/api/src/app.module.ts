import { BullModule } from '@nestjs/bullmq';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { BrandPortalModule } from './brand-portal/brand-portal.module';
import { PortalRateLimitMiddleware } from './brand-portal/portal-rate-limit.middleware';
import { ContractsModule } from './contracts/contracts.module';
import { CreatorProfileModule } from './creator-profile/creator-profile.module';
import { DealsModule } from './deals/deals.module';
import { FinancialRunwayModule } from './financial-runway/financial-runway.module';
import { GeminiModule } from './gemini/gemini.module';
import { HealthModule } from './health/health.module';
import { InvisibleTaxModule } from './invisible-tax/invisible-tax.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PerformanceModule } from './performance/performance.module';
import { PrismaModule } from './prisma/prisma.module';
import { RateIntelligenceModule } from './rate-intelligence/rate-intelligence.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    // Configuration — loads .env, validates required vars
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting — 100 req/min default; overridden per-route for auth
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100,
      },
    ]),

    // BullMQ — connects to same Redis as cache
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
        },
      }),
    }),

    // Health checks
    TerminusModule,
    HealthModule,

    // Database
    PrismaModule,

    // Audit logging (shared across modules)
    AuditLogModule,

    // Auth & Identity
    AuthModule,
    CreatorProfileModule,

    // Feature modules
    DealsModule,
    ContractsModule,
    InvoicesModule,
    PerformanceModule,
    BrandPortalModule,
    GeminiModule,
    RateIntelligenceModule,
    RedisModule,
    StorageModule,
    InvisibleTaxModule,
    FinancialRunwayModule,
  ],
  providers: [
    // Global rate-limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Separate rate limiter for public portal routes (30 req/min per IP)
    consumer.apply(PortalRateLimitMiddleware).forRoutes('api/v1/portal/*');
  }
}
