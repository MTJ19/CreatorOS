import { BriefParsedDataSchema } from '@creator-os/shared';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DealStage, Prisma } from '@prisma/client';

import { AuditLogService } from '../audit-log/audit-log.service';
import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { extractTextFromFile } from '../storage/text-extractor';

import { CreateDealDto, UpdateDealDto } from './deals.dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLog: AuditLogService,
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
  ) {}

  // ─── CRUD Operations ──────────────────────────────────────────

  async findAll(creatorId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { creatorId },
      include: {
        deliverables: true,
        contract: { include: { riskFlags: true } },
        invoices: true,
        performanceLogs: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return deals.map(d => this.enrichDealComputedFields(d));
  }

  async findOne(id: string, creatorId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        deliverables: true,
        contract: { include: { riskFlags: true } },
        invoices: true,
        performanceLogs: true,
      },
    });

    if (!deal || deal.creatorId !== creatorId) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    return this.enrichDealComputedFields(deal);
  }

  async create(creatorId: string, dto: CreateDealDto) {
    // 1. Create Deal and Deliverables nested
    const deal = await this.prisma.deal.create({
      data: {
        creatorId,
        brandName: dto.brandName,
        brandEmail: dto.brandEmail || null,
        brandWebsite: dto.brandWebsite || null,
        brandInstagram: dto.brandInstagram || null,
        dealSource: dto.dealSource || null,
        title: dto.title,
        description: dto.description || null,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency || 'USD',
        status: (dto.status as any) || 'DRAFT',
        stage: (dto.stage as DealStage) || DealStage.NEW_INQUIRY,
        quotedAmount: dto.quotedAmount ? new Prisma.Decimal(dto.quotedAmount) : null,
        offeredAmount: dto.offeredAmount ? new Prisma.Decimal(dto.offeredAmount) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        followUpReminder: dto.followUpReminder ? new Date(dto.followUpReminder) : null,
        exclusivityDays: dto.exclusivityDays || null,
        exclusivityNotes: dto.exclusivityNotes || null,
        usageRights: dto.usageRights || null,
        notes: dto.notes || null,
        tags: dto.tags || [],
        deliverables: {
          create: (dto.deliverables || []).map((del) => ({
            type: del.type as any,
            status: (del.status as any) || 'PENDING',
            description: del.description || null,
            dueDate: new Date(del.dueDate),
            notes: del.notes || null,
            platform: del.platform || null,
            contentUrl: del.contentUrl || null,
          })),
        },
      },
      include: {
        deliverables: true,
      },
    });

    // 2. Invalidate Cache
    await this.invalidateDashboardCache(creatorId);

    return deal;
  }

  async update(id: string, creatorId: string, dto: UpdateDealDto) {
    const existing = await this.findOne(id, creatorId);

    // If stage is changing, validate transition & audit log
    if (dto.stage && dto.stage !== existing.stage) {
      this.validateStageTransition(existing.stage as DealStage, dto.stage as DealStage);
      await this.auditLog.log({
        userId: creatorId,
        action: 'deal.stage_change',
        resource: 'Deal',
        resourceId: id,
        metadata: { from: existing.stage, to: dto.stage },
      });
    }

    const data: any = {
      brandName: dto.brandName,
      brandEmail: dto.brandEmail,
      brandWebsite: dto.brandWebsite,
      brandInstagram: dto.brandInstagram,
      dealSource: dto.dealSource,
      title: dto.title,
      description: dto.description,
      amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
      currency: dto.currency,
      status: dto.status,
      stage: dto.stage,
      quotedAmount: dto.quotedAmount !== undefined ? (dto.quotedAmount ? new Prisma.Decimal(dto.quotedAmount) : null) : undefined,
      offeredAmount: dto.offeredAmount !== undefined ? (dto.offeredAmount ? new Prisma.Decimal(dto.offeredAmount) : null) : undefined,
      startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
      endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
      deadline: dto.deadline !== undefined ? (dto.deadline ? new Date(dto.deadline) : null) : undefined,
      followUpReminder: dto.followUpReminder !== undefined ? (dto.followUpReminder ? new Date(dto.followUpReminder) : null) : undefined,
      exclusivityDays: dto.exclusivityDays,
      exclusivityNotes: dto.exclusivityNotes,
      usageRights: dto.usageRights,
      notes: dto.notes,
      tags: dto.tags,
    };

    Object.keys(data).forEach((key) => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });


    const updated = await this.prisma.deal.update({
      where: { id },
      data,
      include: {
        deliverables: true,
        contract: { include: { riskFlags: true } },
        invoices: true,
        performanceLogs: true,
      },
    });

    // Invalidate Cache
    await this.invalidateDashboardCache(creatorId);

    return this.enrichDealComputedFields(updated);
  }

  async updateStage(id: string, creatorId: string, stage: DealStage) {
    const existing = await this.findOne(id, creatorId);

    this.validateStageTransition(existing.stage as DealStage, stage);

    const updated = await this.prisma.deal.update({
      where: { id },
      data: { stage },
      include: {
        deliverables: true,
        contract: { include: { riskFlags: true } },
        invoices: true,
        performanceLogs: true,
      },
    });

    await this.auditLog.log({
      userId: creatorId,
      action: 'deal.stage_change',
      resource: 'Deal',
      resourceId: id,
      metadata: { from: existing.stage, to: stage },
    });

    // Invalidate Cache
    await this.invalidateDashboardCache(creatorId);

    return this.enrichDealComputedFields(updated);
  }

  async remove(id: string, creatorId: string) {
    await this.findOne(id, creatorId);
    const deleted = await this.prisma.deal.delete({
      where: { id },
    });

    // Invalidate Cache
    await this.invalidateDashboardCache(creatorId);

    return deleted;
  }

  // ─── Dashboard Stats ──────────────────────────────────────────

  async getDashboardStats(creatorId: string) {
    const cacheKey = `creator:dashboard:stats:${creatorId}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    // 1. Fetch all deals for stats calculations
    const deals = await this.prisma.deal.findMany({
      where: { creatorId },
      include: {
        contract: { include: { riskFlags: true } },
        invoices: true,
        performanceLogs: true,
      },
    });

    // Active Deals count
    const activeDeals = deals.filter(d => d.stage === DealStage.ACTIVE).length;

    // Monthly Contracted Value (Sum of ACTIVE/COMPLETED deal amounts starting in the current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyContractedValue = deals
      .filter(d => 
        (d.stage === DealStage.ACTIVE || d.stage === DealStage.COMPLETED) &&
        d.startDate && d.startDate >= startOfMonth
      )
      .reduce((sum, d) => sum + Number(d.amount), 0);

    // Flagged Clauses (unacknowledged HIGH/CRITICAL flags in contracts)
    const contracts = await this.prisma.contract.findMany({
      where: { creatorId },
      include: { riskFlags: true },
    });
    const flaggedClauseCount = contracts.reduce((sum, c) => {
      const activeFlags = c.riskFlags.filter(
        f => !f.isAcknowledged && (f.severity === 'HIGH' || f.severity === 'CRITICAL')
      ).length;
      return sum + activeFlags;
    }, 0);

    // Overdue Invoices
    const invoices = await this.prisma.invoice.findMany({
      where: { creatorId },
    });
    const overdueInvoices = invoices.filter(
      i => i.status === 'OVERDUE' || 
      ((i.status === 'SENT' || i.status === 'VIEWED') && i.dueDate && i.dueDate < now)
    ).length;

    // Avg CPV across all creator performance logs
    const performanceLogs = await this.prisma.performanceLog.findMany({
      where: { creatorId },
    });
    let cpvSum = 0;
    let cpvCount = 0;
    for (const log of performanceLogs) {
      const metrics = log.metrics as Record<string, any>;
      if (metrics && metrics.cpv !== null && metrics.cpv !== undefined) {
        cpvSum += metrics.cpv;
        cpvCount++;
      }
    }
    const avgCpv = cpvCount > 0 ? cpvSum / cpvCount : null;

    // Stage breakdown for Kanban CRM
    const stageBreakdown = Object.keys(DealStage).reduce((acc, key) => {
      acc[key] = deals.filter(d => d.stage === key).length;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      activeDeals,
      monthlyContractedValue,
      flaggedClauseCount,
      overdueInvoices,
      avgCpv,
      stageBreakdown,
    };

    // Cache in Redis for 1 hour (3600 seconds)
    await this.redis.set(cacheKey, stats, 3600);

    return stats;
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private validateStageTransition(from: DealStage, to: DealStage) {
    if (from === to) return;

    const allowed: Record<DealStage, DealStage[]> = {
      NEW_INQUIRY: ['QUALIFIED', 'LOST'],
      QUALIFIED: ['PITCH_SENT', 'NEGOTIATING', 'LOST'],
      PITCH_SENT: ['NEGOTIATING', 'LOST'],
      NEGOTIATING: ['CONTRACT_SENT', 'LOST'],
      CONTRACT_SENT: ['ACTIVE', 'NEGOTIATING', 'LOST'],
      ACTIVE: ['COMPLETED', 'LOST'],
      COMPLETED: ['NEGOTIATING'],
      LOST: ['NEW_INQUIRY', 'QUALIFIED'],
    };

    if (!allowed[from]?.includes(to)) {
      throw new BadRequestException(`Invalid stage transition from ${from} to ${to}`);
    }
  }

  private async invalidateDashboardCache(creatorId: string) {
    const cacheKey = `creator:dashboard:stats:${creatorId}`;
    await this.redis.del(cacheKey);
  }

  private enrichDealComputedFields(deal: any) {
    const logs = deal.performanceLogs || [];
    let views = 0;
    let likes = 0;
    let comments = 0;
    let saves = 0;
    let shares = 0;
    let cpvSum = 0;
    let cpvCount = 0;

    for (const log of logs) {
      const metrics = log.metrics as Record<string, any>;
      if (metrics) {
        views += metrics.views || 0;
        likes += metrics.likes || 0;
        comments += metrics.comments || 0;
        saves += metrics.saves || 0;
        shares += metrics.shares || 0;
        if (metrics.cpv !== null && metrics.cpv !== undefined) {
          cpvSum += metrics.cpv;
          cpvCount++;
        }
      }
    }

    const engagementRate = views > 0 ? ((likes + comments + saves + shares) / views) * 100 : 0;
    const avgCpv = cpvCount > 0 ? cpvSum / cpvCount : null;

    let performanceRating: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE' = 'NONE';
    if (logs.length > 0) {
      if (engagementRate >= 4.0 || (avgCpv !== null && avgCpv <= 0.05)) {
        performanceRating = 'HIGH';
      } else if (engagementRate >= 1.5 || (avgCpv !== null && avgCpv <= 0.15)) {
        performanceRating = 'MEDIUM';
      } else {
        performanceRating = 'LOW';
      }
    }

    return {
      ...deal,
      computed: {
        views,
        engagementRate,
        avgCpv,
        performanceRating,
      },
    };
  }

  // ─── Brief Intake & Reconciliation ────────────────────────────

  async getBrief(dealId: string, creatorId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { deliverables: true },
    });

    if (!deal || deal.creatorId !== creatorId) {
      throw new NotFoundException(`Deal with ID "${dealId}" not found`);
    }

    const brief = await this.prisma.brief.findUnique({
      where: { dealId },
    });

    if (!brief) {
      return {
        brief: null,
        reconciliation: {
          isMatched: true,
          warnings: [],
        },
      };
    }

    const parsedData = brief.parsedData as { deliverables?: any[] } | null;
    const reconciliation = this.reconcileDeliverables(
      deal.deliverables,
      parsedData?.deliverables || [],
    );

    return {
      brief,
      reconciliation,
    };
  }

  async uploadBrief(
    dealId: string,
    creatorId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { deliverables: true },
    });

    if (!deal || deal.creatorId !== creatorId) {
      throw new NotFoundException(`Deal with ID "${dealId}" not found`);
    }

    // 1. Upload to storage (briefs folder)
    const uploadResult = await this.storage.uploadFile(file, `briefs/${dealId}`);

    // 2. Extract text from the uploaded brief
    const briefText = await extractTextFromFile(file.buffer, file.mimetype);

    // 3. Prompt Gemini to parse campaign brief into structured JSON
    const prompt = `
You are an expert campaign brief parser for content creators.
Your task is to analyze the following campaign brief text and extract a structured, JSON-formatted object matching the schema.

Strictly adhere to the following definitions:
1. Deliverables: Extract the content pieces requested by the brand.
   Each deliverable object must contain:
   - type: The format/type of the content (e.g., "Tiktok Video", "Instagram Reel", "YouTube Video", "Blog Post", "Instagram Story", "Tweet").
   - quantity: The number of posts required (must be an integer, defaults to 1).
   - platform: The social media platform name (e.g., "TikTok", "Instagram", "YouTube", "Twitter", "Pinterest").
   - description: Any specific requirements or hooks mentioned for this deliverable.
2. Deadlines: Extract dates for drafts, revisions, final submissions, and posting dates.
   Each deadline object must contain:
   - event: A short name for the deadline milestone (e.g., "Draft Submission", "Live Post").
   - date: A string representing the date or timeline description (e.g., "2026-07-01", "7 days after approval").
3. Do's: A list of items/rules the creator MUST do, show, or mention (e.g. tag @brand, use hashtag #sponsored, show product packaging clearly).
4. Don'ts: A list of items/rules the creator MUST NOT do (e.g. mention competitors, use copyrighted music, show competitor logos, use bad lighting).
5. FTC Compliance Flags: Look for any clauses regarding disclosure (e.g., FTC, ASA). If they specify missing disclosures, hidden hashtags, or require bad practices (like hiding the #ad hashtag at the bottom of the description), flag them.
   Each FTC flag object must contain:
   - rule: The FTC rule or policy in question (e.g., "Clear Disclosure", "No competitor comparisons").
   - warning: A description of the violation or warning details.

Here is the campaign brief text to parse:
---
${briefText}
---

Provide only the JSON output conforming to the required schema. Do not write any preamble or code blocks.
`;

    const parsedData = await this.gemini.generateStructured(prompt, BriefParsedDataSchema);

    // 4. Upsert Brief in DB
    const brief = await this.prisma.brief.upsert({
      where: { dealId },
      update: {
        fileUrl: uploadResult.fileUrl,
        fileKey: uploadResult.fileKey,
        parsedData: parsedData as any,
      },
      create: {
        dealId,
        fileUrl: uploadResult.fileUrl,
        fileKey: uploadResult.fileKey,
        parsedData: parsedData as any,
      },
    });

    const reconciliation = this.reconcileDeliverables(
      deal.deliverables,
      parsedData?.deliverables || [],
    );

    return {
      brief,
      reconciliation,
    };
  }

  async updateBriefParsedData(dealId: string, creatorId: string, parsedData: any) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { deliverables: true },
    });

    if (!deal || deal.creatorId !== creatorId) {
      throw new NotFoundException(`Deal with ID "${dealId}" not found`);
    }

    // Validate parsedData structure
    const validation = BriefParsedDataSchema.safeParse(parsedData);
    if (!validation.success) {
      throw new BadRequestException(`Invalid brief data format: ${validation.error.message}`);
    }

    const brief = await this.prisma.brief.update({
      where: { dealId },
      data: {
        parsedData: validation.data as any,
      },
    });

    const reconciliation = this.reconcileDeliverables(
      deal.deliverables,
      validation.data?.deliverables || [],
    );

    return {
      brief,
      reconciliation,
    };
  }

  private reconcileDeliverables(dealDeliverables: any[], briefParsedDeliverables: any[]) {
    const warnings: string[] = [];

    // Group deal deliverables by type + platform
    const dealCounts: Record<string, number> = {};
    for (const del of dealDeliverables) {
      const key = `${(del.platform || 'unknown').toLowerCase()}:${(del.type || 'unknown').toLowerCase()}`;
      dealCounts[key] = (dealCounts[key] || 0) + 1;
    }

    // Group brief deliverables by type + platform
    const briefCounts: Record<string, number> = {};
    for (const del of briefParsedDeliverables || []) {
      const key = `${(del.platform || 'unknown').toLowerCase()}:${(del.type || 'unknown').toLowerCase()}`;
      briefCounts[key] = (briefCounts[key] || 0) + (del.quantity || 1);
    }

    // Compare
    for (const key of Object.keys(briefCounts)) {
      const briefQty = briefCounts[key] ?? 0;
      const dealQty = dealCounts[key] || 0;

      if (dealQty === 0) {
        const [platform, type] = key.split(':');
        warnings.push(
          `The brief requests ${briefQty}x ${platform} ${type}(s), but this is not included in the original deal deliverables.`,
        );
      } else if (briefQty > dealQty) {
        const [platform, type] = key.split(':');
        warnings.push(
          `The brief requests ${briefQty}x ${platform} ${type}(s), but the deal only includes ${dealQty}x.`,
        );
      }
    }

    return {
      isMatched: warnings.length === 0,
      warnings,
    };
  }
}
