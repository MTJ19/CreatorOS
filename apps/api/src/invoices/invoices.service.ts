import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Queue } from 'bullmq';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  MarkPaidDto,
  PaymentTermsEnum,
  PAYMENT_TERMS_DAYS,
  InvoiceStatusEnum,
} from './invoices.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @InjectQueue('invoice-reminders') private readonly reminderQueue: Queue,
  ) {}

  // ─── Invoice Number Generation ────────────────────────────────

  /**
   * Generates an invoice number in format INV-YYYY-NNNN
   * Sequence is per-creator per-year (resets annually).
   */
  async generateInvoiceNumber(creatorId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    // Count existing invoices this year for this creator
    const count = await this.prisma.invoice.count({
      where: {
        creatorId,
        invoiceNumber: { startsWith: prefix },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  // ─── Totals Calculator ────────────────────────────────────────

  private calculateTotals(lineItems: { quantity: number; unitPrice: number }[], taxRate?: number) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = taxRate ? (subtotal * taxRate) / 100 : 0;
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
  }

  // ─── Due Date Calculator ──────────────────────────────────────

  private calculateDueDate(paymentTerms: PaymentTermsEnum, issuedAt: Date): Date {
    const days = PAYMENT_TERMS_DAYS[paymentTerms];
    const due = new Date(issuedAt);
    due.setDate(due.getDate() + days);
    return due;
  }

  // ─── CRUD ─────────────────────────────────────────────────────

  async findAll(creatorId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { creatorId },
      include: {
        lineItems: true,
        deal: { select: { id: true, brandName: true, title: true, stage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto-mark overdue
    const now = new Date();
    return invoices.map((inv) => {
      const isOverdue =
        inv.dueDate && inv.dueDate < now && !['PAID', 'CANCELLED', 'DISPUTED'].includes(inv.status);
      return {
        ...inv,
        isOverdue: !!isOverdue,
        outstandingAmount: Number(inv.totalAmount) - Number(inv.paidAmount ?? 0),
      };
    });
  }

  async findOne(id: string, creatorId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: { include: { deliverable: true } },
        deal: { select: { id: true, brandName: true, title: true, stage: true, amount: true } },
      },
    });
    if (!invoice || invoice.creatorId !== creatorId) {
      throw new NotFoundException(`Invoice "${id}" not found`);
    }
    return invoice;
  }

  async create(creatorId: string, dto: CreateInvoiceDto) {
    // Validate deal ownership if dealId provided
    if (dto.dealId) {
      const deal = await this.prisma.deal.findUnique({ where: { id: dto.dealId } });
      if (!deal || deal.creatorId !== creatorId) {
        throw new NotFoundException(`Deal "${dto.dealId}" not found`);
      }
    }

    if (!dto.lineItems?.length) {
      throw new BadRequestException('At least one line item is required');
    }

    const invoiceNumber = await this.generateInvoiceNumber(creatorId);
    const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
    const paymentTerms = dto.paymentTerms ?? PaymentTermsEnum.NET_30;
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : this.calculateDueDate(paymentTerms, issuedAt);

    const { subtotal, taxAmount, totalAmount } = this.calculateTotals(dto.lineItems, dto.taxRate);

    const invoice = await this.prisma.invoice.create({
      data: {
        creatorId,
        dealId: dto.dealId ?? null,
        invoiceNumber,
        brandName: dto.brandName,
        brandEmail: dto.brandEmail,
        brandAddress: dto.brandAddress ?? null,
        paymentTerms: paymentTerms as any,
        status: 'DRAFT',
        subtotal: new Prisma.Decimal(subtotal),
        taxRate: dto.taxRate ?? null,
        taxAmount: taxAmount ? new Prisma.Decimal(taxAmount) : null,
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: dto.currency ?? 'USD',
        issuedAt,
        dueDate,
        notes: dto.notes ?? null,
        termsAndConditions: dto.termsAndConditions ?? null,
        lineItems: {
          create: dto.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
            deliverableId: item.deliverableId ?? null,
          })),
        },
      },
      include: { lineItems: true },
    });

    // Schedule reminder job 3 days before due date
    const reminderDelay = dueDate.getTime() - Date.now() - 3 * 24 * 60 * 60 * 1000;
    if (reminderDelay > 0) {
      await this.reminderQueue
        .add(
          'payment-reminder',
          { invoiceId: invoice.id, creatorId, brandEmail: dto.brandEmail, invoiceNumber },
          { delay: reminderDelay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
        )
        .catch(() => {
          // Non-fatal — queue may not be available in dev/test
        });
    }

    await this.auditLog.log({
      userId: creatorId,
      action: 'invoice.create',
      resource: 'Invoice',
      resourceId: invoice.id,
      metadata: { invoiceNumber, totalAmount, dealId: dto.dealId },
    });

    return invoice;
  }

  async update(id: string, creatorId: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(id, creatorId);
    const prevStatus = existing.status;

    // Recalculate totals if line items are being replaced
    let subtotal = Number(existing.subtotal);
    let taxAmount = existing.taxAmount ? Number(existing.taxAmount) : 0;
    let totalAmount = Number(existing.totalAmount);

    if (dto.lineItems !== undefined) {
      const taxRate = dto.taxRate !== undefined ? dto.taxRate : existing.taxRate;
      const result = this.calculateTotals(dto.lineItems, taxRate ?? undefined);
      subtotal = result.subtotal;
      taxAmount = result.taxAmount;
      totalAmount = result.totalAmount;
    } else if (dto.taxRate !== undefined) {
      const result = this.calculateTotals(
        existing.lineItems.map((l) => ({
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
        })),
        dto.taxRate,
      );
      subtotal = result.subtotal;
      taxAmount = result.taxAmount;
      totalAmount = result.totalAmount;
    }

    // Recalculate due date if payment terms changed
    let dueDate = existing.dueDate;
    if (dto.paymentTerms && !dto.dueDate) {
      const issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : (existing.issuedAt ?? new Date());
      dueDate = this.calculateDueDate(dto.paymentTerms, issuedAt);
    } else if (dto.dueDate) {
      dueDate = new Date(dto.dueDate);
    }

    const updateData: Record<string, any> = {
      brandName: dto.brandName,
      brandEmail: dto.brandEmail,
      brandAddress: dto.brandAddress,
      paymentTerms: dto.paymentTerms as any,
      status: dto.status as any,
      taxRate: dto.taxRate,
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(taxAmount),
      totalAmount: new Prisma.Decimal(totalAmount),
      currency: dto.currency,
      issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
      dueDate: dueDate ?? undefined,
      notes: dto.notes,
      termsAndConditions: dto.termsAndConditions,
    };

    // Strip undefined keys
    Object.keys(updateData).forEach((k) => {
      if ((updateData as any)[k] === undefined) delete (updateData as any)[k];
    });

    // Replace line items if provided
    if (dto.lineItems !== undefined) {
      await this.prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...updateData,
        ...(dto.lineItems !== undefined
          ? {
              lineItems: {
                create: dto.lineItems.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: new Prisma.Decimal(item.unitPrice),
                  totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
                  deliverableId: item.deliverableId ?? null,
                })),
              },
            }
          : {}),
      },
      include: { lineItems: true },
    });

    // Audit status changes
    if (dto.status && dto.status !== prevStatus) {
      await this.auditLog.log({
        userId: creatorId,
        action: 'invoice.status_change',
        resource: 'Invoice',
        resourceId: id,
        metadata: { from: prevStatus, to: dto.status, invoiceNumber: existing.invoiceNumber },
      });
    }

    return invoice;
  }

  async remove(id: string, creatorId: string) {
    await this.findOne(id, creatorId);
    await this.prisma.invoice.delete({ where: { id } });
    await this.auditLog.log({
      userId: creatorId,
      action: 'invoice.delete',
      resource: 'Invoice',
      resourceId: id,
    });
  }

  async markPaid(id: string, creatorId: string, dto: MarkPaidDto) {
    const invoice = await this.findOne(id, creatorId);
    const totalAmount = Number(invoice.totalAmount);
    const paidAmount = dto.paidAmount ?? totalAmount;
    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    const newStatus =
      paidAmount >= totalAmount ? InvoiceStatusEnum.PAID : InvoiceStatusEnum.PARTIALLY_PAID;

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: new Prisma.Decimal(paidAmount),
        paidAt,
        status: newStatus as any,
      },
    });

    await this.auditLog.log({
      userId: creatorId,
      action: 'invoice.marked_paid',
      resource: 'Invoice',
      resourceId: id,
      metadata: { paidAmount, totalAmount, status: newStatus },
    });

    return updated;
  }

  // ─── Dashboard Integration ────────────────────────────────────

  async getOverdueSummary(creatorId: string) {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        creatorId,
        status: { notIn: ['PAID', 'CANCELLED', 'DISPUTED'] as any[] },
      },
      select: { id: true, totalAmount: true, paidAmount: true, dueDate: true, status: true },
    });

    let overdueCount = 0;
    let overdueAmount = 0;
    let outstandingAmount = 0;

    for (const inv of invoices) {
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount ?? 0);
      outstandingAmount += outstanding;
      if (inv.dueDate && inv.dueDate < now) {
        overdueCount++;
        overdueAmount += outstanding;
      }
    }

    return { overdueCount, overdueAmount, outstandingAmount };
  }
}
