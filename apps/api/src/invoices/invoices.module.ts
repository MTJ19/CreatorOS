import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { PrismaModule } from '../prisma/prisma.module';

import { InvoiceReminderProcessor } from './invoice-reminder.processor';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';


@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    BullModule.registerQueue({
      name: 'invoice-reminders',
    }),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceReminderProcessor],
  exports: [InvoicesService],
})
export class InvoicesModule {}
