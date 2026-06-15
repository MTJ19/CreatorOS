import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

interface InvoiceReminderJob {
  invoiceId: string;
  creatorId: string;
  brandEmail: string;
  invoiceNumber: string;
}

@Processor('invoice-reminders')
export class InvoiceReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceReminderProcessor.name);

  process(job: Job<InvoiceReminderJob>): Promise<void> {
    const { invoiceId, brandEmail, invoiceNumber } = job.data;

    this.logger.log(
      `Processing payment reminder for invoice ${invoiceNumber} → ${brandEmail} (job #${job.id})`,
    );

    /**
     * EMAIL STUB — replace with SES/Resend call when credentials are available.
     *
     * Example with Resend:
     * await resend.emails.send({
     *   from: 'payments@creatoros.io',
     *   to: brandEmail,
     *   subject: `Payment Reminder: ${invoiceNumber} due soon`,
     *   html: `<p>Your invoice ${invoiceNumber} is due in 3 days. Please arrange payment.</p>`,
     * });
     */

    this.logger.log(
      `[EMAIL STUB] Reminder sent for invoice ${invoiceId} to ${brandEmail}`,
    );
    return Promise.resolve();
  }
}
