import { Module } from '@nestjs/common';

import { GeminiModule } from '../gemini/gemini.module';
import { PrismaModule } from '../prisma/prisma.module';

import { RateIntelligenceController } from './rate-intelligence.controller';
import { RateIntelligenceService } from './rate-intelligence.service';
import { BrandIntelService } from './brand-intel.service';
import { ComparableVectorSearchService } from './comparable-vector-search.service';

@Module({
  imports: [GeminiModule, PrismaModule],
  controllers: [RateIntelligenceController],
  providers: [RateIntelligenceService, BrandIntelService, ComparableVectorSearchService],
})
export class RateIntelligenceModule {}
