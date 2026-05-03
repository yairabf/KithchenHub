import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { SubscriptionsRepository } from './subscriptions.repository';

describe('SubscriptionsRepository', () => {
  let repository: SubscriptionsRepository;

  const mockPrismaService = {
    householdSubscription: {
      findFirst: jest.fn(),
    },
    householdEntitlementOverride: {
      findMany: jest.fn(),
    },
    billingProviderEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<SubscriptionsRepository>(SubscriptionsRepository);
    jest.clearAllMocks();
  });

  it('queries the latest subscription for a household using period-aware ordering', async () => {
    mockPrismaService.householdSubscription.findFirst.mockResolvedValue(null);

    await repository.findLatestSubscriptionForHousehold('household-1');

    expect(
      mockPrismaService.householdSubscription.findFirst,
    ).toHaveBeenCalledWith({
      where: { householdId: 'household-1' },
      orderBy: [
        { currentPeriodEndsAt: 'desc' },
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  });

  it('queries entitlement overrides for a household', async () => {
    mockPrismaService.householdEntitlementOverride.findMany.mockResolvedValue(
      [],
    );

    await repository.findEntitlementOverridesForHousehold('household-1');

    expect(
      mockPrismaService.householdEntitlementOverride.findMany,
    ).toHaveBeenCalledWith({
      where: { householdId: 'household-1' },
      orderBy: { key: 'asc' },
    });
  });

  it('looks up billing provider events by provider and event id', async () => {
    mockPrismaService.billingProviderEvent.findUnique.mockResolvedValue(null);

    await repository.findBillingEvent('revenuecat', 'evt_123');

    expect(
      mockPrismaService.billingProviderEvent.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        provider_providerEventId: {
          provider: 'revenuecat',
          providerEventId: 'evt_123',
        },
      },
    });
  });

  it('creates billing provider events with the provided payload', async () => {
    const payload = { hello: 'world' };
    mockPrismaService.billingProviderEvent.create.mockResolvedValue({
      id: 'event-1',
      provider: 'revenuecat',
      providerEventId: 'evt_123',
      eventType: 'INITIAL_PURCHASE',
      payload,
    });

    await repository.createBillingEvent({
      provider: 'revenuecat',
      providerEventId: 'evt_123',
      eventType: 'INITIAL_PURCHASE',
      providerCustomerId: 'customer-1',
      providerSubscriptionId: 'subscription-1',
      providerAppUserId: 'household-1',
      householdId: 'household-1',
      payload,
    });

    expect(mockPrismaService.billingProviderEvent.create).toHaveBeenCalledWith({
      data: {
        provider: 'revenuecat',
        providerEventId: 'evt_123',
        eventType: 'INITIAL_PURCHASE',
        providerCustomerId: 'customer-1',
        providerSubscriptionId: 'subscription-1',
        providerAppUserId: 'household-1',
        householdId: 'household-1',
        payload,
      },
    });
  });
});
