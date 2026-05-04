import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionReconciliationService } from './subscription-reconciliation.service';

describe('SubscriptionReconciliationService', () => {
  let service: SubscriptionReconciliationService;

  const mockSubscriptionsRepository = {
    findUserHouseholdId: jest.fn(),
    upsertHouseholdSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionReconciliationService,
        {
          provide: SubscriptionsRepository,
          useValue: mockSubscriptionsRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionReconciliationService>(
      SubscriptionReconciliationService,
    );
    jest.clearAllMocks();
  });

  it('upserts active premium subscription snapshot for revenuecat customer state', async () => {
    mockSubscriptionsRepository.findUserHouseholdId.mockResolvedValue('household-1');

    const result = await service.reconcileCustomerState('user-1', 'revenuecat', {
      appUserId: 'user-1',
      originalAppUserId: 'user-1',
      activeEntitlementIds: ['premium'],
      activeSubscriptionProductIds: ['kitchenhub_premium_monthly'],
      latestExpirationDate: '2026-05-30T00:00:00.000Z',
    });

    expect(result).toEqual({ accepted: true, reconciled: true });
    expect(
      mockSubscriptionsRepository.upsertHouseholdSubscription,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: 'household-1',
        purchaserUserId: 'user-1',
        planKey: 'premium',
        provider: 'revenuecat',
        status: 'active',
        billingInterval: 'monthly',
        providerProductId: 'kitchenhub_premium_monthly',
        providerEntitlementKey: 'premium',
        currentPeriodEndsAt: new Date('2026-05-30T00:00:00.000Z'),
      }),
    );
  });

  it('returns accepted false when user does not belong to a household', async () => {
    mockSubscriptionsRepository.findUserHouseholdId.mockResolvedValue(null);

    await expect(
      service.reconcileCustomerState('user-1', 'revenuecat', {
        appUserId: 'user-1',
        originalAppUserId: 'user-1',
        activeEntitlementIds: ['premium'],
        activeSubscriptionProductIds: ['kitchenhub_premium_monthly'],
        latestExpirationDate: null,
      }),
    ).resolves.toEqual({ accepted: false, reconciled: false });

    expect(
      mockSubscriptionsRepository.upsertHouseholdSubscription,
    ).not.toHaveBeenCalled();
  });
});
