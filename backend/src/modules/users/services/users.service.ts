import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { UsersRepository } from '../repositories/users.repository';
import { AuditService } from '../../audit/services/audit.service';
import {
  UserExportDto,
  UserExportSummaryDto,
  HouseholdExportSummaryDto,
  ActivityExportSummaryDto,
} from '../dtos/user-export.dto';
import type { User, Household } from '@prisma/client';
import type { UserExportData } from '../repositories/users.repository';

type UserWithHousehold = User & { household: Household | null };
type HouseholdWithMembers = Household & { users: User[] };

/**
 * Service for user profile operations: account deletion and data export.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private usersRepository: UsersRepository,
    private auditService: AuditService,
  ) {}

  /**
   * Deletes the current user's account and associated data.
   * - If sole household admin: hard-deletes household and all its data.
   * - If admin with other members: promotes oldest member to admin, then removes user.
   * - Revokes refresh tokens, clears idempotency keys, deletes invites created by user, then deletes user.
   * All Prisma writes run in a single transaction for consistency.
   */
  async deleteAccount(userId: string, reason?: string): Promise<void> {
    const user = await this.getUserWithHousehold(userId);
    const { householdId, role, memberCount } =
      await this.resolveHouseholdContext(user);

    if (user.householdId) {
      if (role === 'Admin' && memberCount === 1) {
        await this.auditService.logHouseholdDeletion(user.householdId, {
          userId,
          reason,
        });
      } else if (role === 'Admin' && memberCount > 1) {
        const householdWithMembers = await this.getHouseholdWithMembers(
          user.householdId,
        );
        const otherMembers = householdWithMembers.users.filter(
          (u) => u.id !== userId && u.householdId === user.householdId,
        );
        if (otherMembers.length === 0) {
          this.logger.error('No eligible members to promote to admin', {
            userId,
            householdId: user.householdId,
          });
          throw new Error(
            'No eligible members to promote to admin. Cannot delete account.',
          );
        }
        const nextAdmin = otherMembers[0];
        await this.auditService.logAdminPromotion(userId, user.householdId, {
          promotedUserId: nextAdmin.id,
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (user.householdId) {
        if (role === 'Admin' && memberCount === 1) {
          await this.deleteSoleAdminHousehold(tx, userId, user.householdId);
        } else if (role === 'Admin' && memberCount > 1) {
          await this.promoteNextAdminAndLeaveHousehold(tx, user);
        } else {
          await this.removeUserFromHousehold(tx, userId);
        }
      }

      await this.cleanupUserData(tx, userId);
    });

    try {
      await this.auditService.logAccountDeletion(userId, {
        householdId,
        role,
        memberCount,
        reason,
      });
    } catch (error) {
      this.logger.error('Failed to create audit log for account deletion', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        'Account deletion audit logging failed - operation aborted for compliance',
      );
    }

    this.logger.log('Account deleted', { userId });
  }

  /**
   * Exports all user data for GDPR data portability.
   */
  async exportUserData(userId: string): Promise<UserExportDto> {
    const data = await this.usersRepository.getUserExportData(userId);

    if (!data) {
      throw new NotFoundException('User not found');
    }

    await this.auditService.logDataExport(userId);

    const lastActive = await this.getLastActiveTimestamp(userId);
    const activityMetrics = await this.calculateActivityMetrics(data);

    const userSummary: UserExportSummaryDto = {
      id: data.user.id,
      email: data.user.email ?? undefined,
      name: data.user.name ?? undefined,
      role: data.user.role,
      createdAt: data.user.createdAt,
    };

    const householdSummary: HouseholdExportSummaryDto | null = data.household
      ? {
          id: data.household.id,
          name: data.household.name,
          role: data.household.role,
          joinedAt: data.user.createdAt,
        }
      : null;

    const activitySummary: ActivityExportSummaryDto = {
      totalRecipesCreated: activityMetrics.totalRecipes,
      totalListsCreated: activityMetrics.totalLists,
      totalChoresCompleted: activityMetrics.totalChoresCompleted,
      lastActive,
    };

    return {
      user: userSummary,
      household: householdSummary,
      recipes: data.recipes,
      shoppingLists: data.shoppingLists,
      assignedChores: data.assignedChores,
      activity: activitySummary,
      exportedAt: new Date(),
    };
  }

  private async getUserWithHousehold(
    userId: string,
  ): Promise<UserWithHousehold> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { household: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async resolveHouseholdContext(user: UserWithHousehold): Promise<{
    householdId: string | undefined;
    role: string;
    memberCount: number;
  }> {
    const householdId = user.householdId ?? undefined;
    let memberCount = 0;

    if (user.householdId) {
      const householdWithMembers = await this.getHouseholdWithMembers(
        user.householdId,
      );
      memberCount = householdWithMembers?.users.length ?? 0;
    }

    return {
      householdId,
      role: user.role,
      memberCount,
    };
  }

  private async getHouseholdWithMembers(
    householdId: string,
  ): Promise<HouseholdWithMembers | null> {
    return this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        users: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  private async deleteSoleAdminHousehold(
    tx: Prisma.TransactionClient,
    userId: string,
    householdId: string,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { householdId: null },
    });
    await tx.household.delete({
      where: { id: householdId },
    });
    this.logger.log('Deleted household (sole member)', { householdId });
  }

  private async promoteNextAdminAndLeaveHousehold(
    tx: Prisma.TransactionClient,
    user: UserWithHousehold,
  ): Promise<void> {
    const householdWithMembers = await tx.household.findUnique({
      where: { id: user.householdId! },
      include: { users: { orderBy: { createdAt: 'asc' } } },
    });

    if (!householdWithMembers) {
      throw new Error('Household not found during admin promotion');
    }

    const otherMembers = householdWithMembers.users.filter(
      (u) => u.id !== user.id && u.householdId === user.householdId,
    );

    if (otherMembers.length === 0) {
      throw new Error('No eligible members to promote to admin');
    }

    const nextAdmin = otherMembers[0];

    await tx.user.update({
      where: { id: nextAdmin.id },
      data: { role: 'Admin' },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { householdId: null },
    });

    this.logger.log('Promoted member to admin', {
      householdId: user.householdId,
      promotedUserId: nextAdmin.id,
    });
  }

  private async removeUserFromHousehold(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { householdId: null },
    });
  }

  private async cleanupUserData(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<void> {
    await tx.refreshToken.deleteMany({ where: { userId } });
    await tx.syncIdempotencyKey.deleteMany({ where: { userId } });
    await tx.householdInvite.deleteMany({
      where: { creatorId: userId },
    });
    await tx.user.delete({
      where: { id: userId },
    });
  }

  private async getLastActiveTimestamp(userId: string): Promise<Date> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { updatedAt: true },
    });
    return user?.updatedAt ?? new Date(0);
  }

  private async calculateActivityMetrics(exportData: UserExportData): Promise<{
    totalRecipes: number;
    totalLists: number;
    totalChoresCompleted: number;
  }> {
    const assignedChores = exportData.assignedChores as {
      isCompleted?: boolean;
    }[];
    const totalChoresCompleted = assignedChores.filter(
      (c) => c.isCompleted === true,
    ).length;

    return {
      totalRecipes: exportData.recipes.length,
      totalLists: exportData.shoppingLists.length,
      totalChoresCompleted,
    };
  }
}
