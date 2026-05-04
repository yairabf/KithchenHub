import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { PREMIUM_STATUS_OVERRIDE_KEY } from './subscriptions.service';
import { SetPremiumOverrideDto } from '../dtos/set-premium-override.dto';

@Injectable()
export class SubscriptionSupportOverridesService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
  ) {}

  async setPremiumOverride(
    actorUserId: string,
    householdId: string,
    payload: SetPremiumOverrideDto,
  ) {
    await this.assertAdminOnHousehold(actorUserId, householdId);

    const expiresAt = this.parseExpiresAt(payload.expiresAt);

    const override =
      await this.subscriptionsRepository.upsertHouseholdEntitlementOverride({
        householdId,
        key: PREMIUM_STATUS_OVERRIDE_KEY,
        isEnabled: payload.isPremium,
        source: 'support',
        reason: payload.reason ?? null,
        expiresAt,
      });

    return {
      householdId: override.householdId,
      key: override.key,
      isPremium: override.isEnabled,
      source: override.source,
      reason: override.reason,
      expiresAt: override.expiresAt?.toISOString() ?? null,
    };
  }

  async clearPremiumOverride(actorUserId: string, householdId: string) {
    await this.assertAdminOnHousehold(actorUserId, householdId);

    await this.subscriptionsRepository.deleteHouseholdEntitlementOverride(
      householdId,
      PREMIUM_STATUS_OVERRIDE_KEY,
    );

    return { cleared: true };
  }

  private parseExpiresAt(expiresAt?: string): Date | null {
    if (!expiresAt) {
      return null;
    }

    const parsed = new Date(expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('expiresAt must be a valid ISO-8601 date');
    }

    return parsed;
  }

  private async assertAdminOnHousehold(actorUserId: string, householdId: string) {
    const membership =
      await this.subscriptionsRepository.findUserMembership(actorUserId);

    if (!membership || membership.householdId !== householdId) {
      throw new ForbiddenException('You are not allowed to manage this household');
    }

    if (membership.role !== 'Admin') {
      throw new ForbiddenException('Only admins can manage premium overrides');
    }
  }
}
