import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { GeneratePortalTokenDto, AddCreatorCommentDto } from './brand-portal.dto';
import { BrandPortalService } from './brand-portal.service';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

/**
 * Creator-facing Brand Portal controller.
 * All routes require a valid creator JWT (same as every other creator endpoint).
 */
@ApiTags('brand-portal')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('brand-portal')
export class BrandPortalController {
  constructor(private readonly brandPortalService: BrandPortalService) {}

  // ── Token Management ─────────────────────────────────────────

  @Get('tokens')
  @ApiOperation({ summary: 'List all active brand portal tokens' })
  listTokens(@CurrentUser() user: JwtPayload) {
    return this.brandPortalService.listTokens(user.sub);
  }

  @Post('tokens')
  @ApiOperation({ summary: 'Generate a new brand portal token for a deal' })
  @ApiResponse({ status: 201, description: 'Returns the raw token (shown once) + portal URL' })
  generateToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GeneratePortalTokenDto,
  ) {
    return this.brandPortalService.generateToken(user.sub, dto);
  }

  @Patch('tokens/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a portal token (immediately invalidates the link)' })
  @ApiParam({ name: 'id', description: 'BrandPortalToken record ID' })
  revokeToken(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.brandPortalService.revokeToken(id, user.sub);
  }

  // ── Activity & Comments ──────────────────────────────────────

  @Get('tokens/:id/activity')
  @ApiOperation({ summary: 'Get all submissions + comments for a portal token' })
  @ApiParam({ name: 'id', description: 'BrandPortalToken record ID' })
  getActivity(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.brandPortalService.getTokenActivity(id, user.sub);
  }

  @Post('tokens/:id/comments')
  @ApiOperation({ summary: 'Creator adds a comment visible to the brand' })
  @ApiParam({ name: 'id', description: 'BrandPortalToken record ID' })
  addCreatorComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddCreatorCommentDto,
  ) {
    return this.brandPortalService.addCreatorComment(id, user.sub, dto);
  }
}
