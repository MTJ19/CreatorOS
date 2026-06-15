import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { PortalPermission } from '@prisma/client';
import request from 'supertest';

import { AuditLogService } from '../src/audit-log/audit-log.service';
import { BrandPortalModule } from '../src/brand-portal/brand-portal.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { StorageService } from '../src/storage/storage.service';




describe('BrandPortal (e2e)', () => {
  let app: INestApplication;
  
  // Mock implementations
  const mockConfig = {
    get: jest.fn((key: string, def?: any) => def ?? 'http://localhost:3000'),
  };

  const mockPrisma = {
    deal: {
      findUnique: jest.fn(),
    },
    brandPortalToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    portalSubmission: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    portalComment: {
      create: jest.fn(),
    },
  };

  const mockAuditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockStorage = {
    uploadFile: jest.fn().mockResolvedValue({
      fileUrl: 'https://storage/brief.pdf',
      fileKey: 'briefs/token-1',
    }),
  };

  const mockJwt = {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verifyAsync: jest.fn().mockImplementation(async (token) => {
      if (token?.includes('expired')) {
        throw new Error('Expired token');
      }
      return { jti: 'test-uuid-token', brandEmail: 'brand@acme.com' };
    }),
  };

  const makeToken = (overrides: Partial<any> = {}) => ({
    id: 'token-1',
    token: 'test-uuid-token',
    brandName: 'Acme Corp',
    brandEmail: 'brand@acme.com',
    brandNote: 'Greeting',
    permissions: [PortalPermission.APPROVE_CONTENT],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    isRevoked: false,
    creatorId: 'creator-1',
    deal: {
      title: 'Acme Winter Campaign',
      brandName: 'Acme Corp',
      deliverables: [
        {
          id: 'del-1',
          type: 'INSTAGRAM_REEL',
          status: 'PENDING',
          description: 'Intro video',
          dueDate: new Date(),
        },
      ],
    },
    creator: {
      name: 'Jane Doe',
      email: 'jane@creator.com',
    },
    submissions: [],
    comments: [],
    ...overrides,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        BrandPortalModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(AuditLogService)
      .useValue(mockAuditLog)
      .overrideProvider(StorageService)
      .useValue(mockStorage)
      .overrideProvider(JwtService)
      .useValue(mockJwt)
      .overrideProvider(ConfigService)
      .useValue(mockConfig)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Public Brand Portal Tests ──────────────────────────────
  describe('Public Portal Endpoints', () => {
    const validJwt = 'valid.portal.jwt';

    it('GET /portal/context - returns Forbidden when no token header is present', async () => {
      await request(app.getHttpServer())
        .get('/portal/context')
        .expect(401);
    });

    it('GET /portal/context - returns portal context when valid token is supplied', async () => {
      const mockTokenRecord = makeToken();

      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(mockTokenRecord);
      mockPrisma.brandPortalToken.update.mockResolvedValue({ ...mockTokenRecord, accessCount: 1 });

      const response = await request(app.getHttpServer())
        .get('/portal/context')
        .set('x-portal-token', validJwt)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.brandName).toBe('Acme Corp');
      expect(response.body.creatorDisplayName).toBe('Jane Doe');
      expect(response.body.dealTitle).toBe('Acme Winter Campaign');
      expect(response.body.deliverables).toHaveLength(1);
    });

    it('GET /portal/context - returns 403 Forbidden for expired portal token', async () => {
      mockJwt.verifyAsync.mockRejectedValueOnce(new Error('Expired token'));

      await request(app.getHttpServer())
        .get('/portal/context')
        .set('x-portal-token', 'expired.portal.jwt')
        .expect(403);
    });

    it('POST /portal/submit-brief - submits Google Doc URL and notes successfully', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.portalSubmission.findFirst.mockResolvedValue(null);
      mockPrisma.portalSubmission.create.mockResolvedValue({
        id: 'submission-1',
        tokenId: 'token-1',
        briefGoogleDocUrl: 'https://docs.google.com/document/d/123',
        revisionNotes: 'Please check style guide',
      });

      const response = await request(app.getHttpServer())
        .post('/portal/submit-brief')
        .set('x-portal-token', validJwt)
        .send({
          googleDocUrl: 'https://docs.google.com/document/d/123',
          revisionNotes: 'Please check style guide',
        })
        .expect(200);

      expect(response.body.id).toBe('submission-1');
      expect(mockPrisma.portalSubmission.create).toHaveBeenCalled();
    });

    it('PATCH /portal/approval - allows setting approval status', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.portalSubmission.findFirst.mockResolvedValue({ id: 'sub-1', tokenId: 'token-1' });
      mockPrisma.portalSubmission.update.mockResolvedValue({
        id: 'sub-1',
        approvalStatus: 'APPROVED_WITH_CHANGES',
        revisionNotes: 'Looks good but tweak colors',
      });

      const response = await request(app.getHttpServer())
        .patch('/portal/approval')
        .set('x-portal-token', validJwt)
        .send({
          approvalStatus: 'APPROVED_WITH_CHANGES',
          revisionNotes: 'Looks good but tweak colors',
        })
        .expect(200);

      expect(response.body.approvalStatus).toBe('APPROVED_WITH_CHANGES');
      expect(mockPrisma.portalSubmission.update).toHaveBeenCalled();
    });

    it('POST /portal/comments - brand adds comment to portal thread', async () => {
      mockPrisma.brandPortalToken.findUnique.mockResolvedValue(makeToken());
      mockPrisma.portalComment.create.mockResolvedValue({
        id: 'comment-1',
        tokenId: 'token-1',
        author: 'BRAND',
        body: 'Can we change the deadline?',
      });

      const response = await request(app.getHttpServer())
        .post('/portal/comments')
        .set('x-portal-token', validJwt)
        .send({
          body: 'Can we change the deadline?',
        })
        .expect(201);

      expect(response.body.author).toBe('BRAND');
      expect(response.body.body).toBe('Can we change the deadline?');
    });
  });
});
