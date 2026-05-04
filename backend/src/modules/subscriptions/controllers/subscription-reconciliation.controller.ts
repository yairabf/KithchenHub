import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../common/decorators/current-user.decorator';
import {
  ReconcileCustomerStateInput,
  SubscriptionReconciliationService,
} from '../services/subscription-reconciliation.service';

@Controller({ path: 'subscriptions/reconcile', version: '1' })
export class SubscriptionReconciliationController {
  constructor(
    private readonly subscriptionReconciliationService: SubscriptionReconciliationService,
  ) {}

  @Post(':provider')
  reconcileProviderState(
    @Param('provider') provider: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() payload: ReconcileCustomerStateInput,
  ) {
    return this.subscriptionReconciliationService.reconcileCustomerState(
      user.userId,
      provider,
      payload,
    );
  }
}
