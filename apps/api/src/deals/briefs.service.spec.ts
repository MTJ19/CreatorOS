import { Test, type TestingModule } from '@nestjs/testing';

import { AuditLogService } from '../audit-log/audit-log.service';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';

import { DealsService } from './deals.service';

const mockPrisma = {
  deal: {
    findUnique: jest.fn(),
  },
  brief: {
    findUnique: jest.fn(),
  },
};

const mockStorage = {};
const mockGemini = {};
const mockRedis = {};
const mockAuditLog = {};

describe('DealsService - Brief Reconciliation', () => {
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

  it('matches scope when brief deliverables match deal deliverables exactly', async () => {
    const mockDeal = {
      id: 'deal-1',
      creatorId: 'creator-1',
      deliverables: [
        { platform: 'Instagram', type: 'INSTAGRAM_REEL' },
        { platform: 'TikTok', type: 'TIKTOK_VIDEO' },
      ],
    };
    const mockBrief = {
      id: 'brief-1',
      dealId: 'deal-1',
      parsedData: {
        deliverables: [
          { platform: 'Instagram', type: 'INSTAGRAM_REEL', quantity: 1 },
          { platform: 'TikTok', type: 'TIKTOK_VIDEO', quantity: 1 },
        ],
      },
    };

    mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
    mockPrisma.brief.findUnique.mockResolvedValue(mockBrief);

    const result = await service.getBrief('deal-1', 'creator-1');
    expect(result.reconciliation.isMatched).toBe(true);
    expect(result.reconciliation.warnings).toHaveLength(0);
  });

  it('flags warning when brief requests more deliverables of a type than defined in deal', async () => {
    const mockDeal = {
      id: 'deal-1',
      creatorId: 'creator-1',
      deliverables: [
        { platform: 'Instagram', type: 'INSTAGRAM_REEL' },
      ],
    };
    const mockBrief = {
      id: 'brief-1',
      dealId: 'deal-1',
      parsedData: {
        deliverables: [
          { platform: 'Instagram', type: 'INSTAGRAM_REEL', quantity: 2 },
        ],
      },
    };

    mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
    mockPrisma.brief.findUnique.mockResolvedValue(mockBrief);

    const result = await service.getBrief('deal-1', 'creator-1');
    expect(result.reconciliation.isMatched).toBe(false);
    expect(result.reconciliation.warnings).toHaveLength(1);
    expect(result.reconciliation.warnings[0]).toContain('requests 2x instagram instagram_reel(s), but the deal only includes 1x');
  });

  it('flags warning when brief requests a platform/type not present in deal deliverables', async () => {
    const mockDeal = {
      id: 'deal-1',
      creatorId: 'creator-1',
      deliverables: [
        { platform: 'Instagram', type: 'INSTAGRAM_REEL' },
      ],
    };
    const mockBrief = {
      id: 'brief-1',
      dealId: 'deal-1',
      parsedData: {
        deliverables: [
          { platform: 'Instagram', type: 'INSTAGRAM_REEL', quantity: 1 },
          { platform: 'YouTube', type: 'YOUTUBE_VIDEO', quantity: 1 },
        ],
      },
    };

    mockPrisma.deal.findUnique.mockResolvedValue(mockDeal);
    mockPrisma.brief.findUnique.mockResolvedValue(mockBrief);

    const result = await service.getBrief('deal-1', 'creator-1');
    expect(result.reconciliation.isMatched).toBe(false);
    expect(result.reconciliation.warnings).toHaveLength(1);
    expect(result.reconciliation.warnings[0]).toContain('requests 1x youtube youtube_video(s), but this is not included');
  });
});
