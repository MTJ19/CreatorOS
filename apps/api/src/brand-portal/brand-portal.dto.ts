import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PortalPermission, PortalApprovalStatus } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

// ── Creator-side DTOs (JWT-authenticated) ────────────────────

export class GeneratePortalTokenDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MaxLength(200)
  brandName!: string;

  @ApiProperty({ example: 'brand@acmecorp.com' })
  @IsEmail()
  brandEmail!: string;

  @ApiPropertyOptional({ example: 'deal-cuid' })
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiPropertyOptional({ description: 'Token validity in days (1–90)', example: 30 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(90)
  expiresInDays?: number;

  @ApiPropertyOptional({ description: 'Portal permissions granted to brand' })
  @IsArray()
  @IsEnum(PortalPermission, { each: true })
  @IsOptional()
  permissions?: PortalPermission[];

  @ApiPropertyOptional({ example: 'Please review and approve the campaign brief.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  brandNote?: string;
}

export class AddCreatorCommentDto {
  @ApiProperty({ example: 'Here is the latest draft for your review.' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}

// ── Public portal DTOs (token-authenticated) ─────────────────

export class SubmitBriefDto {
  @ApiPropertyOptional({ description: 'Google Doc URL for the brief' })
  @IsUrl()
  @IsOptional()
  googleDocUrl?: string;

  @ApiPropertyOptional({ description: 'Revision notes or message from brand' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  revisionNotes?: string;
}

export class SetApprovalStatusDto {
  @ApiProperty({ enum: PortalApprovalStatus })
  @IsEnum(PortalApprovalStatus)
  approvalStatus!: PortalApprovalStatus;

  @ApiPropertyOptional({ example: 'Please change the CTA in the second slide.' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  revisionNotes?: string;
}

export class AddBrandCommentDto {
  @ApiProperty({ example: 'Could you lighten the background colour?' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
