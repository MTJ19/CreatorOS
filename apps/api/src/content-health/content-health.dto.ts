import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateContentIntakeDto {
  @ApiProperty({ example: 'Next.js 15 vs Remix: Full Benchmark Breakdown' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ example: 'Deep dive into performance benchmarks, hydration speeds, and SSR costs.' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  caption?: string;

  @ApiPropertyOptional({ enum: ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'LINKEDIN'], default: 'INSTAGRAM' })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ enum: ['REEL', 'SHORT', 'TIKTOK', 'LONG_FORM_VIDEO', 'POST', 'STORY'], default: 'REEL' })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiPropertyOptional({ example: 'Tech & Software Engineering', default: 'Tech' })
  @IsString()
  @IsOptional()
  niche?: string;

  @ApiPropertyOptional({ example: 'Web developers, tech founders' })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiPropertyOptional({ example: 'https://example.com/demo.mp4' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 45, default: 45 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  durationSeconds?: number;
}

export type CreateContentIntakeInput = CreateContentIntakeDto;

export interface PlatformPatternAnalysis {
  platform: string;
  benchmarkMatchRating: number;
  optimalDurationFit: boolean;
  hookWindowCompliance: boolean;
  audioTrendAlignment: string;
  retentionRiskFactors: string[];
  platformTips: string[];
}

export interface ContentHealthScoreResponse {
  id: string;
  runId: string;
  contentId: string;
  contentTitle: string;
  platform: string;
  niche: string;
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
  platformPatterns: PlatformPatternAnalysis;
  recommendations: string[];
  evaluatedPersonasCount: number;
  createdAt: string;
}

