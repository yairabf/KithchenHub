import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import { SetPremiumOverrideDto } from '../dtos/set-premium-override.dto';
import { SubscriptionSupportOverridesService } from '../services/subscription-support-overrides.service';

@Controller({ path: 'subscriptions/support', version: '1' })
export class SubscriptionSupportOverridesController {
  constructor(
    private readonly subscriptionSupportOverridesService: SubscriptionSupportOverridesService,
  ) {}

  @Post('households/:householdId/premium-override')
  setPremiumOverride(
    @Param('householdId') householdId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() payload: SetPremiumOverrideDto,
  ) {
    return this.subscriptionSupportOverridesService.setPremiumOverride(
      user.userId,
      householdId,
      payload,
    );
  }

  @Delete('households/:householdId/premium-override')
  clearPremiumOverride(
    @Param('householdId') householdId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.subscriptionSupportOverridesService.clearPremiumOverride(
      user.userId,
      householdId,
    );
  }
}
