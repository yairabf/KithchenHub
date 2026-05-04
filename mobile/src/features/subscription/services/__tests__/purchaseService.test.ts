import {
  PurchaseServiceUnavailableError,
  RevenueCatPurchaseService,
  createPurchaseService,
} from '../purchaseService';
import type { RevenueCatSdk } from '../purchaseService';

describe('createPurchaseService', () => {
  it('returns an unavailable service on web when no native billing provider is configured', async () => {
    const service = createPurchaseService({ platformOs: 'web' });

    expect(service.isAvailable()).toBe(false);
    await expect(service.getOfferings()).resolves.toBeNull();
    await expect(service.purchasePackage('monthly')).rejects.toThrow(
      new PurchaseServiceUnavailableError('In-app purchases are not available on web.'),
    );
  });

  it('returns a RevenueCat service when a RevenueCat SDK adapter is provided', () => {
    const sdk = createRevenueCatSdkStub();

    const service = createPurchaseService({
      platformOs: 'ios',
      revenueCatSdk: sdk,
    });

    expect(service).toBeInstanceOf(RevenueCatPurchaseService);
    expect(service.isAvailable()).toBe(true);
  });

  it('returns a RevenueCat service when an SDK factory can resolve a configured native adapter', () => {
    const sdk = createRevenueCatSdkStub();

    const service = createPurchaseService({
      platformOs: 'ios',
      revenueCatApiKey: 'appl_test_key',
      revenueCatSdkFactory: () => sdk,
    });

    expect(service).toBeInstanceOf(RevenueCatPurchaseService);
    expect(service.isAvailable()).toBe(true);
  });

  it('returns an unavailable service on native when RevenueCat key is missing', () => {
    const service = createPurchaseService({
      platformOs: 'android',
      revenueCatSdkFactory: () => createRevenueCatSdkStub(),
    });

    expect(service.isAvailable()).toBe(false);
  });
});

describe('RevenueCatPurchaseService', () => {
  it('normalizes RevenueCat offerings into app-owned package metadata', async () => {
    const sdk = createRevenueCatSdkStub();
    const service = new RevenueCatPurchaseService(sdk);

    await expect(service.getOfferings()).resolves.toEqual({
      provider: 'revenuecat',
      offeringId: 'default',
      packages: [
        {
          id: 'monthly',
          productId: 'kitchenhub.monthly',
          title: 'Monthly',
          priceText: '$4.99',
          period: 'monthly',
          hasFreeTrial: true,
        },
        {
          id: 'yearly',
          productId: 'kitchenhub.yearly',
          title: 'Yearly',
          priceText: '$39.99',
          period: 'yearly',
          hasFreeTrial: true,
        },
      ],
    });
  });

  it('purchases a selected package by normalized package id and returns normalized customer state', async () => {
    const sdk = createRevenueCatSdkStub();
    const service = new RevenueCatPurchaseService(sdk);

    await expect(service.purchasePackage('yearly')).resolves.toEqual({
      provider: 'revenuecat',
      purchasedProductId: 'kitchenhub.yearly',
      customerState: {
        appUserId: 'household-user-1',
        originalAppUserId: 'household-user-1',
        activeEntitlementIds: ['premium'],
        activeSubscriptionProductIds: ['kitchenhub.yearly'],
        latestExpirationDate: '2026-06-01T00:00:00.000Z',
      },
    });
  });

  it('restores purchases and returns normalized restored product ids', async () => {
    const sdk = createRevenueCatSdkStub();
    const service = new RevenueCatPurchaseService(sdk);

    await expect(service.restorePurchases()).resolves.toEqual({
      provider: 'revenuecat',
      restoredProductIds: ['kitchenhub.monthly', 'kitchenhub.yearly'],
      customerState: {
        appUserId: 'household-user-1',
        originalAppUserId: 'household-user-1',
        activeEntitlementIds: ['premium'],
        activeSubscriptionProductIds: ['kitchenhub.monthly', 'kitchenhub.yearly'],
        latestExpirationDate: '2026-06-01T00:00:00.000Z',
      },
    });
  });

  it('throws when a normalized package id is not available in the current offering', async () => {
    const sdk = createRevenueCatSdkStub();
    const service = new RevenueCatPurchaseService(sdk);

    await expect(service.purchasePackage('lifetime')).rejects.toThrow(
      'No purchase package found for id: lifetime',
    );
  });
});

function createRevenueCatSdkStub(): RevenueCatSdk {
  return {
    async getOfferings() {
      return {
        current: {
          identifier: 'default',
          availablePackages: [
            {
              identifier: 'monthly',
              packageType: 'MONTHLY',
              product: {
                identifier: 'kitchenhub.monthly',
                title: 'Monthly',
                priceString: '$4.99',
                subscriptionPeriod: 'P1M',
                introductoryPrice: {
                  identifier: 'trial',
                },
              },
            },
            {
              identifier: 'yearly',
              packageType: 'ANNUAL',
              product: {
                identifier: 'kitchenhub.yearly',
                title: 'Yearly',
                priceString: '$39.99',
                subscriptionPeriod: 'P1Y',
                introductoryPrice: {
                  identifier: 'trial',
                },
              },
            },
          ],
        },
      };
    },
    async purchasePackage(pkg) {
      return {
        productIdentifier: pkg.product.identifier,
        customerInfo: {
          appUserID: 'household-user-1',
          originalAppUserId: 'household-user-1',
          latestExpirationDate: '2026-06-01T00:00:00.000Z',
          activeSubscriptions: [pkg.product.identifier],
          entitlements: {
            active: {
              premium: {
                identifier: 'premium',
              },
            },
          },
        },
      };
    },
    async restorePurchases() {
      return {
        customerInfo: {
          appUserID: 'household-user-1',
          originalAppUserId: 'household-user-1',
          latestExpirationDate: '2026-06-01T00:00:00.000Z',
          activeSubscriptions: ['kitchenhub.monthly', 'kitchenhub.yearly'],
          entitlements: {
            active: {
              premium: {
                identifier: 'premium',
              },
            },
          },
        },
      };
    },
  };
}
