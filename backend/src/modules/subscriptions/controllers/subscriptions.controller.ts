import { Controller, Get } from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { SubscriptionsService } from '../services/subscriptions.service';

@Controller({ path: 'subscription', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.getSummaryForHousehold(user.householdId);
  }
}
