import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { AuditLogService } from '../audit-log/audit-log.service';

import { CreatorProfileRepository } from './creator-profile.repository';
import { CreatorProfileService } from './creator-profile.service';


const mockRepo = {
  findByUserId: jest.fn(),
  findById: jest.fn(),
  upsert: jest.fn(),
  markOnboardingComplete: jest.fn(),
};

const mockAudit = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('CreatorProfileService', () => {
  let service: CreatorProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorProfileService,
        { provide: CreatorProfileRepository, useValue: mockRepo },
        { provide: AuditLogService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<CreatorProfileService>(CreatorProfileService);
    jest.clearAllMocks();
  });

  // ── getByUserId ───────────────────────────────────────────────

  describe('getByUserId', () => {
    it('throws NotFoundException when profile not found', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      await expect(service.getByUserId('user-1')).rejects.toThrow(NotFoundException);
    });

    it('returns profile when found', async () => {
      const profile = { id: 'profile-1', userId: 'user-1' };
      mockRepo.findByUserId.mockResolvedValue(profile);
      const result = await service.getByUserId('user-1');
      expect(result).toEqual(profile);
    });
  });

  // ── upsert ────────────────────────────────────────────────────

  describe('upsert', () => {
    it('logs profile.create on first upsert (no existing profile)', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      const profile = { id: 'p1', userId: 'u1' };
      mockRepo.upsert.mockResolvedValue(profile);

      await service.upsert('u1', { bio: 'Hello world' });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'profile.create', userId: 'u1' }),
      );
    });

    it('logs profile.update on subsequent upsert', async () => {
      mockRepo.findByUserId.mockResolvedValue({ id: 'p1', userId: 'u1' });
      const profile = { id: 'p1', userId: 'u1' };
      mockRepo.upsert.mockResolvedValue(profile);

      await service.upsert('u1', { bio: 'Updated bio' });

      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'profile.update', userId: 'u1' }),
      );
    });

    it('returns updated profile', async () => {
      const profile = { id: 'p1', userId: 'u1', bio: 'Hello' };
      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.upsert.mockResolvedValue({ ...profile, bio: 'Updated' });

      const result = await service.upsert('u1', { bio: 'Updated' });
      expect(result.bio).toBe('Updated');
    });
  });

  // ── completeOnboarding ────────────────────────────────────────

  describe('completeOnboarding', () => {
    it('marks onboarding complete and logs event', async () => {
      const profile = { id: 'p1', userId: 'u1', isOnboardingComplete: true };
      mockRepo.markOnboardingComplete.mockResolvedValue(profile);

      await service.completeOnboarding('u1');

      expect(mockRepo.markOnboardingComplete).toHaveBeenCalledWith('u1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'profile.onboarding_complete' }),
      );
    });
  });

  // ── findOrNull ────────────────────────────────────────────────

  describe('findOrNull', () => {
    it('returns null when no profile exists', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      const result = await service.findOrNull('no-user');
      expect(result).toBeNull();
    });
  });
});
