import { z } from 'zod';

export const PersonaSegmentEnum = z.enum(['NICHE', 'COLD_OUTSIDER', 'PLATFORM_NATIVE']);
export type PersonaSegment = z.infer<typeof PersonaSegmentEnum>;

export const ContentScoreRunStatusEnum = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']);
export type ContentScoreRunStatus = z.infer<typeof ContentScoreRunStatusEnum>;

// Intake schema
export const CreateContentIntakeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  caption: z.string().max(2000).default(''),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'LINKEDIN']).default('INSTAGRAM'),
  contentType: z.enum(['REEL', 'SHORT', 'TIKTOK', 'LONG_FORM_VIDEO', 'POST', 'STORY']).default('REEL'),
  niche: z.string().min(1, 'Niche is required').default('Tech & Creator Economy'),
  targetAudience: z.string().optional().default('Creators and Founders'),
  videoUrl: z.string().url().optional().or(z.literal('')),
  durationSeconds: z.number().int().positive().optional().default(45),
});
export type CreateContentIntakeInput = z.infer<typeof CreateContentIntakeSchema>;

// Persona evaluation output from generic agent
export const PersonaEvaluationResultSchema = z.object({
  personaId: z.string(),
  personaName: z.string(),
  segment: PersonaSegmentEnum,
  hookScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  shareabilityScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  reason: z.string().min(5),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
});
export type PersonaEvaluationResult = z.infer<typeof PersonaEvaluationResultSchema>;

// Platform Pattern Output
export const PlatformPatternAnalysisSchema = z.object({
  platform: z.string(),
  benchmarkMatchRating: z.number().min(0).max(100),
  optimalDurationFit: z.boolean(),
  hookWindowCompliance: z.boolean(),
  audioTrendAlignment: z.string(),
  retentionRiskFactors: z.array(z.string()),
  platformTips: z.array(z.string()),
});
export type PlatformPatternAnalysis = z.infer<typeof PlatformPatternAnalysisSchema>;

// Final aggregated Content Health Score response
export const ContentHealthScoreResponseSchema = z.object({
  id: z.string(),
  runId: z.string(),
  contentId: z.string(),
  contentTitle: z.string(),
  platform: z.string(),
  niche: z.string(),
  
  // Aggregate Scores (0-100)
  overallScore: z.number().min(0).max(100),
  viralityPotential: z.enum(['HIGH', 'GOOD', 'MODERATE', 'LOW']),
  
  // 5 Key Dimensions
  dimensions: z.object({
    hook: z.number().min(0).max(100),
    engagement: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    relevance: z.number().min(0).max(100),
    shareability: z.number().min(0).max(100),
  }),

  // Segment Breakdown
  segments: z.object({
    nicheScore: z.number().min(0).max(100),
    coldOutsiderScore: z.number().min(0).max(100),
    platformNativeScore: z.number().min(0).max(100),
  }),

  // Percentiles
  percentiles: z.object({
    p25: z.number(),
    p50: z.number(),
    p75: z.number(),
  }),

  // Disagreement detection
  disagreement: z.object({
    detected: z.boolean(),
    variance: z.number(),
    insight: z.string(),
  }),

  // Platform Pattern Insights
  platformPatterns: PlatformPatternAnalysisSchema,

  // Actionable Content Recommendations
  recommendations: z.array(z.string()),

  // Persona Summary Count
  evaluatedPersonasCount: z.number(),
  createdAt: z.string(),
});
export type ContentHealthScoreResponse = z.infer<typeof ContentHealthScoreResponseSchema>;
