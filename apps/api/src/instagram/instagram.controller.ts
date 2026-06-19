import { Controller, Get, Query, Res, Post, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InstagramService } from './instagram.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('instagram')
@Controller('instagram')
export class InstagramController {
  constructor(
    private readonly instagramService: InstagramService,
    private readonly config: ConfigService,
  ) {}

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async connect(@CurrentUser() user: any, @Res() res: Response) {
    const url = this.instagramService.buildAuthUrl(user.id);
    return res.redirect(url);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const appUrl = this.config.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
    if (error) {
      return res.redirect(`${appUrl}/performance?ig=denied`);
    }
    try {
      await this.instagramService.handleCallback(code, state);
      return res.redirect(`${appUrl}/performance?ig=connected`);
    } catch (err) {
      return res.redirect(`${appUrl}/performance?ig=error`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async status(@CurrentUser() user: any) {
    return this.instagramService.getConnectionStatus(user.id);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async sync(@CurrentUser() user: any) {
    return this.instagramService.syncUserPosts(user.id);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  async disconnect(@CurrentUser() user: any) {
    return this.instagramService.disconnectInstagram(user.id);
  }

  @Get('deauthorize')
  @Post('deauthorize')
  async deauthorize() {
    return { status: 'ok' };
  }

  @Get('data-deletion')
  @Post('data-deletion')
  async dataDeletion() {
    return { url: 'https://yourdomain.com/data-deletion-status', confirmation_code: 'N/A' };
  }
}
