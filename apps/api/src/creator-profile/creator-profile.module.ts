import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { PrismaModule } from '../prisma/prisma.module';

import { CreatorProfileController } from './creator-profile.controller';
import { CreatorProfileRepository } from './creator-profile.repository';
import { CreatorProfileService } from './creator-profile.service';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [CreatorProfileController],
  providers: [CreatorProfileService, CreatorProfileRepository],
  exports: [CreatorProfileService],
})
export class CreatorProfileModule {}
