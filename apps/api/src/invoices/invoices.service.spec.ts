import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { PaymentTermsEnum } from './invoices.dto';
import { InvoicesService } from './invoices.service';

const mockPrisma = {
  invoice: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  invoiceLineItem: {
    deleteMany: jest.fn(),
  },
  deal: {
    findUnique: jest.fn(),
  },
};

const mockAuditLog = { log: jest.fn() };
const mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: getQueueToken('invoice-reminders'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    jest.clearAllMocks();
  });

  // ── Invoice Number Generation ────────────────────────────────

  describe('generateInvoiceNumber', () => {
    it('generates INV-YYYY-0001 for first invoice of the year', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      const year = new Date().getFullYear();
      const result = await service.generateInvoiceNumber('creator-1');
      expect(result).toBe(`INV-${year}-0001`);
    });

    it('increments sequence for subsequent invoices', async () => {
      mockPrisma.invoice.count.mockResolvedValue(4);
      const year = new Date().getFullYear();
      const result = await service.generateInvoiceNumber('creator-1');
      expect(result).toBe(`INV-${year}-0005`);
    });
  });

  // ── Totals Calculation ────────────────────────────────────────

  describe('calculateTotals (via create)', () => {
    it('calculates subtotal, taxAmount, and totalAmount correctly', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.deal.findUnique.mockResolvedValue(null);
      mockPrisma.invoice.create.mockImplementation(({ data }) => ({
        id: 'inv-1',
        ...data,
        lineItems: [],
      }));

      const dto = {
        brandName: 'Brand A',
        brandEmail: 'brand@test.com',
        taxRate: 10,
        lineItems: [
          { description: 'Reel', quantity: 2, unitPrice: 500 },
          { description: 'Story', quantity: 3, unitPrice: 100 },
        ],
      } as any;

      await service.create('creator-1', dto);

      const createArg = mockPrisma.invoice.create.mock.calls[0][0].data;
      // subtotal = 2*500 + 3*100 = 1300
      expect(Number(createArg.subtotal)).toBeCloseTo(1300, 2);
      // taxAmount = 1300 * 10 / 100 = 130
      expect(Number(createArg.taxAmount)).toBeCloseTo(130, 2);
      // totalAmount = 1300 + 130 = 1430
      expect(Number(createArg.totalAmount)).toBeCloseTo(1430, 2);
    });

    it('calculates totalAmount with no tax', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }) => ({
        id: 'inv-2',
        ...data,
        lineItems: [],
      }));

      const dto = {
        brandName: 'Brand B',
        brandEmail: 'b@test.com',
        lineItems: [{ description: 'Post', quantity: 1, unitPrice: 2000 }],
      } as any;

      await service.create('creator-1', dto);
      const createArg = mockPrisma.invoice.create.mock.calls[0][0].data;
      expect(Number(createArg.subtotal)).toBeCloseTo(2000, 2);
      expect(Number(createArg.totalAmount)).toBeCloseTo(2000, 2);
    });
  });

  // ── Due Date Calculation ──────────────────────────────────────

  describe('calculateDueDate', () => {
    it('auto-calculates due date as 30 days from issuedAt for NET_30', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }) => ({
        id: 'inv-3',
        ...data,
        lineItems: [],
      }));

      const issuedAt = '2026-01-01T00:00:00Z';
      const dto = {
        brandName: 'Brand C',
        brandEmail: 'c@test.com',
        paymentTerms: PaymentTermsEnum.NET_30,
        issuedAt,
        lineItems: [{ description: 'Post', quantity: 1, unitPrice: 500 }],
      } as any;

      await service.create('creator-1', dto);
      const createArg = mockPrisma.invoice.create.mock.calls[0][0].data;
      const dueDate = createArg.dueDate as Date;
      expect(dueDate.getDate()).toBe(31); // Jan 1 + 30 days = Jan 31
    });

    it('auto-calculates due date as 15 days for NET_15', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      mockPrisma.invoice.create.mockImplementation(({ data }) => ({
        id: 'inv-4',
        ...data,
        lineItems: [],
      }));

      const issuedAt = '2026-02-01T00:00:00Z';
      const dto = {
        brandName: 'Brand D',
        brandEmail: 'd@test.com',
        paymentTerms: PaymentTermsEnum.NET_15,
        issuedAt,
        lineItems: [{ description: 'Story', quantity: 1, unitPrice: 200 }],
      } as any;

      await service.create('creator-1', dto);
      const createArg = mockPrisma.invoice.create.mock.calls[0][0].data;
      const dueDate = createArg.dueDate as Date;
      expect(dueDate.getDate()).toBe(16); // Feb 1 + 15 = Feb 16
    });
  });

  // ── Status Transitions ────────────────────────────────────────

  describe('markPaid', () => {
    const mockInvoice = {
      id: 'inv-5',
      creatorId: 'creator-1',
      totalAmount: new Prisma.Decimal(1000),
      paidAmount: null,
      invoiceNumber: 'INV-2026-0001',
      lineItems: [],
    };

    it('marks invoice as PAID when full amount is received', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'PAID' });

      await service.markPaid('inv-5', 'creator-1', { paidAmount: 1000 });

      const updateArg = mockPrisma.invoice.update.mock.calls[0][0].data;
      expect(updateArg.status).toBe('PAID');
      expect(Number(updateArg.paidAmount)).toBe(1000);
    });

    it('marks invoice as PARTIALLY_PAID when partial amount received', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'PARTIALLY_PAID' });

      await service.markPaid('inv-5', 'creator-1', { paidAmount: 500 });

      const updateArg = mockPrisma.invoice.update.mock.calls[0][0].data;
      expect(updateArg.status).toBe('PARTIALLY_PAID');
    });

    it('marks FULLY PAID when paidAmount is omitted (assumes totalAmount)', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrisma.invoice.update.mockResolvedValue({ ...mockInvoice, status: 'PAID' });

      await service.markPaid('inv-5', 'creator-1', {});

      const updateArg = mockPrisma.invoice.update.mock.calls[0][0].data;
      expect(updateArg.status).toBe('PAID');
      expect(Number(updateArg.paidAmount)).toBe(1000); // equals totalAmount
    });
  });

  // ── Overdue Detection ─────────────────────────────────────────

  describe('getOverdueSummary', () => {
    it('correctly identifies overdue invoices and sums amounts', async () => {
      const pastDue = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'i1',
          totalAmount: new Prisma.Decimal(1000),
          paidAmount: null,
          dueDate: pastDue,
          status: 'SENT',
        },
        {
          id: 'i2',
          totalAmount: new Prisma.Decimal(500),
          paidAmount: new Prisma.Decimal(200),
          dueDate: pastDue,
          status: 'PARTIALLY_PAID',
        },
        {
          id: 'i3',
          totalAmount: new Prisma.Decimal(800),
          paidAmount: null,
          dueDate: futureDue,
          status: 'SENT',
        },
      ]);

      const result = await service.getOverdueSummary('creator-1');

      expect(result.overdueCount).toBe(2);
      expect(result.overdueAmount).toBe(1300); // 1000 + (500 - 200)
      expect(result.outstandingAmount).toBe(2100); // 1000 + 300 + 800
    });
  });

  // ── Create Validation ─────────────────────────────────────────

  describe('create', () => {
    it('throws BadRequestException when no line items provided', async () => {
      mockPrisma.invoice.count.mockResolvedValue(0);
      const dto = {
        brandName: 'Brand',
        brandEmail: 'b@test.com',
        lineItems: [],
      } as any;
      await expect(service.create('creator-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when dealId belongs to a different creator', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'other-creator' });
      const dto = {
        brandName: 'Brand',
        brandEmail: 'b@test.com',
        dealId: 'deal-1',
        lineItems: [{ description: 'Post', quantity: 1, unitPrice: 500 }],
      } as any;
      await expect(service.create('creator-1', dto)).rejects.toThrow(NotFoundException);
    });
  });
});
