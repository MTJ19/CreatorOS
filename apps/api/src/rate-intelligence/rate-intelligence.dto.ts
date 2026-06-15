import { Transform } from 'class-transformer';
import {
  IsEnum, IsArray, IsBoolean, IsInt, IsString,
  Min, Max, ArrayMinSize, IsOptional,
} from 'class-validator';

import type {
  RateIntelligenceInput,
  BrandTier,
  DealType,
  UsageRight,
} from '@creator-os/shared';

const ContentFormatValues = [
  'SHORT_FORM_VIDEO', 'LONG_FORM_VIDEO', 'STATIC_IMAGE',
  'CAROUSEL', 'STORIES', 'LIVE_STREAM', 'PODCAST',
  'BLOG_ARTICLE', 'NEWSLETTER', 'UGC_RAW_FOOTAGE',
] as const;

const UsageRightValues = [
  'ORGANIC_ONLY', 'PAID_ADS', 'WHITELISTING', 'EXCLUSIVITY',
  'IN_PERPETUITY', 'GEO_RESTRICTED', 'REPURPOSE_ALLOWED',
] as const;

const BrandTierValues = ['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA', 'ENTERPRISE'] as const;
const DealTypeValues = ['SPONSORED_POST', 'UGC', 'AMBASSADOR', 'AFFILIATE', 'PRODUCT_GIFTING', 'EVENT'] as const;

export class CreateRateIntelligenceDto implements RateIntelligenceInput {
  @IsEnum(ContentFormatValues)
  contentFormat!: RateIntelligenceInput['contentFormat'];

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(UsageRightValues, { each: true })
  usageRights!: UsageRight[];

  @IsInt()
  @Min(0)
  @Max(730)
  exclusivityDays!: number;

  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isRush!: boolean;

  @IsInt()
  @Min(0)
  @Max(10)
  revisionRounds!: number;

  @IsEnum(BrandTierValues)
  brandTier!: BrandTier;

  @IsEnum(DealTypeValues)
  dealType!: DealType;

  @IsString()
  brandCategory!: string;
}

export class GetHistoryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}
