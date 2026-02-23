import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Chore } from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

@Injectable()
export class ChoresRepository {
  private readonly logger = new Logger(ChoresRepository.name);

  constructor(private prisma: PrismaService) {}

  async findChoresByHousehold(
    householdId: string,
    filters?: { start?: Date; end?: Date },
  ): Promise<(Chore & { assignee: { name: string } | null })[]> {
    const where: any = {
      householdId,
      ...ACTIVE_RECORDS_FILTER,
    };

    if (filters?.start || filters?.end) {
      where.dueDate = {};
      if (filters.start) {
        where.dueDate.gte = filters.start;
      }
      if (filters.end) {
        where.dueDate.lte = filters.end;
      }
    }

    return this.prisma.chore.findMany({
      where,
      include: {
        assignee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findChoreById(id: string): Promise<Chore | null> {
    return this.prisma.chore.findUnique({
      where: { id },
    });
  }

  async createChore(
    householdId: string,
    data: {
      title: string;
      icon?: string;
      assigneeId?: string;
      dueDate?: Date;
      repeat?: string;
    },
  ): Promise<Chore> {
    return this.prisma.chore.create({
      data: {
        householdId,
        title: data.title,
        icon: data.icon,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        repeat: data.repeat,
      },
    });
  }

  async updateChore(
    id: string,
    data: {
      title?: string;
      icon?: string;
      assigneeId?: string;
      dueDate?: Date;
    },
  ): Promise<Chore> {
    return this.prisma.chore.update({
      where: { id },
      data,
    });
  }

  async toggleCompletion(id: string, isCompleted: boolean): Promise<Chore> {
    return this.prisma.chore.update({
      where: { id },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });
  }

  async countChoresByHousehold(
    householdId: string,
    filters?: { date?: Date },
  ): Promise<{ total: number; completed: number }> {
    const where: any = {
      householdId,
      ...ACTIVE_RECORDS_FILTER,
    };

    if (filters?.date) {
      where.dueDate = {
        lte: filters.date,
      };
    }

    const [total, completed] = await Promise.all([
      this.prisma.chore.count({ where }),
      this.prisma.chore.count({
        where: {
          ...where,
          isCompleted: true,
        },
      }),
    ]);

    return { total, completed };
  }

  /**
   * Hard-deletes a chore from the database.
   *
   * @param id - Chore ID to delete permanently
   */
  async deleteChore(id: string): Promise<void> {
    this.logger.log('Hard-deleting chore', {
      action: 'HARD_DELETE_CHORE',
      entityType: 'CHORE',
      entityId: id,
      timestamp: new Date().toISOString(),
    });
    await this.prisma.chore.delete({
      where: { id },
    });
  }

  /**
   * Restores a soft-deleted chore.
   *
   * @param id - Chore ID to restore
   */
  async restoreChore(id: string): Promise<void> {
    this.logger.log('Restoring chore', {
      action: 'RESTORE_CHORE',
      entityType: 'CHORE',
      entityId: id,
      timestamp: new Date().toISOString(),
    });
    await this.prisma.chore.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
