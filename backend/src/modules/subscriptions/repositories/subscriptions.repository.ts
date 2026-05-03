import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

interface CreateBillingEventInput {
  provider: string;
  providerEventId: string;
  eventType: string;
  providerAppUserId?: string | null;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  householdId?: string | null;
  payload: Prisma.InputJsonValue;
}

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatestSubscriptionForHousehold(householdId: string) {
    return this.prisma.householdSubscription.findFirst({
      where: { householdId },
      orderBy: [
        { currentPeriodEndsAt: 'desc' },
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findEntitlementOverridesForHousehold(householdId: string) {
    return this.prisma.householdEntitlementOverride.findMany({
      where: { householdId },
      orderBy: { key: 'asc' },
    });
  }

  async findBillingEvent(provider: string, providerEventId: string) {
    return this.prisma.billingProviderEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider,
          providerEventId,
        },
      },
    });
  }

  async createBillingEvent(input: CreateBillingEventInput) {
    return this.prisma.billingProviderEvent.create({
      data: {
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        providerAppUserId: input.providerAppUserId ?? null,
        providerCustomerId: input.providerCustomerId ?? null,
        providerSubscriptionId: input.providerSubscriptionId ?? null,
        householdId: input.householdId ?? null,
        payload: input.payload,
      },
    });
  }
}
