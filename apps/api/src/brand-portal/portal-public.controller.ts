import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  SubmitBriefDto,
  SetApprovalStatusDto,
  AddBrandCommentDto,
} from './brand-portal.dto';
import { BrandPortalService } from './brand-portal.service';
import { PortalTokenGuard, PortalContext, PortalTokenRecord } from './portal-token.guard';

import type { PortalContext as PortalContextType } from './brand-portal.service';

/**
 * Public portal controller — accessed by brands via opaque token link.
 * No creator JWT required. All endpoints protected by PortalTokenGuard.
 *
 * Separate throttle: 30 requests per minute per IP
 * (overrides the global 100/min guard at module level).
 */
@ApiTags('portal-public')
@ApiSecurity('PortalToken')
@UseGuards(PortalTokenGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('portal')
export class PortalPublicController {
  constructor(private readonly brandPortalService: BrandPortalService) {}

  // ── Context ──────────────────────────────────────────────────

  @Get('context')
  @ApiOperation({
    summary: 'Get portal context — deal summary, existing submission, comments (no dealId exposed)',
  })
  getContext(@PortalContext() ctx: PortalContextType) {
    return ctx;
  }

  // ── Brief Submission ─────────────────────────────────────────

  @Post('submit-brief')
  @ApiOperation({ summary: 'Brand submits a Google Doc URL brief' })
  @HttpCode(HttpStatus.OK)
  submitBriefUrl(
    @PortalTokenRecord() tokenRecord: any,
    @Body() dto: SubmitBriefDto,
  ) {
    return this.brandPortalService.submitBrief(tokenRecord, dto);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Brand uploads PDF/DOCX brief file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  )
  @HttpCode(HttpStatus.OK)
  uploadBrief(
    @PortalTokenRecord() tokenRecord: any,
    @UploadedFile() file: any,
    @Body() dto: SubmitBriefDto,
  ) {
    return this.brandPortalService.submitBrief(tokenRecord, dto, file);
  }

  // ── Approval ─────────────────────────────────────────────────

  @Patch('approval')
  @ApiOperation({ summary: 'Brand sets approval status (Pending/Approved/Approved with Changes/Rejected)' })
  @HttpCode(HttpStatus.OK)
  setApproval(
    @PortalTokenRecord() tokenRecord: any,
    @Body() dto: SetApprovalStatusDto,
  ) {
    return this.brandPortalService.setApprovalStatus(tokenRecord, dto);
  }

  // ── Comments ─────────────────────────────────────────────────

  @Post('comments')
  @ApiOperation({ summary: 'Brand adds a comment in the portal thread' })
  addComment(
    @PortalTokenRecord() tokenRecord: any,
    @Body() dto: AddBrandCommentDto,
  ) {
    return this.brandPortalService.addBrandComment(tokenRecord, dto);
  }
}
