import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';

const CACHE_TTL_DAYS = 30;

@Injectable()
export class BrandIntelService {
  private readonly logger = new Logger(BrandIntelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async getBrandIntel(brandName: string, brandCategory?: string) {
    const normalized = brandName.trim().toLowerCase();

    const cached = await this.prisma.brandIntelCache.findUnique({
      where: { brandName: normalized },
    });

    const isStale = cached
      ? (Date.now() - cached.refreshedAt.getTime()) / (1000 * 60 * 60 * 24) > CACHE_TTL_DAYS
      : true;

    if (cached && !isStale) {
      return cached;
    }

    try {
      const research = await this.gemini.researchBrand(brandName, brandCategory);
      const saved = await this.prisma.brandIntelCache.upsert({
        where: { brandName: normalized },
        create: {
          brandName: normalized,
          brandCategory: brandCategory ?? null,
          summary: research.summary,
          sourceUrls: research.sourceUrls,
          estimatedTier: research.estimatedTier,
        },
        update: {
          summary: research.summary,
          sourceUrls: research.sourceUrls,
          estimatedTier: research.estimatedTier,
          refreshedAt: new Date(),
        },
      });
      return saved;
    } catch (err: any) {
      this.logger.warn(`Brand research failed for ${brandName}: ${err.message}`);
      if (cached) return cached; // serve stale cache if research fails
      return {
        brandName: normalized,
        brandCategory: brandCategory ?? null,
        summary: 'No web research available for this brand. Analysis based on category and tier inputs only.',
        sourceUrls: [],
        estimatedTier: null,
        refreshedAt: new Date(),
      };
    }
  }
}
