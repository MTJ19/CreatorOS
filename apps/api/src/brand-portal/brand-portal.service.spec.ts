import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { PortalPermission, PortalCommentAuthor, PortalApprovalStatus } from '@prisma/client';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

import { BrandPortalService } from './brand-portal.service';

// ── Mock Infrastructure ───────────────────────────────────────

const mockPrisma = {
  deal: { findUnique: jest.fn() },
  brandPortalToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  portalSubmission: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  portalComment: { create: jest.fn() },
};

const mockAuditLog = { log: jest.fn().mockResolvedValue(undefined) };
const mockStorage = { uploadFile: jest.fn() };
const mockConfig = { get: jest.fn((key: string, def?: any) => def ?? 'http://localhost:3000') };
const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verifyAsync: jest.fn().mockImplementation(async (token) => {
    if (token === 'bad-token' || token === '') {
      throw new Error('invalid token');
    }
    return { jti: 'test-uuid-opaque-token', tokenId: 'token-record-1' };
  }),
};

// ── Helper: build a mock token record ────────────────────────

const makeToken = (overrides: Partial<any> = {}) => ({
  id: 'token-record-1',
  creatorId: 'creator-1',
  dealId: 'deal-1',
  token: 'test-uuid-opaque-token',
  brandName: 'Acme Corp',
  brandEmail: 'brand@acme.com',
  brandNote: null,
  permissions: [PortalPermission.APPROVE_CONTENT],
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // future
  lastAccessedAt: null,
  accessCount: 0,
  isRevoked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deal: { title: 'Summer Campaign', brandName: 'Acme Corp' },
  creator: { name: 'Jane Doe', email: 'jane@creator.com' },
  submissions: [],
  comments: [],
  ...overrides,
});

// ─────────────────────────────────────────────────────────────

