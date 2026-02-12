import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Household, User } from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

@Injectable()
export class HouseholdsRepository {
  constructor(private prisma: PrismaService) {}

  async findHouseholdById(id: string): Promise<Household | null> {
    return this.prisma.household.findFirst({
      where: {
        id,
        ...ACTIVE_RECORDS_FILTER,
      },
    });
  }

  async findHouseholdWithMembers(id: string): Promise<
    Household & {
      users: User[];
    }
  > {
    return this.prisma.household.findFirst({
      where: {
        id,
        ...ACTIVE_RECORDS_FILTER,
      },
      include: {
        users: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateHousehold(
    id: string,
    data: { name?: string },
  ): Promise<Household> {
    return this.prisma.household.update({
      where: { id },
      data,
    });
  }

  async createHousehold(name: string, id?: string): Promise<Household> {
    return this.prisma.household.create({
      data: id ? { id, name } : { name },
    });
  }

  async removeUserFromHousehold(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { householdId: null },
    });
  }
}
