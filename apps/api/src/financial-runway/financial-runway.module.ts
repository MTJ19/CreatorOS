import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { FinancialRunwayController } from './financial-runway.controller';
import { FinancialRunwayService } from './financial-runway.service';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialRunwayController],
  providers: [FinancialRunwayService],
  exports: [FinancialRunwayService],
})
export class FinancialRunwayModule {}
