import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { GeminiModule } from '../gemini/gemini.module';

import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [GeminiModule, AuditLogModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
