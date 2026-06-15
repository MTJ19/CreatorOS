import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

import { BrandPortalController } from './brand-portal.controller';
import { BrandPortalService } from './brand-portal.service';
import { PortalPublicController } from './portal-public.controller';
import { PortalTokenGuard } from './portal-token.guard';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_PORTAL_SECRET',
          configService.get<string>('JWT_SECRET', 'dev-secret-change-in-prod'),
        ),
      }),
      inject: [ConfigService],
    }),
    MulterModule.register({
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  ],
  controllers: [BrandPortalController, PortalPublicController],
  providers: [BrandPortalService, PortalTokenGuard],
  exports: [BrandPortalService],
})
export class BrandPortalModule {}
