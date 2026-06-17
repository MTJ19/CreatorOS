import { type ExecutionContext } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RateIntelligenceController } from './rate-intelligence.controller';
import { RateIntelligenceService } from './rate-intelligence.service';

const mockRateService = {
  generateQuote: jest.fn(),
  getHistory: jest.fn(),
};

describe('RateIntelligenceController', () => {
  let controller: RateIntelligenceController;

  beforeEach(async () => {
    const mockGuard = {
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { sub: 'creator-1', email: 'creator@example.com', role: 'CREATOR' };
        return true;
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateIntelligenceController],
      providers: [{ provide: RateIntelligenceService, useValue: mockRateService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<RateIntelligenceController>(RateIntelligenceController);
    jest.clearAllMocks();
  });

  describe('generateQuote', () => {
    it('calls generateQuote service method with inputs and user ID', async () => {
      const dto = {
        contentFormat: 'SHORT_FORM_VIDEO' as any,
        dealType: 'SPONSORED_POST' as any,
        usageRights: ['ORGANIC_ONLY'] as any,
        exclusivityDays: 30,
        isRush: true,
        revisionRounds: 2,
        brandTier: 'MID' as const,
        brandCategory: 'Tech',
        followers: 10000,
      };

      const mockResponse = {
        requestId: 'req-123',
        input: dto,
        result: {
          recommendedMin: 1000,
          recommendedMax: 1500,
          rationale: 'Solid profile niche and engagement justifies premium pricing.',
          peerComparison: { label: 'Mid tier', percentile: 75, insight: 'Strong niche alignment' },
          brandComparison: {
            label: 'Mid tier brand',
            averageRate: 1200,
            insight: 'Standard rate fits tier',
          },
          counterofferEmail: 'Dear brand, please find...',
          negotiationPoints: ['Point 1', 'Point 2', 'Point 3'],
        },
        currency: 'USD',
        createdAt: '2026-06-15T13:38:06.000Z',
      };

      mockRateService.generateQuote.mockResolvedValue(mockResponse);

      const user = { sub: 'creator-1', email: 'creator@example.com', role: 'CREATOR' };
      const result = await controller.generateQuote(user, dto);

      expect(mockRateService.generateQuote).toHaveBeenCalledWith('creator-1', dto);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getHistory', () => {
    it('calls getHistory service method with limit', async () => {
      mockRateService.getHistory.mockResolvedValue([]);

      const user = { sub: 'creator-1', email: 'creator@example.com', role: 'CREATOR' };
      await controller.getHistory(user, { limit: 15 });

      expect(mockRateService.getHistory).toHaveBeenCalledWith('creator-1', 15);
    });
  });
});
