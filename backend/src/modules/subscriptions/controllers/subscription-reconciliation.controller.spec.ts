import { Test, TestingModule } from '@nestjs/testing';
import type { CurrentUserPayload } from '../../../common/decorators';
import { SubscriptionReconciliationController } from './subscription-reconciliation.controller';
import { SubscriptionReconciliationService } from '../services/subscription-reconciliation.service';

describe('SubscriptionReconciliationController', () => {
  let controller: SubscriptionReconciliationController;

  const mockSubscriptionReconciliationService = {
    reconcileCustomerState: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionReconciliationController],
      providers: [
        {
          provide: SubscriptionReconciliationService,
          useValue: mockSubscriptionReconciliationService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionReconciliationController>(
      SubscriptionReconciliationController,
    );
    jest.clearAllMocks();
  });

  it('delegates authenticated reconciliation payloads to service', async () => {
    const user: CurrentUserPayload = {
      userId: 'user-1',
      householdId: 'household-1',
      email: 'user@example.com',
    };

    const payload = {
      appUserId: 'user-1',
      originalAppUserId: 'user-1',
      activeEntitlementIds: ['premium'],
      activeSubscriptionProductIds: ['kitchenhub_premium_monthly'],
      latestExpirationDate: null,
    };

    mockSubscriptionReconciliationService.reconcileCustomerState.mockResolvedValue(
      {
        accepted: true,
        reconciled: true,
      },
    );

    await expect(
      controller.reconcileProviderState('revenuecat', user, payload),
    ).resolves.toEqual({ accepted: true, reconciled: true });

    expect(
      mockSubscriptionReconciliationService.reconcileCustomerState,
    ).toHaveBeenCalledWith('user-1', 'revenuecat', payload);
  });
});
