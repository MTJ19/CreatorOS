import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreatePerformanceLogDto, UpdatePerformanceLogDto } from './performance.dto';
import { PerformanceService } from './performance.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';


@ApiTags('performance')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  /**
   * GET /performance
   * List all performance logs for the authenticated creator.
   */
  @Get()
  @ApiOperation({ summary: 'Get all performance logs for current creator' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.performanceService.findAll(user.sub);
  }

  /**
   * GET /performance/averages
   * Retrieve rolling 30/60/90-day averages for views, engagement, and CPV.
   */
  @Get('averages')
  @ApiOperation({ summary: 'Get rolling performance averages (30/60/90 days)' })
  getAverages(@CurrentUser() user: JwtPayload) {
    return this.performanceService.getRollingAverages(user.sub);
  }

  /**
   * GET /performance/deal/:dealId
   * Retrieve performance logs associated with a specific deal.
   */
  @Get('deal/:dealId')
  @ApiOperation({ summary: 'Get all performance logs for a deal' })
  findByDeal(@Param('dealId') dealId: string) {
    return this.performanceService.findByDeal(dealId);
  }

  /**
   * POST /performance
   * Log a new post's performance metrics.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log new post performance metrics' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePerformanceLogDto,
  ) {
    return this.performanceService.create(user.sub, dto);
  }

  /**
   * PATCH /performance/:id
   * Update details or metrics of an existing log.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing performance log' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceLogDto,
  ) {
    return this.performanceService.update(id, user.sub, dto);
  }

  /**
   * DELETE /performance/:id
   * Delete a performance log.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a performance log' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.performanceService.remove(id, user.sub);
  }
}