describe('BrandPortalService', () => {
  let service: BrandPortalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandPortalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: StorageService, useValue: mockStorage },
        { provide: ConfigService, useValue: mockConfig },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<BrandPortalService>(BrandPortalService);
    jest.clearAllMocks();
  });

  // ── Token Generation ─────────────────────────────────────────

  describe('generateToken', () => {
    it('creates a token with opaque uuid (no deal info in token string)', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'creator-1' });
      const created = makeToken();
      mockPrisma.brandPortalToken.create.mockResolvedValue(created);

      const result = await service.generateToken('creator-1', {
        brandName: 'Acme Corp',
        brandEmail: 'brand@acme.com',
        dealId: 'deal-1',
      });

      expect(result.token).toBeTruthy();
      // Token must NOT contain the dealId
      expect(result.token).not.toContain('deal-1');
      // Token must NOT contain creator ID
      expect(result.token).not.toContain('creator-1');
      // portalUrl must include the token
      expect(result.portalUrl).toContain(result.token);
    });

    it('sets expiresAt to now + expiresInDays', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'creator-1' });
      mockPrisma.brandPortalToken.create.mockImplementation(({ data }: any) => ({
        ...makeToken(),
        expiresAt: data.expiresAt,
        token: data.token,
      }));

      const before = Date.now();
      await service.generateToken('creator-1', {
        brandName: 'Acme Corp',
        brandEmail: 'brand@acme.com',
        dealId: 'deal-1',
        expiresInDays: 14,
      });

      const createCall = mockPrisma.brandPortalToken.create.mock.calls[0][0].data;
      const expectedMs = 14 * 24 * 60 * 60 * 1000;
      expect(createCall.expiresAt.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 1000);
      expect(createCall.expiresAt.getTime()).toBeLessThanOrEqual(before + expectedMs + 1000);
    });

    it('defaults to 30-day expiry when expiresInDays not specified', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'creator-1' });
      mockPrisma.brandPortalToken.create.mockImplementation(({ data }: any) => ({
        ...makeToken(),
        expiresAt: data.expiresAt,
        token: data.token,
      }));

      await service.generateToken('creator-1', {
        brandName: 'Test',
        brandEmail: 'test@test.com',
        dealId: 'deal-1',
      });

      const createCall = mockPrisma.brandPortalToken.create.mock.calls[0][0].data;
      const expectedMs = 30 * 24 * 60 * 60 * 1000;
      expect(createCall.expiresAt.getTime()).toBeGreaterThan(Date.now() + expectedMs - 5000);
    });

    it('throws NotFoundException when dealId belongs to another creator', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'other-creator' });

      await expect(
        service.generateToken('creator-1', {
          brandName: 'X',
          brandEmail: 'x@x.com',
          dealId: 'deal-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('audit-logs the generation event', async () => {
      mockPrisma.deal.findUnique.mockResolvedValue({ id: 'deal-1', creatorId: 'creator-1' });
      mockPrisma.brandPortalToken.create.mockResolvedValue(makeToken());

      await service.generateToken('creator-1', {
        brandName: 'B',
        brandEmail: 'b@b.com',
        dealId: 'deal-1',
      });

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'portal_token_generated' }),
      );
    });
  });

  // ── Token Revocation ─────────────────────────────────────────

  describe('revokeToken', () => {
    it('sets isRevoked = true on the token', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.brandPortalToken.update.mockResolvedValue(makeToken({ isRevoked: true }));

      await service.revokeToken('token-record-1', 'creator-1');

      expect(mockPrisma.brandPortalToken.update).toHaveBeenCalledWith({
        where: { id: 'token-record-1' },
        data: { isRevoked: true },
      });
    });

    it('throws NotFoundException when token belongs to another creator', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(
        makeToken({ creatorId: 'other-creator' }),
      );

      await expect(service.revokeToken('token-record-1', 'creator-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when token is already revoked', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken({ isRevoked: true }));

      await expect(service.revokeToken('token-record-1', 'creator-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── Token Verification ────────────────────────────────────────

  describe('verifyToken', () => {
    it('returns PortalContext for a valid token', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.brandPortalToken.update.mockResolvedValue({});

      const { context } = await service.verifyToken('test-uuid-opaque-token');

      expect(context.brandName).toBe('Acme Corp');
      expect(context.dealTitle).toBe('Summer Campaign');
      // Must NOT expose dealId
      expect((context as any).dealId).toBeUndefined();
    });

    it('verifies signed JWT and extracts jti to lookup token', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.brandPortalToken.update.mockResolvedValue({});

      const { context } = await service.verifyToken('header.payload.signature');

      expect(mockJwt.verifyAsync).toHaveBeenCalledWith('header.payload.signature');
      expect(mockPrisma.brandPortalToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'test-uuid-opaque-token' },
        include: expect.any(Object),
      });
      expect(context.brandName).toBe('Acme Corp');
    });

    it('increments accessCount on each call', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.brandPortalToken.update.mockResolvedValue({});

      await service.verifyToken('test-uuid-opaque-token');

      expect(mockPrisma.brandPortalToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accessCount: { increment: 1 } }),
        }),
      );
    });

    it('throws ForbiddenException when token is not found', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when token is revoked', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken({ isRevoked: true }));

      await expect(service.verifyToken('test-uuid-opaque-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ForbiddenException when token is expired', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(
        makeToken({ expiresAt: new Date(Date.now() - 1000) }), // 1 second in the past
      );

      await expect(service.verifyToken('test-uuid-opaque-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws UnauthorizedException for empty token string', async () => {
      await expect(service.verifyToken('')).rejects.toThrow();
    });
  });

  // ── Approval Status ───────────────────────────────────────────

  describe('setApprovalStatus', () => {
    it('creates a submission when none exists yet', async () => {
      const tokenRecord = makeToken();
      mockPrisma.portalSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.portalSubmission.create.mockResolvedValue({
        id: 'sub-1',
        tokenId: 'token-record-1',
        approvalStatus: PortalApprovalStatus.APPROVED,
        revisionNotes: null,
      });

      const result = await service.setApprovalStatus(tokenRecord, {
        approvalStatus: PortalApprovalStatus.APPROVED,
      });

      expect(result.approvalStatus).toBe(PortalApprovalStatus.APPROVED);
      expect(mockPrisma.portalSubmission.create).toHaveBeenCalled();
    });

    it('updates existing submission when one already exists', async () => {
      const tokenRecord = makeToken();
      const existingSub = {
        id: 'sub-1',
        tokenId: 'token-record-1',
        approvalStatus: PortalApprovalStatus.PENDING_REVIEW,
        revisionNotes: null,
      };
      mockPrisma.portalSubmission.findFirst.mockResolvedValue(existingSub);
      mockPrisma.portalSubmission.update.mockResolvedValue({
        ...existingSub,
        approvalStatus: PortalApprovalStatus.APPROVED_WITH_CHANGES,
        revisionNotes: 'Please revise the CTA',
      });

      await service.setApprovalStatus(tokenRecord, {
        approvalStatus: PortalApprovalStatus.APPROVED_WITH_CHANGES,
        revisionNotes: 'Please revise the CTA',
      });

      expect(mockPrisma.portalSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvalStatus: PortalApprovalStatus.APPROVED_WITH_CHANGES,
            revisionNotes: 'Please revise the CTA',
          }),
        }),
      );
    });
  });

  // ── Comment Authorship ────────────────────────────────────────

  describe('comment authorship', () => {
    it('stamps BRAND author on brand comments', async () => {
      const tokenRecord = makeToken();
      mockPrisma.portalComment.create.mockResolvedValue({
        id: 'comment-1',
        tokenId: 'token-record-1',
        author: PortalCommentAuthor.BRAND,
        body: 'Looks great!',
      });

      await service.addBrandComment(tokenRecord, { body: 'Looks great!' });

      expect(mockPrisma.portalComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ author: PortalCommentAuthor.BRAND }),
      });
    });

    it('stamps CREATOR author on creator comments', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.portalComment.create.mockResolvedValue({
        id: 'comment-2',
        author: PortalCommentAuthor.CREATOR,
        body: 'Here is the updated draft.',
      });

      await service.addCreatorComment('token-record-1', 'creator-1', {
        body: 'Here is the updated draft.',
      });

      expect(mockPrisma.portalComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ author: PortalCommentAuthor.CREATOR }),
      });
    });
  });

  // ── File Validation ───────────────────────────────────────────

  describe('submitBrief file validation', () => {
    it('throws BadRequestException for disallowed MIME type', async () => {
      const tokenRecord = makeToken();
      const maliciousFile = {
        mimetype: 'text/html',
        size: 1024,
        buffer: Buffer.from('<script>alert(1)</script>'),
        originalname: 'attack.html',
      } as any;

      await expect(service.submitBrief(tokenRecord, {}, maliciousFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when file exceeds 20MB', async () => {
      const tokenRecord = makeToken();
      const oversizeFile = {
        mimetype: 'application/pdf',
        size: 25 * 1024 * 1024, // 25MB
        buffer: Buffer.alloc(0),
        originalname: 'large.pdf',
      } as any;

      await expect(service.submitBrief(tokenRecord, {}, oversizeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when neither file nor googleDocUrl is provided', async () => {
      const tokenRecord = makeToken();

      await expect(service.submitBrief(tokenRecord, {})).rejects.toThrow(BadRequestException);
    });
  });
});
