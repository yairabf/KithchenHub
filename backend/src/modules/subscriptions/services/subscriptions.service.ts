import { Injectable } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

export const PREMIUM_PLAN_KEY = 'premium';
export const PREMIUM_STATUS_OVERRIDE_KEY = 'premium_status';

interface GetPremiumStatusOptions {
  now?: Date;
}

interface PremiumOverrideSummary {
  isPremium: boolean;
  expiresAt: string | null;
}

export interface HouseholdPremiumStatusSummary {
  isPremium: boolean;
  status:
    | 'inactive'
    | 'trialing'
    | 'active'
    | 'expired'
    | 'override_on'
    | 'override_off';
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  override: PremiumOverrideSummary | null;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async getPremiumStatusForHousehold(
    householdId?: string | null,
    options: GetPremiumStatusOptions = {},
  ): Promise<HouseholdPremiumStatusSummary> {
    if (!householdId) {
      return this.createInactiveSummary();
    }

    const now = options.now ?? new Date();
    const [subscription, overrides] = await Promise.all([
      this.subscriptionsRepository.findLatestSubscriptionForHousehold(
        householdId,
      ),
      this.subscriptionsRepository.findEntitlementOverridesForHousehold(
        householdId,
      ),
    ]);

    const premiumOverride = overrides.find((override) => {
      if (override.key !== PREMIUM_STATUS_OVERRIDE_KEY) {
        return false;
      }

      return !override.expiresAt || override.expiresAt > now;
    });

    const trialEndsAt = subscription?.trialEndsAt?.toISOString() ?? null;
    const currentPeriodEndsAt =
      subscription?.currentPeriodEndsAt?.toISOString() ?? null;

    if (premiumOverride) {
      return {
        isPremium: premiumOverride.isEnabled,
        status: premiumOverride.isEnabled ? 'override_on' : 'override_off',
        trialEndsAt,
        currentPeriodEndsAt,
        override: {
          isPremium: premiumOverride.isEnabled,
          expiresAt: premiumOverride.expiresAt?.toISOString() ?? null,
        },
      };
    }

    if (!subscription || subscription.planKey !== PREMIUM_PLAN_KEY) {
      return this.createInactiveSummary();
    }

    if (
      subscription.status === 'trialing' &&
      subscription.trialEndsAt &&
      subscription.trialEndsAt > now
    ) {
      return {
        isPremium: true,
        status: 'trialing',
        trialEndsAt,
        currentPeriodEndsAt,
        override: null,
      };
    }

    if (
      subscription.status === 'active' &&
      subscription.currentPeriodEndsAt &&
      subscription.currentPeriodEndsAt > now
    ) {
      return {
        isPremium: true,
        status: 'active',
        trialEndsAt,
        currentPeriodEndsAt,
        override: null,
      };
    }

    if (
      subscription.status === 'trialing' ||
      subscription.status === 'active' ||
      subscription.status === 'past_due' ||
      subscription.status === 'canceled'
    ) {
      return {
        isPremium: false,
        status: 'expired',
        trialEndsAt,
        currentPeriodEndsAt,
        override: null,
      };
    }

    return {
      isPremium: false,
      status: 'inactive',
      trialEndsAt,
      currentPeriodEndsAt,
      override: null,
    };
  }

  private createInactiveSummary(): HouseholdPremiumStatusSummary {
    return {
      isPremium: false,
      status: 'inactive',
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      override: null,
    };
  }
}
