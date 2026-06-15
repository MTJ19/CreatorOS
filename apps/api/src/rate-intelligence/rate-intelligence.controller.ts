import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateRateIntelligenceDto, GetHistoryDto } from './rate-intelligence.dto';
import { RateIntelligenceService } from './rate-intelligence.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('Rate Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rate-intelligence')
export class RateIntelligenceController {
  constructor(private readonly rateIntelligenceService: RateIntelligenceService) {}

  /**
   * POST /rate-intelligence/quote
   * Generate AI-powered rate recommendation. Rate-limited to 5/min.
   */
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Generate AI rate recommendation' })
  @ApiResponse({ status: 200, description: 'Rate recommendation generated' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 502, description: 'AI service error' })
  async generateQuote(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRateIntelligenceDto,
  ) {
    return this.rateIntelligenceService.generateQuote(user.sub, dto);
  }

  /**
   * GET /rate-intelligence/history
   * Retrieve past rate intelligence requests for the authenticated creator.
   */
  @Get('history')
  @ApiOperation({ summary: 'Get rate intelligence history' })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetHistoryDto,
  ) {
    return this.rateIntelligenceService.getHistory(user.sub, query.limit);
  }
}
