import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { PrismaModule } from '../prisma/prisma.module';

import { InvoiceReminderProcessor } from './invoice-reminder.processor';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

const isRedisConfigured = !!process.env.REDIS_URL || !!process.env.REDIS_HOST;

const bullModuleQueue = isRedisConfigured
  ? BullModule.registerQueue({ name: 'invoice-reminders' })
  : null;

const fakeQueueProvider = {
  provide: getQueueToken('invoice-reminders'),
  useValue: {
    add: async () => {
      // console.warn('Redis not configured, skipping queue addition');
    },
  },
};

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    ...(bullModuleQueue ? [bullModuleQueue] : []),
  ],
  controllers: [InvoicesController],
  providers: [
    InvoicesService,
    ...(isRedisConfigured ? [InvoiceReminderProcessor] : [fakeQueueProvider]),
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
