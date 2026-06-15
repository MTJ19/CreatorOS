import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePerformanceLogDto, UpdatePerformanceLogDto } from './performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD Operations ──────────────────────────────────────────

  async findAll(creatorId: string) {
    return this.prisma.performanceLog.findMany({
      where: { creatorId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async findOne(id: string, creatorId: string) {
    const log = await this.prisma.performanceLog.findUnique({
      where: { id },
    });
    if (!log || log.creatorId !== creatorId) {
      throw new NotFoundException(`Performance log with ID "${id}" not found`);
    }
    return log;
  }

  async findByDeal(dealId: string) {
    return this.prisma.performanceLog.findMany({
      where: { dealId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async create(creatorId: string, dto: CreatePerformanceLogDto) {
    // 1. If paid, validate and look up deal to fetch amount for CPV calculation
    let cpv: number | null = null;
    if (dto.isPaid) {
      if (!dto.dealId) {
        throw new BadRequestException('Deal ID is required for paid posts');
      }
      const deal = await this.prisma.deal.findUnique({
        where: { id: dto.dealId },
      });
      if (!deal || deal.creatorId !== creatorId) {
        throw new NotFoundException(`Deal with ID "${dto.dealId}" not found`);
      }
      if (dto.views > 0) {
        cpv = Number(deal.amount) / dto.views;
      }
    }

    // 2. Calculate engagement rate
    const totalEngagements =
      dto.views > 0 ? dto.likes + dto.comments + (dto.saves ?? 0) + (dto.shares ?? 0) : 0;
    const engagementRate = dto.views > 0 ? (totalEngagements / dto.views) * 100 : 0;

    // 3. Assemble metrics JSON
    const metrics: Record<string, any> = {
      views: dto.views,
      likes: dto.likes,
      comments: dto.comments,
      saves: dto.saves ?? 0,
      shares: dto.shares ?? 0,
      watchTimePercent: dto.watchTimePercent ?? null,
      isPaid: dto.isPaid ?? false,
      brandCategory: dto.brandCategory ?? null,
      contentFormat: dto.contentFormat ?? null,
      engagementRate,
      cpv,
    };

    // 4. Create database record
    return this.prisma.performanceLog.create({
      data: {
        creatorId,
        dealId: dto.dealId || null,
        deliverableId: dto.deliverableId || null,
        platform: dto.platform,
        recordedAt: new Date(dto.recordedAt),
        contentUrl: dto.contentUrl || null,
        notes: dto.notes || null,
        metrics: metrics as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: string, creatorId: string, dto: UpdatePerformanceLogDto) {
    // 1. Load existing log
    const existing = await this.findOne(id, creatorId);
    const existingMetrics = existing.metrics as Record<string, any>;

    // 2. Merge existing data with updates
    const isPaid = dto.isPaid !== undefined ? dto.isPaid : existingMetrics.isPaid;
    const dealId = dto.dealId !== undefined ? dto.dealId : existing.dealId;
    const views = dto.views !== undefined ? dto.views : existingMetrics.views;
    const likes = dto.likes !== undefined ? dto.likes : existingMetrics.likes;
    const comments = dto.comments !== undefined ? dto.comments : existingMetrics.comments;
    const saves = dto.saves !== undefined ? dto.saves : existingMetrics.saves;
    const shares = dto.shares !== undefined ? dto.shares : existingMetrics.shares;
    const watchTimePercent =
      dto.watchTimePercent !== undefined ? dto.watchTimePercent : existingMetrics.watchTimePercent;
    const brandCategory =
      dto.brandCategory !== undefined ? dto.brandCategory : existingMetrics.brandCategory;
    const contentFormat =
      dto.contentFormat !== undefined ? dto.contentFormat : existingMetrics.contentFormat;

    // 3. Calculate updated metrics
    let cpv: number | null = null;
    if (isPaid) {
      if (!dealId) {
        throw new BadRequestException('Deal ID is required for paid posts');
      }
      const deal = await this.prisma.deal.findUnique({
        where: { id: dealId },
      });
      if (!deal || deal.creatorId !== creatorId) {
        throw new NotFoundException(`Deal with ID "${dealId}" not found`);
      }
      if (views > 0) {
        cpv = Number(deal.amount) / views;
      }
    }

    const totalEngagements = views > 0 ? likes + comments + (saves ?? 0) + (shares ?? 0) : 0;
    const engagementRate = views > 0 ? (totalEngagements / views) * 100 : 0;

    const metrics: Record<string, any> = {
      views,
      likes,
      comments,
      saves: saves ?? 0,
      shares: shares ?? 0,
      watchTimePercent: watchTimePercent ?? null,
      isPaid,
      brandCategory: brandCategory ?? null,
      contentFormat: contentFormat ?? null,
      engagementRate,
      cpv,
    };

    // 4. Perform database update
    return this.prisma.performanceLog.update({
      where: { id },
      data: {
        dealId: dealId || null,
        deliverableId: dto.deliverableId !== undefined ? dto.deliverableId : existing.deliverableId,
        platform: dto.platform !== undefined ? dto.platform : existing.platform,
        recordedAt: dto.recordedAt !== undefined ? new Date(dto.recordedAt) : existing.recordedAt,
        contentUrl: dto.contentUrl !== undefined ? dto.contentUrl : existing.contentUrl,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        metrics: metrics as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async remove(id: string, creatorId: string) {
    await this.findOne(id, creatorId);
    return this.prisma.performanceLog.delete({
      where: { id },
    });
  }

  // ─── Rolling Averages ─────────────────────────────────────────

  async getRollingAverages(creatorId: string) {
    const now = new Date();

    const calculateForDays = async (days: number) => {
      const gteDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const logs = await this.prisma.performanceLog.findMany({
        where: {
          creatorId,
          recordedAt: { gte: gteDate },
        },
      });

      const totalPosts = logs.length;
      if (totalPosts === 0) {
        return {
          days,
          avgViews: 0,
          avgEngagementRate: 0,
          avgCpv: null,
          totalPosts: 0,
        };
      }

      let sumViews = 0;
      let sumEngagementRate = 0;
      let sumCpv = 0;
      let cpvCount = 0;

      for (const log of logs) {
        const metrics = log.metrics as Record<string, any>;
        sumViews += metrics.views ?? 0;
        sumEngagementRate += metrics.engagementRate ?? 0;
        if (metrics.cpv !== null && metrics.cpv !== undefined) {
          sumCpv += metrics.cpv;
          cpvCount++;
        }
      }

      return {
        days,
        avgViews: sumViews / totalPosts,
        avgEngagementRate: sumEngagementRate / totalPosts,
        avgCpv: cpvCount > 0 ? sumCpv / cpvCount : null,
        totalPosts,
      };
    };

    const [avg30, avg60, avg90] = await Promise.all([
      calculateForDays(30),
      calculateForDays(60),
      calculateForDays(90),
    ]);

    return {
      rolling30: avg30,
      rolling60: avg60,
      rolling90: avg90,
    };
  }
}
