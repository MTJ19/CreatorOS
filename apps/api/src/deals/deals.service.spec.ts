import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DealStage } from '@prisma/client';

import { AuditLogService } from '../audit-log/audit-log.service';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

import { DealsService } from './deals.service';

const mockPrisma = {
  deal: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  contract: {
    findMany: jest.fn(),
  },
  invoice: {
    findMany: jest.fn(),
  },
  performanceLog: {
    findMany: jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockAuditLog = {
  log: jest.fn(),
};

const mockStorage = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
};

const mockGemini = {
  generateStructured: jest.fn(),
};

describe('DealsService', () => {
  let service: DealsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: StorageService, useValue: mockStorage },
        { provide: GeminiService, useValue: mockGemini },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns enriched deals', async () => {
      const mockDeals = [
        {
          id: 'deal-1',
          creatorId: 'creator-1',
          brandName: 'Brand A',
          amount: 1000,
          stage: DealStage.NEW_INQUIRY,
          performanceLogs: [
            {
              metrics: {
                views: 10000,
                likes: 400,
                comments: 100,
                saves: 50,
                shares: 50,
                cpv: 0.1,
              },
            },
          ],
        },
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const result = await service.findAll('creator-1');
      expect(result).toHaveLength(1);
      expect(result[0].computed.views).toBe(10000);
      expect(result[0].computed.engagementRate).toBe(6.0); // (400+100+50+50)/10000 * 100 = 6%
      expect(result[0].computed.performanceRating).toBe('HIGH');
    });
  });

  describe('findOne', () => {
    it('returns deal if owned by creator', async () => {
      const mockDeal = {
        id: 'deal-1',
        creatorId: 'creator-1',
        brandName: 'Brand A',
        amount: 1000,
        stage: DealStage.NEW_INQUIRY,
        performanceLogs: [],
      };
      mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);

      const result = await service.findOne('deal-1', 'creator-1');
      expect(result.id).toBe('deal-1');
    });

    it('throws NotFoundException if deal not found or not owned', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue(null);
      await expect(service.findOne('deal-1', 'creator-1')).rejects.toThrow(NotFoundException);

      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'other-creator' });
      await expect(service.findOne('deal-1', 'creator-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a deal and invalidates dashboard cache', async () => {
      const dto = {
        brandName: 'Brand A',
        title: 'Ad Campaign',
        amount: 1000,
        deliverables: [],
      };
      mockPrisma.deal.create.mockResolvedValue({ id: 'deal-1', ...dto });

      const result = await service.create('creator-1', dto as any);
      expect(result.id).toBe('deal-1');
      expect(mockRedis.del).toHaveBeenCalledWith('creator:dashboard:stats:creator-1');
    });
  });

  describe('updateStage', () => {
    it('allows valid transitions, logs audit log, and invalidates cache', async () => {
      const existingDeal = {
        id: 'deal-1',
        creatorId: 'creator-1',
        stage: DealStage.NEW_INQUIRY,
        amount: 1000,
        performanceLogs: [],
      };
      mockPrisma.deal.findUnique.mockResolvedValue(existingDeal);
      mockPrisma.deal.update.mockResolvedValue({ ...existingDeal, stage: DealStage.QUALIFIED });

      const result = await service.updateStage('deal-1', 'creator-1', DealStage.QUALIFIED);
      expect(result.stage).toBe(DealStage.QUALIFIED);
      expect(mockAuditLog.log).toHaveBeenCalledWith({
        userId: 'creator-1',
        action: 'deal.stage_change',
        resource: 'Deal',
        resourceId: 'deal-1',
        metadata: { from: DealStage.NEW_INQUIRY, to: DealStage.QUALIFIED },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('creator:dashboard:stats:creator-1');
    });

    it('throws BadRequestException for invalid transitions', async () => {
      const existingDeal = {
        id: 'deal-1',
        creatorId: 'creator-1',
        stage: DealStage.NEW_INQUIRY,
        amount: 1000,
        performanceLogs: [],
      };
      mockPrisma.deal.findUnique.mockResolvedValue(existingDeal);

      await expect(service.updateStage('deal-1', 'creator-1', DealStage.ACTIVE)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDashboardStats', () => {
    it('returns cached stats if present', async () => {
      const cached = { activeDeals: 5 };
      mockRedis.get.mockResolvedValue(cached);

      const result = await service.getDashboardStats('creator-1');
      expect(result).toEqual(cached);
      expect(mockPrisma.deal.findMany).not.toHaveBeenCalled();
    });

    it('computes and caches stats if not present in cache', async () => {
      mockRedis.get.mockResolvedValue(null);

      const mockDeals = [
        {
          stage: DealStage.ACTIVE,
          amount: 2000,
          startDate: new Date(), // current month
        },
        {
          stage: DealStage.COMPLETED,
          amount: 3000,
          startDate: new Date(), // current month
        },
      ];
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const mockContracts = [
        {
          riskFlags: [
            { isAcknowledged: false, severity: 'HIGH' },
            { isAcknowledged: true, severity: 'CRITICAL' },
          ],
        },
      ];
      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const mockInvoices = [
        {
          status: 'OVERDUE',
        },
      ];
      mockPrisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const mockPerformanceLogs = [
        {
          metrics: { cpv: 0.1 },
        },
        {
          metrics: { cpv: 0.2 },
        },
      ];
      mockPrisma.performanceLog.findMany.mockResolvedValue(mockPerformanceLogs);

      const result = await service.getDashboardStats('creator-1');

      expect(result.activeDeals).toBe(1);
      expect(result.monthlyContractedValue).toBe(5000);
      expect(result.flaggedClauseCount).toBe(1);
      expect(result.overdueInvoices).toBe(1);
      expect(result.avgCpv).toBeCloseTo(0.15, 5);
      expect(result.stageBreakdown.ACTIVE).toBe(1);
      expect(result.stageBreakdown.COMPLETED).toBe(1);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'creator:dashboard:stats:creator-1',
        expect.any(Object),
        3600,
      );
    });
  });
});
