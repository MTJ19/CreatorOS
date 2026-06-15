import { Module } from '@nestjs/common';

import { GeminiModule } from '../gemini/gemini.module';

import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [GeminiModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}

