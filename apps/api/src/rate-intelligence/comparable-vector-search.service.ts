import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import type { CreateRateIntelligenceDto } from './rate-intelligence.dto';

@Injectable()
export class ComparableVectorSearchService {
  private readonly logger = new Logger(ComparableVectorSearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  // Build a text summary of a comparable deal row for embedding
  private summarize(c: {
    followerRange: string; niche: string; platform: string; dealType: string;
    brandTier: string; contentFormat: string; usageRights: string[];
    exclusivityDays: number; baseRate: any; currency: string;
  }): string {
    return `${c.followerRange} follower ${c.niche} creator on ${c.platform}, ${c.dealType} deal, ${c.contentFormat} content, brand tier ${c.brandTier}, usage rights: ${c.usageRights.join(', ')}, exclusivity: ${c.exclusivityDays} days, rate: ${c.baseRate} ${c.currency}`;
  }

  // Backfill embeddings for any ComparableDeal rows missing one. Call this from a one-off script or admin endpoint.
  async backfillEmbeddings(batchSize = 20) {
    const rows = await this.prisma.comparableDeal.findMany({
      where: { embedding: null } as any,
      take: batchSize,
    });
    if (rows.length === 0) return { processed: 0 };

    const texts = rows.map((r) => this.summarize(r as any));
    const embeddings = await this.gemini.embedBatch(texts);

    for (let i = 0; i < rows.length; i++) {
      const embedding = embeddings[i];
      const row = rows[i];
      if (!embedding || !row) continue;

      const vectorLiteral = `[${embedding.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `UPDATE comparable_deals SET embedding = $1::vector, "summaryText" = $2 WHERE id = $3`,
        vectorLiteral,
        texts[i],
        row.id,
      );
    }
    return { processed: rows.length };
  }

  // Core RAG retrieval: embed the query deal, find top-K nearest comparables by cosine distance
  async findSimilarComparables(dto: CreateRateIntelligenceDto, topK = 8) {
    const queryText = `${dto.followers} follower creator, ${dto.contentFormat} content, ${dto.dealType} deal, brand tier ${dto.brandTier}, brand category ${dto.brandCategory}, usage rights: ${dto.usageRights.join(', ')}, exclusivity: ${dto.exclusivityDays} days`;

    let queryEmbedding: number[];
    try {
      queryEmbedding = await this.gemini.embedText(queryText);
    } catch (err: any) {
      this.logger.warn(`Embedding failed, falling back to exact-match filter: ${err.message}`);
      return this.fallbackExactMatch(dto, topK);
    }

    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    try {
      const results = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, "followerRange", niche, platform, "dealType", "brandTier", "contentFormat",
                "usageRights", "exclusivityDays", "baseRate", currency, "engagementRate", year,
                1 - (embedding <=> $1::vector) AS similarity
         FROM comparable_deals
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        vectorLiteral,
        topK,
      );
      return results;
    } catch (err: any) {
      this.logger.warn(`Vector search failed, falling back to exact-match filter: ${err.message}`);
      return this.fallbackExactMatch(dto, topK);
    }
  }

  private async fallbackExactMatch(dto: CreateRateIntelligenceDto, topK: number) {
    return this.prisma.comparableDeal.findMany({
      where: {
        contentFormat: dto.contentFormat as any,
        brandTier: dto.brandTier,
        dealType: dto.dealType,
      },
      orderBy: { baseRate: 'asc' },
      take: topK,
    });
  }
}
