import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

import type { AuthResponseDto } from './dto/auth-response.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_SEC = 60 * 60 * 24 * 7; // 7 days in seconds

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Validate email + password — returns user or null */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.password) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  /** Register a new creator account */
  async register(
    dto: RegisterDto,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: 'CREATOR',
      },
    });

    await this.auditLog.log({
      userId: user.id,
      action: 'auth.register',
      resource: 'User',
      resourceId: user.id,
      metadata: { email: user.email },
      ...meta,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role, meta);
    return this.buildAuthResponse(user, tokens);
  }

  /** Login an existing user */
  async login(
    userId: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.auditLog.log({
      userId: user.id,
      action: 'auth.login',
      resource: 'User',
      resourceId: user.id,
      ...meta,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role, meta);
    return this.buildAuthResponse(user, tokens);
  }

  /** Login with Google */
  async googleLogin(
    email: string,
    name: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<AuthResponseDto> {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: 'CREATOR',
          provider: 'google',
        },
      });
      await this.auditLog.log({
        userId: user.id,
        action: 'auth.register_google',
        resource: 'User',
        resourceId: user.id,
        metadata: { email: user.email },
        ...meta,
      });
    }

    await this.auditLog.log({
      userId: user.id,
      action: 'auth.login_google',
      resource: 'User',
      resourceId: user.id,
      ...meta,
    });

    const tokens = await this.generateTokenPair(user.id, user.email, user.role, meta);
    return this.buildAuthResponse(user, tokens);
  }

  /** Rotate refresh token → new access + refresh pair */
  async refreshTokens(
    refreshToken: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<AuthResponseDto> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokenPair(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      meta,
    );
    return this.buildAuthResponse(stored.user, tokens);
  }

  /** Revoke all refresh tokens for a user (logout) */
  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /** Get current user (no password field) */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Private Helpers ──────────────────────────────────────────

  private async generateTokenPair(
    userId: string,
    email: string,
    role: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ) {
    const payload: JwtPayload = { sub: userId, email, role };
    const secret = this.configService.get<string>('JWT_SECRET', 'dev-secret-change-in-prod');
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret-change-in-prod',
    );

    const [accessToken, rawRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { secret, expiresIn: ACCESS_TOKEN_EXPIRY }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: `${REFRESH_TOKEN_EXPIRY_SEC}s`,
      }),
    ]);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SEC * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: rawRefreshToken,
        expiresAt,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  private buildAuthResponse(
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatarUrl: string | null;
      createdAt: Date;
    },
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  ): AuthResponseDto {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }
}
