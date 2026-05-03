import { Injectable } from '@nestjs/common';
import { SubscriptionSummaryDto } from '../dtos';
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  PREMIUM_PLAN_ENTITLEMENTS,
  PREMIUM_PLAN_KEY,
  createDefaultFreeSubscriptionSummary,
} from '../constants/subscription-entitlements';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async getSummaryForHousehold(
    householdId?: string | null,
  ): Promise<SubscriptionSummaryDto> {
    if (!householdId) {
      return createDefaultFreeSubscriptionSummary();
    }

    const [subscription, entitlementRows] = await Promise.all([
      this.subscriptionsRepository.findLatestSubscriptionForHousehold(householdId),
      this.subscriptionsRepository.findEntitlementsForHousehold(householdId),
    ]);

    if (!subscription) {
      return createDefaultFreeSubscriptionSummary();
    }

    const isPremiumPlan = subscription.planKey === PREMIUM_PLAN_KEY;
    const isActivePremium =
      isPremiumPlan &&
      ACTIVE_SUBSCRIPTION_STATUSES.includes(
        subscription.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number],
      );

    const entitlements = new Set<string>(
      isActivePremium ? [...PREMIUM_PLAN_ENTITLEMENTS] : [],
    );

    for (const row of entitlementRows) {
      if (row.isEnabled) {
        entitlements.add(row.key);
      } else {
        entitlements.delete(row.key);
      }
    }

    return {
      planKey: subscription.planKey,
      status: subscription.status,
      entitlements: Array.from(entitlements).sort(),
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      currentPeriodEndsAt:
        subscription.currentPeriodEndsAt?.toISOString() ?? null,
    };
  }
}
