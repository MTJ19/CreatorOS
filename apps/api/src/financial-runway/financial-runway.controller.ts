import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { FinancialRunwayService } from './financial-runway.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

class UpdateFinancialSettingsDto {
  @IsNumber()
  @Min(0)
  monthlyFixedCosts!: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

class UpdateDealConfidenceDto {
  @IsEnum(['CONFIRMED', 'LIKELY', 'SPECULATIVE'])
  confidence!: string;
}

@ApiTags('financial-runway')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('financial-runway')
export class FinancialRunwayController {
  constructor(private readonly service: FinancialRunwayService) {}

  @Get('projection')
  @ApiOperation({ summary: 'Get 30/60/90-day confidence-weighted income projections' })
  getProjection(@CurrentUser() user: JwtPayload) {
    return this.service.getProjection(user.sub);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get financial settings (monthly fixed costs)' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.service.getSettings(user.sub);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update financial settings' })
  upsertSettings(@CurrentUser() user: JwtPayload, @Body() dto: UpdateFinancialSettingsDto) {
    return this.service.upsertSettings(user.sub, dto);
  }

  @Patch('deals/:id/confidence')
  @ApiOperation({ summary: 'Update pipeline confidence for a deal' })
  updateDealConfidence(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDealConfidenceDto,
  ) {
    return this.service.updateDealConfidence(id, user.sub, dto.confidence);
  }
}
