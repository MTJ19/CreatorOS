import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max, IsInt } from 'class-validator';

export class CreateContractGenerationDto {
  @IsString()
  brandName!: string;

  @IsString()
  creatorName!: string;

  @IsString()
  @IsOptional()
  dealId?: string;

  @IsEnum(['SPONSORED_POST', 'UGC', 'AMBASSADOR', 'AFFILIATE', 'OTHER'])
  @IsOptional()
  contractType?: 'SPONSORED_POST' | 'UGC' | 'AMBASSADOR' | 'AFFILIATE' | 'OTHER' = 'SPONSORED_POST';

  @IsInt()
  @Min(0)
  @IsOptional()
  exclusivityDays?: number = 0;

  @IsString()
  @IsOptional()
  exclusivityScope?: string;

  @IsString()
  @IsOptional()
  usageRightsScope?: string = 'Organic only';

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  killFeePercent?: number = 50;

  @IsInt()
  @Min(0)
  @IsOptional()
  revisionLimit?: number = 2;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  latePaymentPenaltyPercent?: number = 5;

  @IsBoolean()
  @IsOptional()
  latePaymentPenaltyToggle?: boolean = true;

  @IsBoolean()
  @IsOptional()
  includeFtcDisclosure?: boolean = true;

  @IsString()
  @IsOptional()
  governingLaw?: string = 'California';
}
