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

interface UpsertHouseholdSubscriptionInput {
  householdId: string;
  purchaserUserId?: string | null;
  planKey: string;
  billingInterval?: string | null;
  status: string;
  provider: string;
  store?: string | null;
  providerAppUserId?: string | null;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  providerProductId?: string | null;
  providerEntitlementKey?: string | null;
  providerEnvironment?: string | null;
  isTrial?: boolean;
  trialStartsAt?: Date | null;
  trialEndsAt?: Date | null;
  currentPeriodStartsAt?: Date | null;
  currentPeriodEndsAt?: Date | null;
  cancelAtPeriodEnd?: boolean | null;
  canceledAt?: Date | null;
  endsAt?: Date | null;
}

interface UpsertHouseholdEntitlementOverrideInput {
  householdId: string;
  key: string;
  isEnabled: boolean;
  source: string;
  reason?: string | null;
  expiresAt?: Date | null;
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

  async findUserMembership(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { householdId: true, role: true },
    });

    if (!user || !user.householdId) {
      return null;
    }

    return {
      householdId: user.householdId,
      role: user.role,
    };
  }

  async findUserHouseholdId(userId: string) {
    const membership = await this.findUserMembership(userId);
    return membership?.householdId ?? null;
  }

  async upsertHouseholdSubscription(input: UpsertHouseholdSubscriptionInput) {
    const baseData = {
      householdId: input.householdId,
      purchaserUserId: input.purchaserUserId ?? null,
      planKey: input.planKey,
      billingInterval: input.billingInterval ?? null,
      status: input.status,
      provider: input.provider,
      store: input.store ?? null,
      providerAppUserId: input.providerAppUserId ?? null,
      providerCustomerId: input.providerCustomerId ?? null,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      providerProductId: input.providerProductId ?? null,
      providerEntitlementKey: input.providerEntitlementKey ?? null,
      providerEnvironment: input.providerEnvironment ?? null,
      isTrial: input.isTrial ?? false,
      trialStartsAt: input.trialStartsAt ?? null,
      trialEndsAt: input.trialEndsAt ?? null,
      currentPeriodStartsAt: input.currentPeriodStartsAt ?? null,
      currentPeriodEndsAt: input.currentPeriodEndsAt ?? null,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? null,
      canceledAt: input.canceledAt ?? null,
      endsAt: input.endsAt ?? null,
      lastSyncedAt: new Date(),
    };

    if (input.providerSubscriptionId) {
      return this.prisma.householdSubscription.upsert({
        where: {
          provider_providerSubscriptionId: {
            provider: input.provider,
            providerSubscriptionId: input.providerSubscriptionId,
          },
        },
        create: baseData,
        update: baseData,
      });
    }

    return this.prisma.householdSubscription.create({
      data: baseData,
    });
  }

  async upsertHouseholdEntitlementOverride(
    input: UpsertHouseholdEntitlementOverrideInput,
  ) {
    return this.prisma.householdEntitlementOverride.upsert({
      where: {
        householdId_key: {
          householdId: input.householdId,
          key: input.key,
        },
      },
      create: {
        householdId: input.householdId,
        key: input.key,
        isEnabled: input.isEnabled,
        source: input.source,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
      update: {
        isEnabled: input.isEnabled,
        source: input.source,
        reason: input.reason ?? null,
        expiresAt: input.expiresAt ?? null,
      },
    });
  }

  async deleteHouseholdEntitlementOverride(householdId: string, key: string) {
    await this.prisma.householdEntitlementOverride.deleteMany({
      where: {
        householdId,
        key,
      },
    });
  }

  async markBillingEventProcessed(eventId: string) {
    return this.prisma.billingProviderEvent.update({
      where: { id: eventId },
      data: {
        processedAt: new Date(),
        processingError: null,
      },
    });
  }

  async markBillingEventFailed(eventId: string, errorMessage: string) {
    return this.prisma.billingProviderEvent.update({
      where: { id: eventId },
      data: {
        processingError: errorMessage,
      },
    });
  }
}
