import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Patch,
  Version,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateContractGenerationDto } from './contracts.dto';
import { ContractsService } from './contracts.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('contracts')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all contracts for the authenticated creator' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.contractsService.findAll(user.sub);
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({ summary: 'Get a single contract with risk flags' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.findOne(id, user.sub);
  }

  @Post('generate')
  @Version('1')
  @ApiOperation({ summary: 'Generate customized campaign contract as a DOCX' })
  async generateContract(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContractGenerationDto,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.contractsService.generateContract(dto, user.sub);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('upload/:dealId')
  @Version('1')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a contract file and review for risk flags' })
  uploadContract(
    @Param('dealId') dealId: string,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: any,
  ) {
    return this.contractsService.uploadAndReviewContract(dealId, user.sub, file);
  }

  @Patch('flags/:flagId/acknowledge')
  @Version('1')
  @ApiOperation({ summary: 'Acknowledge a contract risk flag' })
  acknowledgeFlag(@Param('flagId') flagId: string, @CurrentUser() user: JwtPayload) {
    return this.contractsService.acknowledgeFlag(flagId, user.sub);
  }
}
