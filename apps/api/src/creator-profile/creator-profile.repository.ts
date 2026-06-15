import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import type { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class CreatorProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.creatorProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async upsert(userId: string, data: CreateCreatorProfileDto | UpdateCreatorProfileDto) {
    const updateData = this.toUpdateData(data);
    // For create, strip UpdateOperations wrappers — use raw scalars
    const createData = this.toCreateData(userId, data);

    return this.prisma.creatorProfile.upsert({
      where: { userId },
      create: createData,
      update: updateData,
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  async markOnboardingComplete(userId: string) {
    return this.prisma.creatorProfile.upsert({
      where: { userId },
      create: { userId, isOnboardingComplete: true },
      update: { isOnboardingComplete: true },
    });
  }

  async deleteByUserId(userId: string) {
    return this.prisma.creatorProfile.delete({ where: { userId } });
  }

  // ── Private Data Builders ────────────────────────────────────

  /** Build Prisma CreateInput (scalar values only) */
  private toCreateData(
    userId: string,
    dto: CreateCreatorProfileDto | UpdateCreatorProfileDto,
  ): Prisma.CreatorProfileCreateInput {
    return {
      user: { connect: { id: userId } },
      ...(dto.primaryPlatform !== undefined && { primaryPlatform: dto.primaryPlatform }),
      ...(dto.platformHandles !== undefined && {
        platformHandles: dto.platformHandles as unknown as Prisma.InputJsonValue,
      }),
      ...(dto.totalFollowers !== undefined && { totalFollowers: dto.totalFollowers }),
      ...(dto.avgViews !== undefined && { avgViews: dto.avgViews }),
      ...(dto.niche !== undefined && { niche: dto.niche }),
      ...(dto.contentFormats !== undefined && { contentFormats: dto.contentFormats }),
      ...(dto.postingFrequency !== undefined && { postingFrequency: dto.postingFrequency }),
      ...(dto.audienceGeography !== undefined && { audienceGeography: dto.audienceGeography }),
      ...(dto.audienceAgeRange !== undefined && { audienceAgeRange: dto.audienceAgeRange }),
      ...(dto.avgEngagementRate !== undefined && { avgEngagementRate: dto.avgEngagementRate }),
      ...(dto.baseRate !== undefined && { baseRate: dto.baseRate }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.bio !== undefined && { bio: dto.bio ?? null }),
      ...(dto.location !== undefined && { location: dto.location ?? null }),
      ...(dto.website !== undefined && { website: dto.website ?? null }),
      ...(dto.isOnboardingComplete !== undefined && {
        isOnboardingComplete: dto.isOnboardingComplete,
      }),
    };
  }

  /** Build Prisma UpdateInput */
  private toUpdateData(
    dto: CreateCreatorProfileDto | UpdateCreatorProfileDto,
  ): Prisma.CreatorProfileUpdateInput {
    return {
      ...(dto.primaryPlatform !== undefined && { primaryPlatform: dto.primaryPlatform }),
      ...(dto.platformHandles !== undefined && {
        platformHandles: dto.platformHandles as unknown as Prisma.InputJsonValue,
      }),
      ...(dto.totalFollowers !== undefined && { totalFollowers: dto.totalFollowers }),
      ...(dto.avgViews !== undefined && { avgViews: dto.avgViews }),
      ...(dto.niche !== undefined && { niche: dto.niche }),
      ...(dto.contentFormats !== undefined && { contentFormats: dto.contentFormats }),
      ...(dto.postingFrequency !== undefined && { postingFrequency: dto.postingFrequency }),
      ...(dto.audienceGeography !== undefined && { audienceGeography: dto.audienceGeography }),
      ...(dto.audienceAgeRange !== undefined && { audienceAgeRange: dto.audienceAgeRange }),
      ...(dto.avgEngagementRate !== undefined && { avgEngagementRate: dto.avgEngagementRate }),
      ...(dto.baseRate !== undefined && { baseRate: dto.baseRate }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.bio !== undefined && { bio: dto.bio ?? null }),
      ...(dto.location !== undefined && { location: dto.location ?? null }),
      ...(dto.website !== undefined && { website: dto.website ?? null }),
      ...(dto.isOnboardingComplete !== undefined && {
        isOnboardingComplete: dto.isOnboardingComplete,
      }),
    };
  }
}
