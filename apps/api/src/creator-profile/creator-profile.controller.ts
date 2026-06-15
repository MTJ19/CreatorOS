import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreatorProfileService } from './creator-profile.service';
import { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import type { Request } from 'express';

@ApiTags('creator-profile')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'creator-profile', version: '1' })
export class CreatorProfileController {
  constructor(private readonly service: CreatorProfileService) {}

  private getMeta(req: Request) {
    return {
      ipAddress: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    };
  }

  /** GET /api/v1/creator-profile/me */
  @Get('me')
  @ApiOperation({ summary: "Get the current user's creator profile" })
  @ApiResponse({ status: 200, description: 'Creator profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.service.getByUserId(user.sub);
  }

  /** PATCH /api/v1/creator-profile/me */
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update or create the current user creator profile' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  async upsertMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCreatorProfileDto,
    @Req() req: Request,
  ) {
    return this.service.upsert(user.sub, dto, this.getMeta(req));
  }

  /** POST /api/v1/creator-profile/me/complete-onboarding */
  @Post('me/complete-onboarding')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark onboarding as complete' })
  @ApiResponse({ status: 200 })
  async completeOnboarding(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return this.service.completeOnboarding(user.sub, this.getMeta(req));
  }

  /** GET /api/v1/creator-profile/:userId (admin / brand portal use) */
  @Get(':userId')
  @ApiOperation({ summary: 'Get creator profile by user ID' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getProfileByUserId(@Param('userId') userId: string) {
    return this.service.getByUserId(userId);
  }

  /** POST /api/v1/creator-profile (explicit create — for onboarding final submit) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or fully replace creator profile (onboarding submit)' })
  @ApiResponse({ status: 201 })
  async createProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCreatorProfileDto,
    @Req() req: Request,
  ) {
    return this.service.upsert(user.sub, dto, this.getMeta(req));
  }
}
