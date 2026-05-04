import { BadRequestException, Injectable } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';

export interface ReconcileCustomerStateInput {
  appUserId: string | null;
  originalAppUserId: string | null;
  activeEntitlementIds: string[];
  activeSubscriptionProductIds: string[];
  latestExpirationDate: string | null;
}

export interface ReconcileCustomerStateResult {
  accepted: boolean;
  reconciled: boolean;
}

@Injectable()
export class SubscriptionReconciliationService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async reconcileCustomerState(
    userId: string,
    provider: string,
    customerState: ReconcileCustomerStateInput,
  ): Promise<ReconcileCustomerStateResult> {
    if (provider !== 'revenuecat') {
      throw new BadRequestException(
        `Unsupported billing provider: ${provider}`,
      );
    }

    const householdId =
      await this.subscriptionsRepository.findUserHouseholdId(userId);
    if (!householdId) {
      return { accepted: false, reconciled: false };
    }

    const isPremium = customerState.activeEntitlementIds.includes('premium');
    const productId = customerState.activeSubscriptionProductIds[0] ?? null;

    await this.subscriptionsRepository.upsertHouseholdSubscription({
      householdId,
      purchaserUserId: userId,
      planKey: 'premium',
      provider,
      status: isPremium ? 'active' : 'expired',
      billingInterval: this.resolveBillingInterval(productId),
      providerAppUserId: customerState.appUserId,
      providerCustomerId: customerState.originalAppUserId,
      providerProductId: productId,
      providerEntitlementKey: isPremium ? 'premium' : null,
      currentPeriodEndsAt: customerState.latestExpirationDate
        ? new Date(customerState.latestExpirationDate)
        : null,
    });

    return { accepted: true, reconciled: true };
  }

  private resolveBillingInterval(productId: string | null): string | null {
    if (!productId) {
      return null;
    }

    const normalizedProductId = productId.toLowerCase();
    if (
      normalizedProductId.includes('year') ||
      normalizedProductId.includes('annual')
    ) {
      return 'yearly';
    }

    if (normalizedProductId.includes('month')) {
      return 'monthly';
    }

    return null;
  }
}
