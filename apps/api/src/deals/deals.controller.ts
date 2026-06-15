import {
  Controller,
  Get,
  Param,
  Version,
  UseGuards,
  Post,
  Body,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DealStage } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateDealDto, UpdateDealDto, UpdateDealStageDto } from './deals.dto';
import { DealsService } from './deals.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('deals')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get('dashboard/stats')
  @Version('1')
  @ApiOperation({ summary: 'Get cached dashboard stats for creator' })
  getDashboardStats(@CurrentUser() user: JwtPayload) {
    return this.dealsService.getDashboardStats(user.sub);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a new brand deal' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDealDto) {
    return this.dealsService.create(user.sub, dto);
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all deals for the authenticated creator' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.dealsService.findAll(user.sub);
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a single deal by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.dealsService.findOne(id, user.sub);
  }

  @Patch(':id')
  @Version('1')
  @ApiOperation({ summary: 'Update a deal' })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateDealDto) {
    return this.dealsService.update(id, user.sub, dto);
  }

  @Patch(':id/stage')
  @Version('1')
  @ApiOperation({ summary: 'Update deal stage' })
  updateStage(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateDealStageDto,
  ) {
    return this.dealsService.updateStage(id, user.sub, dto.stage as DealStage);
  }

  @Delete(':id')
  @Version('1')
  @ApiOperation({ summary: 'Delete a deal' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.dealsService.remove(id, user.sub);
  }

  // ─── Brief Routing ──────────────────────────────────────────

  @Get(':id/brief')
  @Version('1')
  @ApiOperation({ summary: 'Get brief and reconciliation details for a deal' })
  getBrief(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.dealsService.getBrief(id, user.sub);
  }

  @Post(':id/brief/upload')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and parse brief for a deal' })
  uploadBrief(@Param('id') id: string, @CurrentUser() user: JwtPayload, @UploadedFile() file: any) {
    return this.dealsService.uploadBrief(id, user.sub, file);
  }

  @Put(':id/brief/parsed')
  @Version('1')
  @ApiOperation({ summary: 'Update parsed brief deliverables and reconcile' })
  updateBriefParsedData(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() parsedData: any,
  ) {
    return this.dealsService.updateBriefParsedData(id, user.sub, parsedData);
  }
}
