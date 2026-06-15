import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  IsInt,
  Min,
  ValidateNested,
  IsEmail,
} from 'class-validator';

export enum DealStatusEnum {
  DRAFT = 'DRAFT',
  NEGOTIATING = 'NEGOTIATING',
  PENDING_CONTRACT = 'PENDING_CONTRACT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum DealStageEnum {
  NEW_INQUIRY = 'NEW_INQUIRY',
  QUALIFIED = 'QUALIFIED',
  PITCH_SENT = 'PITCH_SENT',
  NEGOTIATING = 'NEGOTIATING',
  CONTRACT_SENT = 'CONTRACT_SENT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  LOST = 'LOST',
}

export enum DeliverableTypeEnum {
  INSTAGRAM_POST = 'INSTAGRAM_POST',
  INSTAGRAM_REEL = 'INSTAGRAM_REEL',
  INSTAGRAM_STORY = 'INSTAGRAM_STORY',
  YOUTUBE_VIDEO = 'YOUTUBE_VIDEO',
  YOUTUBE_SHORT = 'YOUTUBE_SHORT',
  TIKTOK_VIDEO = 'TIKTOK_VIDEO',
  TWITTER_POST = 'TWITTER_POST',
  LINKEDIN_POST = 'LINKEDIN_POST',
  BLOG_POST = 'BLOG_POST',
  PODCAST_MENTION = 'PODCAST_MENTION',
  LIVE_STREAM = 'LIVE_STREAM',
  NEWSLETTER = 'NEWSLETTER',
  UGC_CONTENT = 'UGC_CONTENT',
  OTHER = 'OTHER',
}

export enum DeliverableStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export class CreateDeliverableDto {
  @ApiProperty({ enum: DeliverableTypeEnum })
  @IsEnum(DeliverableTypeEnum)
  type!: string;

  @ApiPropertyOptional({ enum: DeliverableStatusEnum })
  @IsEnum(DeliverableStatusEnum)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contentUrl?: string;
}

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  brandName!: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  brandEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandWebsite?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandInstagram?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dealSource?: string;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @ApiPropertyOptional({ enum: DealStatusEnum })
  @IsEnum(DealStatusEnum)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: DealStageEnum })
  @IsEnum(DealStageEnum)
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  quotedAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  offeredAmount?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  followUpReminder?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  exclusivityDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  exclusivityNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  usageRights?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];

  @ApiPropertyOptional({ type: [CreateDeliverableDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliverableDto)
  @IsOptional()
  deliverables?: CreateDeliverableDto[] = [];
}

export class UpdateDealDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  brandEmail?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandWebsite?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandInstagram?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dealSource?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: DealStatusEnum })
  @IsEnum(DealStatusEnum)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: DealStageEnum })
  @IsEnum(DealStageEnum)
  @IsOptional()
  stage?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  quotedAmount?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  offeredAmount?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  followUpReminder?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  exclusivityDays?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  exclusivityNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  usageRights?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class UpdateDealStageDto {
  @ApiProperty({ enum: DealStageEnum })
  @IsEnum(DealStageEnum)
  stage!: string;
}
