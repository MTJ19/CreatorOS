import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiModule } from '../gemini/gemini.module';
import { PersonaEvaluatorAgent } from './persona-evaluator.agent';
import { PlatformPatternAgent } from './platform-pattern.agent';
import { WorkerPoolService } from './worker-pool.service';
import { AggregationEngine } from './aggregation.engine';
import { ContentHealthService } from './content-health.service';
import { ContentHealthController } from './content-health.controller';

@Module({
  imports: [PrismaModule, GeminiModule],
  controllers: [ContentHealthController],
  providers: [
    PersonaEvaluatorAgent,
    PlatformPatternAgent,
    WorkerPoolService,
    AggregationEngine,
    ContentHealthService,
  ],
  exports: [ContentHealthService],
})
export class ContentHealthModule {}
