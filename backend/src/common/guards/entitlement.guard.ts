import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CurrentUserPayload } from '../decorators/current-user.decorator';
import { REQUIRE_ENTITLEMENTS_KEY } from '../decorators/require-entitlement.decorator';
import { SubscriptionsService } from '../../modules/subscriptions/services/subscriptions.service';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredEntitlements = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_ENTITLEMENTS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredEntitlements || requiredEntitlements.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.householdId) {
      throw new ForbiddenException('User does not belong to a household');
    }

    if (requiredEntitlements.includes('premium')) {
      const premiumStatus =
        await this.subscriptionsService.getPremiumStatusForHousehold(
          user.householdId,
        );

      if (!premiumStatus.isPremium) {
        throw new ForbiddenException('Premium entitlement required');
      }
    }

    return true;
  }
}
