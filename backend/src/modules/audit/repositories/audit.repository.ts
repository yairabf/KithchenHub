import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { AuditLog as PrismaAuditLog, Prisma } from '@prisma/client';
import { DEFAULT_AUDIT_LOG_LIMIT } from '../constants/audit-defaults';

export interface CreateAuditLogInput {
  userId?: string;
  householdId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates an audit log entry.
   */
  async create(input: CreateAuditLogInput): Promise<PrismaAuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        householdId: input.householdId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Finds audit logs for a user, ordered by creation date descending.
   */
  async findByUserId(
    userId: string,
    limit = DEFAULT_AUDIT_LOG_LIMIT,
  ): Promise<PrismaAuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Finds audit logs for a household, ordered by creation date descending.
   */
  async findByHouseholdId(
    householdId: string,
    limit = DEFAULT_AUDIT_LOG_LIMIT,
  ): Promise<PrismaAuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
