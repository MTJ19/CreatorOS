import { randomUUID } from 'crypto';

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PortalPermission, PortalCommentAuthor, DeliverableStatus } from '@prisma/client';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

import {
  GeneratePortalTokenDto,
  SubmitBriefDto,
  SetApprovalStatusDto,
  AddBrandCommentDto,
  AddCreatorCommentDto,
} from './brand-portal.dto';

/** What the public portal consumer sees — never exposes dealId directly. */
export interface PortalContext {
  tokenId: string;
  brandName: string;
  brandEmail: string;
  brandNote: string | null;
  permissions: PortalPermission[];
  expiresAt: Date;
  dealTitle: string | null;
  creatorDisplayName: string | null;
  deliverables: {
    id: string;
    type: string;
    status: string;
    description: string | null;
    dueDate: Date;
  }[];
  submission: {
    approvalStatus: string;
    revisionNotes: string | null;
    briefFileUrl: string | null;
    briefGoogleDocUrl: string | null;
    submittedAt: Date | null;
  } | null;
  comments: {
    id: string;
    author: PortalCommentAuthor;
    body: string;
    createdAt: Date;
  }[];
}

@Injectable()
export class BrandPortalService {
  private readonly logger = new Logger(BrandPortalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
    private readonly storage: StorageService,
    private readonly jwtService: JwtService,
  ) {}

  // ── CREATOR-SIDE METHODS ─────────────────────────────────────

  /** Generate a new opaque portal token for a deal. */
  async generateToken(creatorId: string, dto: GeneratePortalTokenDto) {
    // Validate dealId ownership if provided
    if (dto.dealId) {
      const deal = await this.prisma.deal.findUnique({ where: { id: dto.dealId } });
      if (!deal || deal.creatorId !== creatorId) {
        throw new NotFoundException(`Deal ${dto.dealId} not found`);
      }
    }

    const expiresInDays = dto.expiresInDays ?? 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    const rawToken = randomUUID(); // opaque, no deal info encoded in DB representation

    const record = await this.prisma.brandPortalToken.create({
      data: {
        creatorId,
        dealId: dto.dealId ?? null,
        token: rawToken,
        brandName: dto.brandName,
        brandEmail: dto.brandEmail,
        brandNote: dto.brandNote ?? null,
        permissions: dto.permissions ?? [PortalPermission.APPROVE_CONTENT],
        expiresAt,
      },
      include: { deal: { select: { id: true, title: true, brandName: true } } },
    });

    // Sign the JWT wrapper
    const jwt = await this.jwtService.signAsync(
      {
        jti: rawToken,
        dealId: dto.dealId ?? null,
        brandEmail: dto.brandEmail,
      },
      {
        expiresIn: `${expiresInDays}d`,
      },
    );

    await this.auditLog.log({
      action: 'portal_token_generated',
      userId: creatorId,
      resource: 'BrandPortalToken',
      resourceId: record.id,
      metadata: { brandName: dto.brandName, brandEmail: dto.brandEmail, expiresAt },
    });

    this.logger.log(`Portal token generated: ${record.id} for creator ${creatorId}`);

    // Return the signed JWT wrapper once — after this it is only stored as-is for lookup
    return {
      id: record.id,
      token: jwt, // the share-able value; only returned here
      brandName: record.brandName,
      brandEmail: record.brandEmail,
      brandNote: record.brandNote,
      permissions: record.permissions,
      expiresAt: record.expiresAt,
      deal: record.deal,
      portalUrl: `${this.config.get('NEXT_PUBLIC_APP_URL', 'http://localhost:3000')}/portal/${jwt}`,
    };
  }

  /** Revoke a portal token (creator only). */
  async revokeToken(tokenId: string, creatorId: string) {
    const record = await this.prisma.brandPortalToken.findUnique({ where: { id: tokenId } });
    if (!record || record.creatorId !== creatorId) {
      throw new NotFoundException(`Token ${tokenId} not found`);
    }
    if (record.isRevoked) {
      throw new BadRequestException('Token is already revoked');
    }

    const updated = await this.prisma.brandPortalToken.update({
      where: { id: tokenId },
      data: { isRevoked: true },
    });

    await this.auditLog.log({
      action: 'portal_token_revoked',
      userId: creatorId,
      resource: 'BrandPortalToken',
      resourceId: tokenId,
      metadata: { brandName: record.brandName },
    });

    this.logger.log(`Portal token revoked: ${tokenId}`);
    return updated;
  }

