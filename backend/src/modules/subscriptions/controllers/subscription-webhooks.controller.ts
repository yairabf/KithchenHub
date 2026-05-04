import { Body, Controller, Param, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators';
import { SubscriptionWebhooksService } from '../services/subscription-webhooks.service';

@Controller({ path: 'subscriptions/webhooks', version: '1' })
export class SubscriptionWebhooksController {
  constructor(
    private readonly subscriptionWebhooksService: SubscriptionWebhooksService,
  ) {}

  @Public()
  @Post(':provider')
  handleProviderWebhook(
    @Param('provider') provider: string,
    @Body() payload: unknown,
  ) {
    return this.subscriptionWebhooksService.processWebhook(provider, payload);
  }
}
