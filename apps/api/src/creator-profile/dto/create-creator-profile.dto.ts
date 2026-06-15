import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUrl,
  Min,
  Max,
  MaxLength,
  IsInt,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';

export enum SocialPlatformEnum {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  TWITCH = 'TWITCH',
  PINTEREST = 'PINTEREST',
  PODCAST = 'PODCAST',
}

export enum PostingFrequencyEnum {
  DAILY = 'DAILY',
  MULTIPLE_WEEKLY = 'MULTIPLE_WEEKLY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  LESS_THAN_MONTHLY = 'LESS_THAN_MONTHLY',
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

export enum AudienceAgeRangeEnum {
  AGE_13_17 = 'AGE_13_17',
  AGE_18_24 = 'AGE_18_24',
  AGE_25_34 = 'AGE_25_34',
  AGE_35_44 = 'AGE_35_44',
  AGE_45_54 = 'AGE_45_54',
  AGE_55_PLUS = 'AGE_55_PLUS',
}

export class PlatformHandleDto {
  @ApiProperty({ enum: SocialPlatformEnum })
  @IsEnum(SocialPlatformEnum)
  platform!: SocialPlatformEnum;

  @ApiProperty({ example: '@creator' })
  @IsString()
  @IsNotEmpty()
  handle!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  followerCount!: number;

  @ApiProperty()
  @IsBoolean()
  verified!: boolean;
}

export class CreateCreatorProfileDto {
  // Step 1 — Platform & Identity
  @ApiPropertyOptional({ enum: SocialPlatformEnum })
  @IsOptional()
  @IsEnum(SocialPlatformEnum)
  primaryPlatform?: SocialPlatformEnum;

  @ApiPropertyOptional({ type: [PlatformHandleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformHandleDto)
  platformHandles?: PlatformHandleDto[];

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalFollowers?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  avgViews?: number;

  // Step 2 — Content & Niche
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  niche?: string[];

  @ApiPropertyOptional({ enum: ContentFormatEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ContentFormatEnum, { each: true })
  contentFormats?: ContentFormatEnum[];

  @ApiPropertyOptional({ enum: PostingFrequencyEnum })
  @IsOptional()
  @IsEnum(PostingFrequencyEnum)
  postingFrequency?: PostingFrequencyEnum;

  // Step 3 — Audience
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceGeography?: string[];

  @ApiPropertyOptional({ enum: AudienceAgeRangeEnum, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AudienceAgeRangeEnum, { each: true })
  audienceAgeRange?: AudienceAgeRangeEnum[];

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  avgEngagementRate?: number;

  // Step 4 — Rates & Bio
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseRate?: number;

  @ApiPropertyOptional({ example: 'USD', minLength: 3, maxLength: 3 })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOnboardingComplete?: boolean;
}