  /** List all active (non-revoked) tokens for a creator. */
  async listTokens(creatorId: string) {
    return this.prisma.brandPortalToken.findMany({
      where: { creatorId, isRevoked: false },
      include: {
        deal: { select: { id: true, title: true, brandName: true, stage: true } },
        submissions: { orderBy: { submittedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get activity (submissions + comments) for a creator's token. */
  async getTokenActivity(tokenId: string, creatorId: string) {
    const record = await this.prisma.brandPortalToken.findUnique({
      where: { id: tokenId },
      include: {
        deal: { select: { id: true, title: true, brandName: true } },
        submissions: { orderBy: { updatedAt: 'desc' } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!record || record.creatorId !== creatorId) {
      throw new NotFoundException(`Token ${tokenId} not found`);
    }
    return record;
  }

  /** Creator adds a comment visible to the brand. */
  async addCreatorComment(tokenId: string, creatorId: string, dto: AddCreatorCommentDto) {
    const record = await this.prisma.brandPortalToken.findUnique({ where: { id: tokenId } });
    if (!record || record.creatorId !== creatorId) {
      throw new NotFoundException(`Token ${tokenId} not found`);
    }
    if (record.isRevoked) {
      throw new ForbiddenException('Portal token is revoked');
    }

    const comment = await this.prisma.portalComment.create({
      data: { tokenId, author: PortalCommentAuthor.CREATOR, body: dto.body },
    });

    await this.auditLog.log({
      action: 'portal_creator_comment_added',
      userId: creatorId,
      resource: 'BrandPortalToken',
      resourceId: tokenId,
      metadata: { commentId: comment.id },
    });

    return comment;
  }

  // ── PUBLIC PORTAL METHODS (token-authenticated) ──────────────

  /**
   * Verify a raw portal token from an incoming request.
   * Returns the `PortalContext` — never includes dealId directly.
   * Increments access count on each call.
   */
  async verifyToken(rawToken: string): Promise<{ tokenRecord: any; context: PortalContext }> {
    if (!rawToken || rawToken.length < 10) {
      throw new UnauthorizedException('No portal token provided');
    }

    let uuid = rawToken;
    if (rawToken.includes('.')) {
      try {
        const payload = await this.jwtService.verifyAsync(rawToken);
        uuid = payload.jti;
      } catch (err: any) {
        throw new ForbiddenException('Invalid or expired portal token');
      }
    }

    if (!uuid) {
      throw new ForbiddenException('Invalid portal token');
    }

    const record = await this.prisma.brandPortalToken.findUnique({
      where: { token: uuid },
      include: {
        deal: {
          select: {
            title: true,
            brandName: true,
            deliverables: {
              select: {
                id: true,
                type: true,
                status: true,
                description: true,
                dueDate: true,
              },
            },
          },
        },
        creator: { select: { name: true, email: true } },
        submissions: { orderBy: { updatedAt: 'desc' }, take: 1 },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!record) {
      throw new ForbiddenException('Invalid portal token');
    }
    if (record.isRevoked) {
      throw new ForbiddenException('This portal link has been revoked');
    }
    if (record.expiresAt < new Date()) {
      throw new ForbiddenException('This portal link has expired');
    }

    // Increment access counter + last accessed timestamp
    await this.prisma.brandPortalToken.update({
      where: { id: record.id },
      data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
    });

    await this.auditLog.log({
      action: 'portal_accessed',
      userId: record.creatorId, // attributed to creator for audit trail
      resource: 'BrandPortalToken',
      resourceId: record.id,
      metadata: { brandEmail: record.brandEmail },
    });

    const latestSubmission = record.submissions[0] ?? null;

    const context: PortalContext = {
      tokenId: record.id,
      brandName: record.brandName,
      brandEmail: record.brandEmail,
      brandNote: record.brandNote,
      permissions: record.permissions,
      expiresAt: record.expiresAt,
      dealTitle: record.deal?.title ?? null,
      creatorDisplayName: record.creator?.name ?? null,
      deliverables: record.deal?.deliverables ?? [],
      submission: latestSubmission
        ? {
            approvalStatus: latestSubmission.approvalStatus,
            revisionNotes: latestSubmission.revisionNotes,
            briefFileUrl: latestSubmission.briefFileUrl,
            briefGoogleDocUrl: latestSubmission.briefGoogleDocUrl,
            submittedAt: latestSubmission.submittedAt,
          }
        : null,
      comments: record.comments.map((c) => ({
        id: c.id,
        author: c.author,
        body: c.body,
        createdAt: c.createdAt,
      })),
    };

    return { tokenRecord: record, context };
  }

  /** Brand submits/updates brief via portal (file or Google Doc link). */
  async submitBrief(tokenRecord: any, dto: SubmitBriefDto, file?: any) {
    const { id: tokenId } = tokenRecord;

    // Validate Google Doc URL if provided (no file)
    if (!file && !dto.googleDocUrl) {
      throw new BadRequestException('Provide either a file or a Google Doc URL');
    }

    let briefFileUrl: string | undefined;
    let briefFileKey: string | undefined;

    if (file) {
      // Validate MIME type (strict allowlist: PDF, DOCX, DOC)
      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only PDF and DOCX files are allowed.');
      }
      if (file.size > 20 * 1024 * 1024) {
        throw new BadRequestException('File exceeds 20MB limit.');
      }

      // Magic Bytes Header Verification for basic file type validation
      const header = file.buffer.slice(0, 8).toString('hex').toLowerCase();
      const isPdf = header.startsWith('25504446'); // %PDF
      const isDocx = header.startsWith('504b0304'); // PK\x03\x04 (zip)
      const isDoc = header.startsWith('d0cf11e0a1b11ae1'); // Compound File Binary (DOC)

      if (!isPdf && !isDocx && !isDoc) {
        throw new BadRequestException(
          'Invalid file signature. File contents do not match allowed formats (PDF/DOCX/DOC).',
        );
      }

      // Sanitize original filename to prevent relative path exploits (path traversal)
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9.\-_]/g, '_')
        .replace(/\.{2,}/g, '.');

      const result = await this.storage.uploadFile(
        {
          buffer: file.buffer,
          originalname: sanitizedName,
          mimetype: file.mimetype,
        },
        `portal-briefs/${tokenId}`,
      );
      briefFileUrl = result.fileUrl;
      briefFileKey = result.fileKey;
    }

    // Upsert submission (one submission per token, updated on re-submit)
    const existing = await this.prisma.portalSubmission.findFirst({ where: { tokenId } });

    const submission = existing
      ? await this.prisma.portalSubmission.update({
          where: { id: existing.id },
          data: {
            briefFileUrl: briefFileUrl ?? existing.briefFileUrl ?? null,
            briefFileKey: briefFileKey ?? existing.briefFileKey ?? null,
            briefGoogleDocUrl: dto.googleDocUrl ?? existing.briefGoogleDocUrl ?? null,
            revisionNotes: dto.revisionNotes ?? existing.revisionNotes ?? null,
          },
        })
      : await this.prisma.portalSubmission.create({
          data: {
            token: { connect: { id: tokenId } },
            briefFileUrl: briefFileUrl ?? null,
            briefFileKey: briefFileKey ?? null,
            briefGoogleDocUrl: dto.googleDocUrl ?? null,
            revisionNotes: dto.revisionNotes ?? null,
          },
        });

    await this.auditLog.log({
      action: 'portal_brief_submitted',
      userId: tokenRecord.creatorId,
      resource: 'BrandPortalToken',
      resourceId: tokenId,
      metadata: { submissionId: submission.id, hasFile: !!file, hasGoogleDoc: !!dto.googleDocUrl },
    });

    return submission;
  }

  /** Brand sets approval status on the portal. */
  async setApprovalStatus(tokenRecord: any, dto: SetApprovalStatusDto) {
    const { id: tokenId } = tokenRecord;

    const existing = await this.prisma.portalSubmission.findFirst({ where: { tokenId } });

    const submission = existing
      ? await this.prisma.portalSubmission.update({
          where: { id: existing.id },
          data: {
            approvalStatus: dto.approvalStatus,
            revisionNotes: dto.revisionNotes ?? existing.revisionNotes,
          },
        })
      : await this.prisma.portalSubmission.create({
          data: {
            token: { connect: { id: tokenId } },
            approvalStatus: dto.approvalStatus,
            revisionNotes: dto.revisionNotes ?? null,
          },
        });

    if (tokenRecord.dealId) {
      let deliverableStatus: DeliverableStatus | undefined;
      if (dto.approvalStatus === 'APPROVED') deliverableStatus = 'APPROVED';
      else if (dto.approvalStatus === 'REJECTED') deliverableStatus = 'REVISION_REQUESTED';
      else if (dto.approvalStatus === 'APPROVED_WITH_CHANGES') deliverableStatus = 'REVISION_REQUESTED';

      if (deliverableStatus) {
        await this.prisma.deliverable.updateMany({
          where: { dealId: tokenRecord.dealId },
          data: { status: deliverableStatus },
        });
      }
    }

    await this.auditLog.log({
      action: 'portal_approval_set',
      userId: tokenRecord.creatorId,
      resource: 'BrandPortalToken',
      resourceId: tokenId,
      metadata: { approvalStatus: dto.approvalStatus },
    });

    return submission;
  }

  /** Brand adds a comment on the portal. */
  async addBrandComment(tokenRecord: any, dto: AddBrandCommentDto) {
    const comment = await this.prisma.portalComment.create({
      data: {
        tokenId: tokenRecord.id,
        author: PortalCommentAuthor.BRAND,
        body: dto.body,
      },
    });

    await this.auditLog.log({
      action: 'portal_brand_comment_added',
      userId: tokenRecord.creatorId,
      resource: 'BrandPortalToken',
      resourceId: tokenRecord.id,
      metadata: { commentId: comment.id },
    });

    return comment;
  }

  // ── LEGACY COMPAT ─────────────────────────────────────────────

  /** @deprecated Use listTokens(creatorId) */
  async findTokensByCreator(creatorId: string) {
    return this.listTokens(creatorId);
  }
}
