import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthService } from './auth.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('test-token'),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('test-secret'),
};

const mockAudit = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditLogService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── validateUser ───────────────────────────────────────────────

  describe('validateUser', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const hashedPw = await bcrypt.hash('correctpassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({ password: hashedPw });
      const result = await service.validateUser('test@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('returns user when credentials are valid', async () => {
      const hashedPw = await bcrypt.hash('Password123', 10);
      const mockUser = { id: 'user-1', email: 'test@example.com', password: hashedPw };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.validateUser('test@example.com', 'Password123');
      expect(result).toEqual(mockUser);
    });
  });

  // ── register ──────────────────────────────────────────────────

  describe('register', () => {
    it('throws ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({ name: 'Test', email: 'test@example.com', password: 'Password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns auth response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CREATOR',
        avatarUrl: null,
        createdAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockJwt.signAsync.mockResolvedValue('access-token');

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('access-token');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.register' }),
      );
    });
  });

  // ── refreshTokens ─────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('throws UnauthorizedException for invalid token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for revoked token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        isRevoked: true,
        expiresAt: new Date(Date.now() + 1000000),
        user: { id: 'u1', email: 'a@b.com', role: 'CREATOR' },
      });
      await expect(service.refreshTokens('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates token on valid refresh', async () => {
      const user = { id: 'u1', email: 'a@b.com', role: 'CREATOR', avatarUrl: null, name: 'Test', createdAt: new Date() };
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000000),
        user,
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockJwt.signAsync.mockResolvedValue('new-access-token');

      const result = await service.refreshTokens('valid-token');
      expect(result.tokens.accessToken).toBe('new-access-token');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isRevoked: true } }),
      );
    });
  });

  // ── logout ────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes all refresh tokens for user', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      await service.logout('user-1');
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  // ── getMe ─────────────────────────────────────────────────────

  describe('getMe', () => {
    it('throws NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('returns user with profile', async () => {
      const mockUser = { id: 'u1', email: 'a@b.com', profile: null };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.getMe('u1');
      expect(result).toEqual(mockUser);
    });
  });
});
