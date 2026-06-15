import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import type { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const data: Prisma.AuditLogUncheckedCreateInput = {
        userId: entry.userId ?? null,
        action: entry.action,
        resource: entry.resource ?? null,
        resourceId: entry.resourceId ?? null,
        metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress?.slice(0, 45) ?? null,
        userAgent: entry.userAgent?.slice(0, 500) ?? null,
      };
      await this.prisma.auditLog.create({ data });
    } catch {
      // Non-fatal — audit log failure must never break the main flow
      console.warn('[AuditLog] Failed to write log entry:', entry.action);
    }
  }
}
