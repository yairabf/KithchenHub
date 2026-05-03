import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestSubscriptionForHousehold(householdId: string) {
    return this.prisma.householdSubscription.findFirst({
      where: { householdId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findEntitlementsForHousehold(householdId: string) {
    return this.prisma.householdEntitlement.findMany({
      where: { householdId },
      orderBy: { key: 'asc' },
    });
  }
}
