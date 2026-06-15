import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditLogService } from '../audit-log/audit-log.service';

import { CreatorProfileRepository } from './creator-profile.repository';

import type { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import type { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class CreatorProfileService {
  constructor(
    private readonly repository: CreatorProfileRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Get a creator's profile by their userId */
  async getByUserId(userId: string) {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) throw new NotFoundException('Creator profile not found');
    return profile;
  }

  /** Get profile by profile ID */
  async getById(id: string) {
    const profile = await this.repository.findById(id);
    if (!profile) throw new NotFoundException('Creator profile not found');
    return profile;
  }

  /** Upsert profile — creates on first call, updates thereafter */
  async upsert(
    userId: string,
    dto: CreateCreatorProfileDto | UpdateCreatorProfileDto,
    meta: RequestMeta = {},
  ) {
    const existing = await this.repository.findByUserId(userId);
    const isCreate = !existing;

    const profile = await this.repository.upsert(userId, dto);

    await this.auditLog.log({
      userId,
      action: isCreate ? 'profile.create' : 'profile.update',
      resource: 'CreatorProfile',
      resourceId: profile.id,
      metadata: { fields: Object.keys(dto) },
      ...meta,
    });

    return profile;
  }

  /** Mark onboarding as complete */
  async completeOnboarding(userId: string, meta: RequestMeta = {}) {
    const profile = await this.repository.markOnboardingComplete(userId);

    await this.auditLog.log({
      userId,
      action: 'profile.onboarding_complete',
      resource: 'CreatorProfile',
      resourceId: profile.id,
      ...meta,
    });

    return profile;
  }

  /** Get profile or return null (for auth flows where profile may not exist yet) */
  async findOrNull(userId: string) {
    return this.repository.findByUserId(userId);
  }
}
