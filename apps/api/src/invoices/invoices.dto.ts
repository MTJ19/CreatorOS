import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  IsEmail,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
} from 'class-validator';

export enum InvoiceStatusEnum {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum PaymentTermsEnum {
  NET_15 = 'NET_15',
  NET_30 = 'NET_30',
  NET_45 = 'NET_45',
  NET_60 = 'NET_60',
  NET_90 = 'NET_90',
  FIFTY_FIFTY = 'FIFTY_FIFTY',
}

/** Maps payment terms to days for due-date auto-calculation */
export const PAYMENT_TERMS_DAYS: Record<PaymentTermsEnum, number> = {
  NET_15: 15,
  NET_30: 30,
  NET_45: 45,
  NET_60: 60,
  NET_90: 90,
  FIFTY_FIFTY: 30, // 50% upfront, 50% at 30 days
};

export class CreateLineItemDto {
  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliverableId?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dealId?: string;

  @ApiProperty()
  @IsString()
  brandName!: string;

  @ApiProperty()
  @IsEmail()
  brandEmail!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brandAddress?: string;

  @ApiPropertyOptional({ enum: PaymentTermsEnum, default: PaymentTermsEnum.NET_30 })
  @IsEnum(PaymentTermsEnum)
  @IsOptional()
  paymentTerms?: PaymentTermsEnum = PaymentTermsEnum.NET_30;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, description: 'Tax rate as a percentage (e.g. 8.5 for 8.5%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @ApiPropertyOptional({ description: 'ISO date string for invoice issue date (defaults to now)' })
  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @ApiPropertyOptional({ description: 'Override auto-calculated due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @ApiProperty({ type: [CreateLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  lineItems!: CreateLineItemDto[];
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dealId?: string;

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
  brandAddress?: string;

  @ApiPropertyOptional({ enum: PaymentTermsEnum })
  @IsEnum(PaymentTermsEnum)
  @IsOptional()
  paymentTerms?: PaymentTermsEnum;

  @ApiPropertyOptional({ enum: InvoiceStatusEnum })
  @IsEnum(InvoiceStatusEnum)
  @IsOptional()
  status?: InvoiceStatusEnum;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @ApiPropertyOptional({ type: [CreateLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLineItemDto)
  @IsOptional()
  lineItems?: CreateLineItemDto[];
}

export class MarkPaidDto {
  @ApiPropertyOptional({ description: 'Amount received. If omitted, marks fully paid (totalAmount).' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'ISO date string for when payment was received (defaults to now)' })
  @IsDateString()
  @IsOptional()
  paidAt?: string;
}
