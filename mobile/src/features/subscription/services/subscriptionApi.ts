import { api } from '../../../services/api';
import type { SubscriptionCustomerState } from './purchaseService';

export interface ReconcileCustomerStateResponse {
  accepted: boolean;
  reconciled: boolean;
}

export const subscriptionApi = {
  reconcileCustomerState: (
    provider: 'revenuecat',
    customerState: SubscriptionCustomerState,
  ): Promise<ReconcileCustomerStateResponse> =>
    api.post<ReconcileCustomerStateResponse>(
      `/subscriptions/reconcile/${provider}`,
      customerState,
    ),
};
