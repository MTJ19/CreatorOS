import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';

import { PerformanceService } from './performance.service';


const mockPrisma = {
  performanceLog: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  deal: {
    findUnique: jest.fn(),
  },
};

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('calculates engagement rate and CPV correctly for a paid post', async () => {
      const creatorId = 'c1';
      const dealId = 'd1';
      const dto = {
        platform: 'INSTAGRAM',
        contentFormat: 'SHORT_FORM_VIDEO',
        recordedAt: '2026-06-15T00:00:00.000Z',
        views: 10000,
        likes: 400,
        comments: 100,
        saves: 50,
        shares: 50,
        isPaid: true,
        dealId,
        brandCategory: 'Tech',
      };

      mockPrisma.deal.findUnique.mockResolvedValue({
        id: dealId,
        creatorId,
        amount: 500.00, // $500 deal
      });

      mockPrisma.performanceLog.create.mockImplementation(({ data }) => data);

      const result = await service.create(creatorId, dto);

      // engagementRate = ((400 + 100 + 50 + 50) / 10000) * 100 = 6%
      // cpv = 500 / 10000 = 0.05
      const metrics = result.metrics;
      expect(metrics.engagementRate).toBe(6);
      expect(metrics.cpv).toBe(0.05);
      expect(metrics.isPaid).toBe(true);
      expect(metrics.brandCategory).toBe('Tech');
    });

    it('calculates engagement rate and sets CPV to null for organic post', async () => {
      const creatorId = 'c1';
      const dto = {
        platform: 'INSTAGRAM',
        contentFormat: 'SHORT_FORM_VIDEO',
        recordedAt: '2026-06-15T00:00:00.000Z',
        views: 5000,
        likes: 150,
        comments: 50,
        saves: 25,
        shares: 25,
        isPaid: false,
      };

      mockPrisma.performanceLog.create.mockImplementation(({ data }) => data);

      const result = await service.create(creatorId, dto);

      // engagementRate = ((150 + 50 + 25 + 25) / 5000) * 100 = 5%
      // cpv = null (organic)
      const metrics = result.metrics;
      expect(metrics.engagementRate).toBe(5);
      expect(metrics.cpv).toBeNull();
      expect(metrics.isPaid).toBe(false);
    });

    it('throws BadRequestException if paid post has no dealId', async () => {
      const creatorId = 'c1';
      const dto = {
        platform: 'INSTAGRAM',
        contentFormat: 'SHORT_FORM_VIDEO',
        recordedAt: '2026-06-15T00:00:00.000Z',
        views: 5000,
        likes: 150,
        comments: 50,
        isPaid: true, // paid, but dealId missing
      };

      await expect(service.create(creatorId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRollingAverages', () => {
    it('computes rolling averages across all time periods', async () => {
      const creatorId = 'c1';
      const mockLogs = [
        {
          recordedAt: new Date(),
          metrics: { views: 1000, engagementRate: 5.0, cpv: 0.1 },
        },
        {
          recordedAt: new Date(),
          metrics: { views: 2000, engagementRate: 3.0, cpv: 0.2 },
        },
      ];

      mockPrisma.performanceLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRollingAverages(creatorId);

      expect(result.rolling30.avgViews).toBe(1500);
      expect(result.rolling30.avgEngagementRate).toBe(4.0);
      expect(result.rolling30.avgCpv).toBeCloseTo(0.15, 5);
      expect(result.rolling30.totalPosts).toBe(2);
    });
  });
});
