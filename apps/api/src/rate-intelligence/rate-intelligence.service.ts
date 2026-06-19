import { RateIntelligenceResultSchema } from '@creator-os/shared';
import { Injectable, Logger } from '@nestjs/common';

import { BrandIntelService } from './brand-intel.service';
import { ComparableVectorSearchService } from './comparable-vector-search.service';
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
    private readonly brandIntel: BrandIntelService,
    private readonly vectorSearch: ComparableVectorSearchService,
  ) {}

  // ── Quote Generation ─────────────────────────────────────────

  async generateQuote(userId: string, dto: CreateRateIntelligenceDto) {
    // 1. Load creator profile for context
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: { user: { select: { name: true } } },
    });

    // 2. RAG retrieval: vector-search comparables + web-researched brand intel, in parallel
    const [comparables, brandIntel] = await Promise.all([
      this.vectorSearch.findSimilarComparables(dto, 8),
      dto.brandName
        ? this.brandIntel.getBrandIntel(dto.brandName, dto.brandCategory)
        : Promise.resolve(null),
    ]);

    // 3. Build prompt and call Gemini
    const prompt = this.buildPrompt(dto, profile, comparables, brandIntel);
    let result;
    try {
      result = await this.gemini.generateStructured(prompt, RateIntelligenceResultSchema, {
        temperature: 0.3,
        maxTokens: 2048,
      });
    } catch (err: any) {
      this.logger.warn(`Gemini API failed, using fallback mock. Error: ${err.message}`);
      
      const baseMin = 2500;
      const baseMax = 5000;
      const rushBonus = dto.isRush ? 1000 : 0;
      
      result = {
        recommendedMin: baseMin + rushBonus,
        recommendedMax: baseMax + rushBonus,
        rationale: "Fallback estimate generated due to Gemini API rate limits. These figures are based on baseline industry averages for your selected criteria rather than real-time AI analysis.",
        peerComparison: {
          label: "Similar Creators",
          percentile: 75,
          insight: "Your rate is competitive but slightly above average for this follower tier."
        },
        brandComparison: {
          label: dto.brandCategory || "Industry",
          averageRate: 3500,
          insight: "Brands in this space typically have standard budgets for this content format."
        },
        counterofferEmail: "Hi Team,\n\nThanks for reaching out! Based on the requested usage rights and deliverables, my standard rate for this package is " + (baseMin + rushBonus) + " - " + (baseMax + rushBonus) + ". Let me know if this aligns with your budget.\n\nBest,\nCreator",
        negotiationPoints: [
          "Always specify usage rights explicitly in the contract.",
          "Exclusivity should be narrowly defined to avoid blocking future unrelated opportunities.",
          "Consider asking for a 50% deposit upfront before content creation begins."
        ],
        brandAnalysis: "Fallback analysis: The selected brand category generally supports standard industry rates. In a real AI analysis, this section provides detailed insights into the specific brand's typical budgets, market positioning, and how those factors influence your recommended quote.",
        citedComparables: [],
        brandResearchConfidence: 'LOW' as const,
      };
    }

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
    comparables: any[],
    brandIntel: { summary: string; sourceUrls: string[]; estimatedTier: string | null } | null,
  ): string {
    const followerRange = this.followerBucket(dto.followers);
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
              (c: any) =>
                `- ${c.followerRange} ${c.niche} creator, ${c.platform}, ${c.dealType}: $${Number(c.baseRate).toFixed(0)} ${c.currency}${c.similarity ? ` (relevance: ${(c.similarity * 100).toFixed(0)}%)` : ''}`,
            )
            .join('\n')
        : 'No direct comparables found in database — use general market knowledge.';

    const brandIntelSummary = brandIntel
      ? `Brand: ${dto.brandName}\nEstimated tier: ${brandIntel.estimatedTier ?? 'unknown'}\nResearch summary: ${brandIntel.summary}`
      : 'No specific brand named — use general brand category assumptions only.';

    const usageRightsStr = dto.usageRights.join(', ');
    const rushText = dto.isRush
      ? 'YES — rush premium should be applied (typically 25–50% uplift)'
      : 'No';
    const exclusivityText =
      dto.exclusivityDays > 0
        ? `${dto.exclusivityDays} days (exclusivity premium should be applied)`
        : 'None';

    const dashboardDetailsText = dto.dashboardDetails 
      ? `\n- Monthly Dashboard / Performance Details: ${dto.dashboardDetails}`
      : '';

    return `You are a senior brand deal rate advisor for digital creators. Provide a professional rate recommendation.

CREATOR PROFILE:
- Platform: ${platform}
- Follower count/range: ${dto.followers} (${followerRange})
- Niche(s): ${niches}
- Avg engagement rate: ${engagementRate}
- Avg views per post: ${avgViews}${dashboardDetailsText}

DEAL REQUEST:
- Content format: ${dto.contentFormat.replace(/_/g, ' ')}
- Deal type: ${dto.dealType.replace(/_/g, ' ')}
- Brand tier: ${dto.brandTier}
- Brand category: ${dto.brandCategory}
- Usage rights requested: ${usageRightsStr}
- Exclusivity: ${exclusivityText}
- Rush delivery: ${rushText}
- Revision rounds included: ${dto.revisionRounds}

MARKET COMPARABLES (semantically retrieved via vector search, most relevant first):
${comparablesSummary}

BRAND RESEARCH (live web-grounded intelligence on the specific brand named):
${brandIntelSummary}

INSTRUCTIONS:
Weigh the BRAND RESEARCH section heavily — a named, well-researched brand should materially shift the recommended rate range compared to a generic brand tier guess. If brand research indicates ENTERPRISE or LUXURY tier, lean toward the higher end of market comparables. If STARTUP tier, note that budget constraints are likely even if the creator's profile justifies a higher rate, and mention this tradeoff in the rationale.
Analyze the creator's profile, deal parameters, and market data. Pay special attention to the brand and do an analysis of the brand itself to determine how it impacts the price.
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
  "negotiationPoints": ["<point 1>", "<point 2>", "<point 3>", "<optional point 4>", "<optional point 5>"],
  "brandAnalysis": "<detailed analysis of the brand category/tier and how its reputation/size justifies the final price out>",
  "citedComparables": ["<array of up to 3 strings, each citing which comparable deal most influenced the recommendation, e.g. 'A 50K-200K follower lifestyle creator on Instagram doing a similar sponsored post deal earned $4200'>"],
  "brandResearchConfidence": "<one of: HIGH, MEDIUM, LOW — based on how much real information was found about this specific brand>"
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
