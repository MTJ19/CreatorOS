import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { InvisibleTaxController } from './invisible-tax.controller';
import { InvisibleTaxService } from './invisible-tax.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvisibleTaxController],
  providers: [InvisibleTaxService],
  exports: [InvisibleTaxService],
})
export class InvisibleTaxModule {}
