import { type ExecutionContext } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DealStage } from '@prisma/client';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

const mockDealsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStage: jest.fn(),
  remove: jest.fn(),
  getDashboardStats: jest.fn(),
};

describe('DealsController', () => {
  let controller: DealsController;

  beforeEach(async () => {
    const mockGuard = {
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = { sub: 'creator-1', email: 'creator@example.com', role: 'CREATOR' };
        return true;
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealsController],
      providers: [{ provide: DealsService, useValue: mockDealsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<DealsController>(DealsController);
    jest.clearAllMocks();
  });

  const mockUser = { sub: 'creator-1', email: 'creator@example.com', role: 'CREATOR' };

  describe('getDashboardStats', () => {
    it('should call getDashboardStats on service', async () => {
      mockDealsService.getDashboardStats.mockResolvedValue({ activeDeals: 3 });
      const result = await controller.getDashboardStats(mockUser);
      expect(mockDealsService.getDashboardStats).toHaveBeenCalledWith('creator-1');
      expect(result).toEqual({ activeDeals: 3 });
    });
  });

  describe('create', () => {
    it('should call create on service with user.sub and dto', async () => {
      const dto = { brandName: 'Brand X', title: 'Campaign Y', amount: 500 };
      mockDealsService.create.mockResolvedValue({ id: 'deal-1', ...dto });

      const result = await controller.create(mockUser, dto as any);
      expect(mockDealsService.create).toHaveBeenCalledWith('creator-1', dto);
      expect(result).toEqual({ id: 'deal-1', ...dto });
    });
  });

  describe('findAll', () => {
    it('should call findAll on service with user.sub', async () => {
      mockDealsService.findAll.mockResolvedValue([]);
      const result = await controller.findAll(mockUser);
      expect(mockDealsService.findAll).toHaveBeenCalledWith('creator-1');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should call findOne on service with id and user.sub', async () => {
      mockDealsService.findOne.mockResolvedValue({ id: 'deal-1' });
      const result = await controller.findOne('deal-1', mockUser);
      expect(mockDealsService.findOne).toHaveBeenCalledWith('deal-1', 'creator-1');
      expect(result).toEqual({ id: 'deal-1' });
    });
  });

  describe('update', () => {
    it('should call update on service with id, user.sub, and dto', async () => {
      const dto = { brandName: 'Brand Z' };
      mockDealsService.update.mockResolvedValue({ id: 'deal-1', brandName: 'Brand Z' });

      const result = await controller.update('deal-1', mockUser, dto as any);
      expect(mockDealsService.update).toHaveBeenCalledWith('deal-1', 'creator-1', dto);
      expect(result).toEqual({ id: 'deal-1', brandName: 'Brand Z' });
    });
  });

  describe('updateStage', () => {
    it('should call updateStage on service with id, user.sub, and stage', async () => {
      const dto = { stage: DealStage.QUALIFIED };
      mockDealsService.updateStage.mockResolvedValue({ id: 'deal-1', stage: DealStage.QUALIFIED });

      const result = await controller.updateStage('deal-1', mockUser, dto as any);
      expect(mockDealsService.updateStage).toHaveBeenCalledWith(
        'deal-1',
        'creator-1',
        DealStage.QUALIFIED,
      );
      expect(result).toEqual({ id: 'deal-1', stage: DealStage.QUALIFIED });
    });
  });

  describe('remove', () => {
    it('should call remove on service with id and user.sub', async () => {
      mockDealsService.remove.mockResolvedValue({ id: 'deal-1' });
      const result = await controller.remove('deal-1', mockUser);
      expect(mockDealsService.remove).toHaveBeenCalledWith('deal-1', 'creator-1');
      expect(result).toEqual({ id: 'deal-1' });
    });
  });
});
