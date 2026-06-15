import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import type { JwtPayload } from './strategies/jwt.strategy';
import type { Request as ExpressRequest } from 'express';

type AuthenticatedRequest = ExpressRequest & { user: JwtPayload };

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getMeta(req: ExpressRequest) {
    return {
      ipAddress: (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? '',
      userAgent: req.headers['user-agent'] ?? '',
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  @ApiOperation({ summary: 'Register a new creator account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto, @Req() req: ExpressRequest): Promise<AuthResponseDto> {
    return this.authService.register(dto, this.getMeta(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute
  @ApiOperation({ summary: 'Login with email + password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: ExpressRequest): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new Error('Invalid credentials'); // Will be caught by UnauthorizedException in service
    }
    return this.authService.login(user.id, this.getMeta(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: ExpressRequest,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken, this.getMeta(req));
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout and revoke all refresh tokens' })
  @ApiResponse({ status: 204 })
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logout(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200 })
  async getMe(@CurrentUser() user: JwtPayload, @Request() _req: AuthenticatedRequest) {
    return this.authService.getMe(user.sub);
  }
}
