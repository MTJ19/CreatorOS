import { RateIntelligenceResultSchema } from '@creator-os/shared';
import { Injectable, Logger } from '@nestjs/common';

import { GeminiService } from '../gemini/gemini.service';
import { PrismaService } from '../prisma/prisma.service';

import type { CreateRateIntelligenceDto } from './rate-intelligence.dto';
import type { SocialPlatform, ContentFormat, Prisma } from '@prisma/client';

@Injectable()
export class RateIntelligenceService {
  private readonly logger = new Logger(RateIntelligenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  // ── Quote Generation ─────────────────────────────────────────

  async generateQuote(userId: string, dto: CreateRateIntelligenceDto) {
    // 1. Load creator profile for context
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });

    // 2. Find comparable deals (up to 10)
    const comparables = await this.findComparables(dto);

    // 3. Build prompt and call Gemini
    const prompt = this.buildPrompt(dto, profile, comparables);
    const result = await this.gemini.generateStructured(prompt, RateIntelligenceResultSchema, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    // 4. Persist request + result
    const request = await this.prisma.rateIntelligenceRequest.create({
      data: {
        userId,
        input: dto as unknown as Prisma.InputJsonValue,
        result: result as unknown as Prisma.InputJsonValue,
      },
    });

    const currency = profile?.currency ?? 'USD';
    return {
      requestId: request.id,
      input: dto,
      result,
      currency,
      createdAt: request.createdAt.toISOString(),
    };
  }

  // ── History ──────────────────────────────────────────────────

  async getHistory(userId: string, limit = 10) {
    return this.prisma.rateIntelligenceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── Private Helpers ──────────────────────────────────────────

  private async findComparables(dto: CreateRateIntelligenceDto) {
    try {
      return this.prisma.comparableDeal.findMany({
        where: {
          contentFormat: dto.contentFormat as ContentFormat,
          brandTier: dto.brandTier,
          dealType: dto.dealType,
        },
        orderBy: { baseRate: 'asc' },
        take: 10,
      });
    } catch {
      return [];
    }
  }

  private buildPrompt(
    dto: CreateRateIntelligenceDto,
    profile: Awaited<ReturnType<typeof this.prisma.creatorProfile.findUnique>>,
    comparables: Awaited<ReturnType<typeof this.prisma.comparableDeal.findMany>>,
  ): string {
    const followerRange = this.followerBucket(profile?.totalFollowers ?? 0);
    const niches = (profile?.niche ?? []).join(', ') || 'general';
    const platform = (profile?.primaryPlatform as SocialPlatform | null) ?? 'not specified';
    const engagementRate = profile?.avgEngagementRate
      ? `${profile.avgEngagementRate.toFixed(2)}%`
      : 'unknown';
    const avgViews = profile?.avgViews ? profile.avgViews.toLocaleString() : 'unknown';

    const comparablesSummary =
      comparables.length > 0
        ? comparables
            .slice(0, 8)
            .map(
              (c) =>
                `- ${c.followerRange} ${c.niche} creator, ${c.platform}, ${c.dealType}: $${Number(c.baseRate).toFixed(0)} ${c.currency}`,
            )
            .join('\n')
        : 'No direct comparables found in database — use general market knowledge.';

    const usageRightsStr = dto.usageRights.join(', ');
    const rushText = dto.isRush
      ? 'YES — rush premium should be applied (typically 25–50% uplift)'
      : 'No';
    const exclusivityText =
      dto.exclusivityDays > 0
        ? `${dto.exclusivityDays} days (exclusivity premium should be applied)`
        : 'None';

    return `You are a senior brand deal rate advisor for digital creators. Provide a professional rate recommendation.

CREATOR PROFILE:
- Platform: ${platform}
- Follower range: ${followerRange}
- Niche(s): ${niches}
- Avg engagement rate: ${engagementRate}
- Avg views per post: ${avgViews}

DEAL REQUEST:
- Content format: ${dto.contentFormat.replace(/_/g, ' ')}
- Deal type: ${dto.dealType.replace(/_/g, ' ')}
- Brand tier: ${dto.brandTier}
- Brand category: ${dto.brandCategory}
- Usage rights requested: ${usageRightsStr}
- Exclusivity: ${exclusivityText}
- Rush delivery: ${rushText}
- Revision rounds included: ${dto.revisionRounds}

MARKET COMPARABLES (anonymised peer data):
${comparablesSummary}

INSTRUCTIONS:
Analyze the creator's profile, deal parameters, and market data.
Return a JSON object with EXACTLY this structure (no extra keys, no markdown):
{
  "recommendedMin": <number - minimum recommended rate in USD>,
  "recommendedMax": <number - maximum recommended rate in USD>,
  "rationale": "<2-3 sentence explanation of the rate range>",
  "peerComparison": {
    "label": "<brief label e.g. 'Mid-tier creators in your niche'>",
    "percentile": <number 0-100 - where creator falls vs peers>,
    "insight": "<1-2 sentence insight about peer positioning>"
  },
  "brandComparison": {
    "label": "<brand tier label>",
    "averageRate": <number - typical rate brands at this tier pay>,
    "insight": "<1-2 sentence insight about brand budget vs your rate>"
  },
  "counterofferEmail": "<professional email the creator can send to the brand, max 200 words, include [BRAND NAME] placeholder>",
  "negotiationPoints": ["<point 1>", "<point 2>", "<point 3>", "<optional point 4>", "<optional point 5>"]
}`;
  }

  private followerBucket(followers: number): string {
    if (followers < 1_000) return '< 1K';
    if (followers < 10_000) return '1K–10K';
    if (followers < 50_000) return '10K–50K';
    if (followers < 200_000) return '50K–200K';
    if (followers < 1_000_000) return '200K–1M';
    return '1M+';
  }
}
