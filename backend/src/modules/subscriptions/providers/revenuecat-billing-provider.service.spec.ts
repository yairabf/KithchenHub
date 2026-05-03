import { BadRequestException } from '@nestjs/common';
import { RevenueCatBillingProviderService } from './revenuecat-billing-provider.service';

describe('RevenueCatBillingProviderService', () => {
  let service: RevenueCatBillingProviderService;

  beforeEach(() => {
    service = new RevenueCatBillingProviderService();
  });

  it('normalizes a RevenueCat webhook event payload', () => {
    const normalized = service.parseWebhookEvent({
      event: {
        id: 'event-1',
        type: 'INITIAL_PURCHASE',
        app_user_id: 'app-user-1',
        original_app_user_id: 'original-user-1',
        aliases: ['alias-1'],
        entitlement_ids: ['premium'],
        product_id: 'kitchenhub_premium_monthly',
        store: 'APP_STORE',
        subscriber: {
          original_app_user_id: 'original-user-1',
          original_application_version: '1',
          first_seen: '2026-05-01T00:00:00.000Z',
          last_seen: '2026-05-03T00:00:00.000Z',
          management_url: null,
          non_subscriptions: {},
          other_purchases: {},
          entitlements: {},
          subscriptions: {},
          original_purchase_date: null,
        },
        transaction_id: 'transaction-1',
      },
      api_version: '1.0',
    });

    expect(normalized).toEqual({
      provider: 'revenuecat',
      providerEventId: 'event-1',
      eventType: 'INITIAL_PURCHASE',
      providerAppUserId: 'app-user-1',
      providerCustomerId: 'original-user-1',
      providerSubscriptionId: 'transaction-1',
      productId: 'kitchenhub_premium_monthly',
      entitlementKeys: ['premium'],
      store: 'APP_STORE',
      rawEvent: {
        id: 'event-1',
        type: 'INITIAL_PURCHASE',
        app_user_id: 'app-user-1',
        original_app_user_id: 'original-user-1',
        aliases: ['alias-1'],
        entitlement_ids: ['premium'],
        product_id: 'kitchenhub_premium_monthly',
        store: 'APP_STORE',
        subscriber: expect.any(Object),
        transaction_id: 'transaction-1',
      },
    });
  });

  it('throws when the RevenueCat payload does not contain an event id', () => {
    expect(() =>
      service.parseWebhookEvent({
        event: {
          type: 'INITIAL_PURCHASE',
        },
      }),
    ).toThrow(BadRequestException);
  });
});
