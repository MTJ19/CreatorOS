import { Injectable, Logger } from '@nestjs/common';
import { PersonaSegment } from '@prisma/client';
import { EvaluatedPersonaResult } from './persona-evaluator.agent';

export interface AggregatedScoreOutput {
  overallScore: number;
  viralityPotential: 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW';
  dimensions: {
    hook: number;
    engagement: number;
    clarity: number;
    relevance: number;
    shareability: number;
  };
  segments: {
    nicheScore: number;
    coldOutsiderScore: number;
    platformNativeScore: number;
  };
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
  };
  disagreement: {
    detected: boolean;
    variance: number;
    insight: string;
  };
  recommendations: string[];
}

@Injectable()
export class AggregationEngine {
  private readonly logger = new Logger(AggregationEngine.name);

  /**
   * Aggregates individual persona results into statistically sound metrics,
   * percentiles, segment scores, and disagreement insights.
   */
  aggregate(
    results: EvaluatedPersonaResult[],
    personaSegmentMap: Map<string, PersonaSegment>,
  ): AggregatedScoreOutput {
    if (results.length === 0) {
      throw new Error('Cannot aggregate an empty set of persona evaluations');
    }

    // 1. Overall & Dimension Averages
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const round = (num: number) => Math.round(num * 10) / 10;

    const hookScores = results.map((r) => r.hookScore);
    const clarityScores = results.map((r) => r.clarityScore);
    const engagementScores = results.map((r) => r.engagementScore);
    const relevanceScores = results.map((r) => r.relevanceScore);
    const shareabilityScores = results.map((r) => r.shareabilityScore);
    const overallScores = results.map((r) => r.overallScore);

    const hook = round(avg(hookScores));
    const clarity = round(avg(clarityScores));
    const engagement = round(avg(engagementScores));
    const relevance = round(avg(relevanceScores));
    const shareability = round(avg(shareabilityScores));

    // 2. Percentile Calculations (P25, P50, P75)
    const sortedOverall = [...overallScores].sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const index = (p / 100) * (sortedOverall.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return round(sortedOverall[lower] * (1 - weight) + sortedOverall[upper] * weight);
    };

    const p25 = getPercentile(25);
    const p50 = getPercentile(50); // Median
    const p75 = getPercentile(75);

    // 3. Segment Clustering
    const segmentScores: Record<PersonaSegment, number[]> = {
      [PersonaSegment.NICHE]: [],
      [PersonaSegment.COLD_OUTSIDER]: [],
      [PersonaSegment.PLATFORM_NATIVE]: [],
    };

    for (const r of results) {
      const segment = personaSegmentMap.get(r.personaId) ?? PersonaSegment.NICHE;
      segmentScores[segment].push(r.overallScore);
    }

    const nicheScore = round(avg(segmentScores[PersonaSegment.NICHE]));
    const coldOutsiderScore = round(avg(segmentScores[PersonaSegment.COLD_OUTSIDER]));
    const platformNativeScore = round(avg(segmentScores[PersonaSegment.PLATFORM_NATIVE]));

    // Balanced overall health score incorporating segment weights
    // (40% Niche, 30% Platform-Native, 30% Cold Outsider for balanced viral reach)
    const overallScore = round(
      nicheScore * 0.4 + platformNativeScore * 0.35 + coldOutsiderScore * 0.25,
    );

    // Virality Potential categorization
    let viralityPotential: 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW' = 'MODERATE';
    if (overallScore >= 80) viralityPotential = 'HIGH';
    else if (overallScore >= 70) viralityPotential = 'GOOD';
    else if (overallScore >= 55) viralityPotential = 'MODERATE';
    else viralityPotential = 'LOW';

    // 4. Statistical Disagreement Detection
    // Check standard deviation across the 3 segments
    const segValues = [nicheScore, coldOutsiderScore, platformNativeScore].filter((v) => v > 0);
    const segMean = avg(segValues);
    const variance = round(
      segValues.reduce((sum, val) => sum + Math.pow(val - segMean, 2), 0) / segValues.length,
    );
    const stdDev = Math.sqrt(variance);

    const segmentGap = Math.abs(nicheScore - coldOutsiderScore);
    const disagreementDetected = segmentGap >= 15 || stdDev >= 10;

    let disagreementInsight = 'Audience consensus is strong across all viewer segments.';
    if (disagreementDetected) {
      if (nicheScore > coldOutsiderScore) {
        disagreementInsight = `Significant audience divergence detected (${round(segmentGap)} pt gap). Content resonates strongly with industry insiders (${nicheScore}/100) but loses cold viewers (${coldOutsiderScore}/100) due to assumed context.`;
      } else {
        disagreementInsight = `High viral appeal to casual audiences (${coldOutsiderScore}/100), but subject specialists graded it lower (${nicheScore}/100) due to perceived lack of depth.`;
      }
    }

    // 5. Strategic Recommendations Synthesis
    const recommendations: string[] = [];

    if (hook < 75) {
      recommendations.push(
        'Punch up the first 3 seconds: Replace slow introductory context with a provocative thesis statement or visual contrast.',
      );
    }
    if (clarity < 72 || coldOutsiderScore < 65) {
      recommendations.push(
        'Clarify insider jargon: Replace industry-specific terms with relatable everyday metaphors in the first 15 seconds.',
      );
    }
    if (shareability < 70) {
      recommendations.push(
        'Increase DM-shareability: Add a counter-intuitive insight or a high-utility checklist frame that viewers will want to bookmark.',
      );
    }
    if (engagement < 75) {
      recommendations.push(
        'Plant a comment prompt: End with a polarized or open-ended question instead of a generic "like and follow" call-to-action.',
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        'Content demonstrates exceptional audience balance across all dimensions. Ready for prime-time publication.',
      );
    }

    return {
      overallScore,
      viralityPotential,
      dimensions: {
        hook,
        engagement,
        clarity,
        relevance,
        shareability,
      },
      segments: {
        nicheScore,
        coldOutsiderScore,
        platformNativeScore,
      },
      percentiles: {
        p25,
        p50,
        p75,
      },
      disagreement: {
        detected: disagreementDetected,
        variance,
        insight: disagreementInsight,
      },
      recommendations,
    };
  }
}
