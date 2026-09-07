import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Version,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContentHealthService } from './content-health.service';
import { CreateContentIntakeDto } from './content-health.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('content-health')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('content-health')
export class ContentHealthController {
  constructor(private readonly contentHealthService: ContentHealthService) {}

  @Post('analyze')
  @Version('1')
  @ApiOperation({ summary: 'Submit content and dispatch multi-agent evaluation run' })
  async analyzeContent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContentIntakeDto,
  ) {
    return this.contentHealthService.startAnalysis(user.sub, dto as any);
  }

  @Get('runs/:runId/status')
  @Version('1')
  @ApiOperation({ summary: 'Check evaluation run lifecycle and progress' })
  async getRunStatus(@Param('runId') runId: string) {
    return this.contentHealthService.getRunStatus(runId);
  }

  @Get('score/:runId')
  @Version('1')
  @ApiOperation({ summary: 'Get aggregated Content Health Score and analytics' })
  async getScore(@Param('runId') runId: string) {
    return this.contentHealthService.getScore(runId);
  }

  @Get('score/:runId/personas')
  @Version('1')
  @ApiOperation({ summary: 'Drill down into individual persona evaluation outputs' })
  @ApiQuery({ name: 'segment', required: false, enum: ['NICHE', 'COLD_OUTSIDER', 'PLATFORM_NATIVE'] })
  async getPersonaResults(
    @Param('runId') runId: string,
    @Query('segment') segment?: string,
  ) {
    return this.contentHealthService.getPersonaResults(runId, segment);
  }

  @Get('recent')
  @Version('1')
  @ApiOperation({ summary: 'Get recent content evaluation runs for current user' })
  async getRecentRuns(@CurrentUser() user: JwtPayload) {
    return this.contentHealthService.getRecentRuns(user.sub);
  }
}
