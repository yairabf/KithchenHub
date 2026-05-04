import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequireEntitlement,
} from '../../../common/decorators';
import { EntitlementGuard } from '../../../common/guards';
import { PremiumDemoService } from '../services/premium-demo.service';

@Controller({ path: 'premium/demo', version: '1' })
export class PremiumDemoController {
  constructor(private readonly premiumDemoService: PremiumDemoService) {}

  @Get()
  @UseGuards(EntitlementGuard)
  @RequireEntitlement('premium')
  getPremiumDemo(@CurrentUser() user: CurrentUserPayload) {
    return this.premiumDemoService.getDemoPayload(user.householdId);
  }
}
