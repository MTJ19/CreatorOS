import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export enum PerformancePlatformEnum {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  TWITCH = 'TWITCH',
  PINTEREST = 'PINTEREST',
  PODCAST = 'PODCAST',
}

export enum ContentFormatEnum {
  SHORT_FORM_VIDEO = 'SHORT_FORM_VIDEO',
  LONG_FORM_VIDEO = 'LONG_FORM_VIDEO',
  STATIC_IMAGE = 'STATIC_IMAGE',
  CAROUSEL = 'CAROUSEL',
  STORIES = 'STORIES',
  LIVE_STREAM = 'LIVE_STREAM',
  PODCAST = 'PODCAST',
  BLOG_ARTICLE = 'BLOG_ARTICLE',
  NEWSLETTER = 'NEWSLETTER',
  UGC_RAW_FOOTAGE = 'UGC_RAW_FOOTAGE',
}

export class CreatePerformanceLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliverableId?: string;

  @ApiProperty({ enum: PerformancePlatformEnum })
  @IsEnum(PerformancePlatformEnum)
  platform!: string;

  @ApiProperty({ enum: ContentFormatEnum })
  @IsEnum(ContentFormatEnum)
  contentFormat!: string;

  @ApiProperty({ description: 'ISO date string' })
  @IsDateString()
  recordedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  views!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  likes!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  comments!: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 0))
  saves?: number = 0;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 0))
  shares?: number = 0;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? parseInt(value, 10) : undefined,
  )
  watchTimePercent?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isPaid?: boolean = false;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandCategory?: string;
}

export class UpdatePerformanceLogDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliverableId?: string;

  @ApiPropertyOptional({ enum: PerformancePlatformEnum })
  @IsEnum(PerformancePlatformEnum)
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({ enum: ContentFormatEnum })
  @IsEnum(ContentFormatEnum)
  @IsOptional()
  contentFormat?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  recordedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  views?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  likes?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  comments?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  saves?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : undefined))
  shares?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== null ? parseInt(value, 10) : undefined,
  )
  watchTimePercent?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandCategory?: string;
}
