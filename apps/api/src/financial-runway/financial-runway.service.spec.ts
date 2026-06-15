import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { FinancialRunwayService } from './financial-runway.service';

const mockPrisma = {
  deal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
  },
  financialSettings: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('FinancialRunwayService', () => {
  let service: FinancialRunwayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialRunwayService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FinancialRunwayService>(FinancialRunwayService);
    jest.clearAllMocks();
  });

  // ── Confidence-Weighted Projections ───────────────────────────

  describe('getProjection', () => {
    it('applies correct confidence multipliers: CONFIRMED=1.0, LIKELY=0.7, SPECULATIVE=0.3', async () => {
      const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);

      mockPrisma.deal.findMany.mockResolvedValue([
        { id: 'd1', brandName: 'Brand A', amount: new Prisma.Decimal(1000), confidence: 'CONFIRMED', deadline: in20Days, stage: 'ACTIVE' },
        { id: 'd2', brandName: 'Brand B', amount: new Prisma.Decimal(1000), confidence: 'LIKELY', deadline: in20Days, stage: 'NEGOTIATING' },
        { id: 'd3', brandName: 'Brand C', amount: new Prisma.Decimal(1000), confidence: 'SPECULATIVE', deadline: in20Days, stage: 'PITCH_SENT' },
      ]);
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.financialSettings.findUnique.mockResolvedValue(null);

      const result = await service.getProjection('creator-1');

      // 30-day projection: all 3 deals within 30 days
      // 1000*1.0 + 1000*0.7 + 1000*0.3 = 2000
      expect(result.projection30.gross).toBeCloseTo(2000, 0);
      expect(result.projection30.dealCount).toBe(3);
    });

    it('only includes deals with deadlines within the time horizon', async () => {
      const in20Days = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
      const in45Days = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
      const in80Days = new Date(Date.now() + 80 * 24 * 60 * 60 * 1000);

      mockPrisma.deal.findMany.mockResolvedValue([
        { id: 'd1', brandName: 'A', amount: new Prisma.Decimal(1000), confidence: 'CONFIRMED', deadline: in20Days, stage: 'ACTIVE' },
        { id: 'd2', brandName: 'B', amount: new Prisma.Decimal(2000), confidence: 'CONFIRMED', deadline: in45Days, stage: 'ACTIVE' },
        { id: 'd3', brandName: 'C', amount: new Prisma.Decimal(3000), confidence: 'CONFIRMED', deadline: in80Days, stage: 'ACTIVE' },
      ]);
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.financialSettings.findUnique.mockResolvedValue(null);

      const result = await service.getProjection('creator-1');

      expect(result.projection30.dealCount).toBe(1);  // only in20Days
      expect(result.projection60.dealCount).toBe(2);  // in20Days + in45Days
      expect(result.projection90.dealCount).toBe(3);  // all 3
    });

    it('returns null netRunwayMonths when monthlyFixedCosts is 0', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.financialSettings.findUnique.mockResolvedValue({
        monthlyFixedCosts: new Prisma.Decimal(0),
        currency: 'USD',
      });

      const result = await service.getProjection('creator-1');
      expect(result.netRunwayMonths).toBeNull();
    });

    it('calculates outstanding receivables and overdue amounts correctly', async () => {
      const pastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const futureDue = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'i1',
          totalAmount: new Prisma.Decimal(2000),
          paidAmount: null,
          dueDate: pastDue,
          status: 'SENT',
        },
        {
          id: 'i2',
          totalAmount: new Prisma.Decimal(1000),
          paidAmount: new Prisma.Decimal(400),
          dueDate: futureDue,
          status: 'PARTIALLY_PAID',
        },
      ]);
      mockPrisma.financialSettings.findUnique.mockResolvedValue(null);

      const result = await service.getProjection('creator-1');

      // Outstanding: 2000 + (1000 - 400) = 2600
      expect(result.outstandingReceivables).toBe(2600);
      // Overdue: 2000 (only past due)
      expect(result.overdueAmount).toBe(2000);
    });

    it('computes correct net runway months', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([]);
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'i1',
          totalAmount: new Prisma.Decimal(6000),
          paidAmount: null,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'SENT',
        },
      ]);
      mockPrisma.financialSettings.findUnique.mockResolvedValue({
        monthlyFixedCosts: new Prisma.Decimal(2000),
        currency: 'USD',
      });

      const result = await service.getProjection('creator-1');

      // netRunway = (6000 - 0 + 0) / 2000 = 3 months
      expect(result.netRunwayMonths).toBeCloseTo(3, 1);
    });
  });

  // ── Settings ──────────────────────────────────────────────────

  describe('getSettings', () => {
    it('returns default values when no settings exist', async () => {
      mockPrisma.financialSettings.findUnique.mockResolvedValue(null);
      const result = await service.getSettings('creator-1');
      expect(result.monthlyFixedCosts).toBe(0);
      expect(result.currency).toBe('USD');
    });
  });
});
