import { Test, TestingModule } from '@nestjs/testing';
import { BillingProviderRegistryService } from '../providers/billing-provider-registry.service';
import type { BillingProviderService } from '../providers/billing-provider.interface';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionWebhooksService } from './subscription-webhooks.service';

describe('SubscriptionWebhooksService', () => {
  let service: SubscriptionWebhooksService;

  const mockProvider: BillingProviderService = {
    provider: 'revenuecat',
    parseWebhookEvent: jest.fn(),
  };

  const mockBillingProviderRegistryService = {
    getProvider: jest.fn().mockReturnValue(mockProvider),
  };

  const mockSubscriptionsRepository = {
    findBillingEvent: jest.fn(),
    createBillingEvent: jest.fn(),
    findUserHouseholdId: jest.fn(),
    upsertHouseholdSubscription: jest.fn(),
    markBillingEventProcessed: jest.fn(),
    markBillingEventFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionWebhooksService,
        {
          provide: BillingProviderRegistryService,
          useValue: mockBillingProviderRegistryService,
        },
        {
          provide: SubscriptionsRepository,
          useValue: mockSubscriptionsRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionWebhooksService>(
      SubscriptionWebhooksService,
    );
    jest.clearAllMocks();
  });

  it('returns duplicate response when provider event already exists', async () => {
    (mockProvider.parseWebhookEvent as jest.Mock).mockReturnValue({
      provider: 'revenuecat',
      providerEventId: 'evt_1',
      eventType: 'INITIAL_PURCHASE',
      providerAppUserId: '9f88e6d9-cf9d-4976-95a8-09f49f487cb2',
      providerCustomerId: null,
      providerSubscriptionId: 'sub_1',
      productId: 'kitchenhub.monthly',
      entitlementKeys: ['premium'],
      store: 'APP_STORE',
      rawEvent: { id: 'evt_1' },
    });

    mockSubscriptionsRepository.findBillingEvent.mockResolvedValue({
      id: 'existing-event',
    });

    await expect(
      service.processWebhook('revenuecat', { event: { id: 'evt_1' } }),
    ).resolves.toEqual({
      accepted: true,
      duplicate: true,
      eventId: 'existing-event',
    });

    expect(
      mockSubscriptionsRepository.createBillingEvent,
    ).not.toHaveBeenCalled();
    expect(
      mockSubscriptionsRepository.upsertHouseholdSubscription,
    ).not.toHaveBeenCalled();
  });

  it('creates provider event and upserts household subscription for premium purchase event', async () => {
    (mockProvider.parseWebhookEvent as jest.Mock).mockReturnValue({
      provider: 'revenuecat',
      providerEventId: 'evt_2',
      eventType: 'INITIAL_PURCHASE',
      providerAppUserId: '9f88e6d9-cf9d-4976-95a8-09f49f487cb2',
      providerCustomerId: null,
      providerSubscriptionId: 'sub_2',
      productId: 'kitchenhub.yearly',
      entitlementKeys: ['premium'],
      store: 'APP_STORE',
      rawEvent: { id: 'evt_2' },
    });

    mockSubscriptionsRepository.findBillingEvent.mockResolvedValue(null);
    mockSubscriptionsRepository.findUserHouseholdId.mockResolvedValue(
      'household-1',
    );
    mockSubscriptionsRepository.createBillingEvent.mockResolvedValue({
      id: 'event-2',
    });

    await expect(
      service.processWebhook('revenuecat', { event: { id: 'evt_2' } }),
    ).resolves.toEqual({
      accepted: true,
      duplicate: false,
      eventId: 'event-2',
    });

    expect(mockSubscriptionsRepository.createBillingEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'revenuecat',
        providerEventId: 'evt_2',
        eventType: 'INITIAL_PURCHASE',
        householdId: 'household-1',
      }),
    );

    expect(
      mockSubscriptionsRepository.upsertHouseholdSubscription,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: 'household-1',
        planKey: 'premium',
        status: 'active',
        provider: 'revenuecat',
        providerSubscriptionId: 'sub_2',
      }),
    );

    expect(
      mockSubscriptionsRepository.markBillingEventProcessed,
    ).toHaveBeenCalledWith('event-2');
  });
});
