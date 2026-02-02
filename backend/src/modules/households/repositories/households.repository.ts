import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Household, User } from '@prisma/client';

@Injectable()
export class HouseholdsRepository {
  constructor(private prisma: PrismaService) {}

  async findHouseholdById(id: string): Promise<Household | null> {
    return this.prisma.household.findUnique({
      where: { id },
    });
  }

  async findHouseholdWithMembers(id: string): Promise<
    Household & {
      users: User[];
    }
  > {
    return this.prisma.household.findUnique({
      where: { id },
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
