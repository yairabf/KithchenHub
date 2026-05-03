import { SubscriptionsRepository } from './subscriptions.repository';

describe('SubscriptionsRepository', () => {
  const mockPrismaService = {
    householdSubscription: {
      findFirst: jest.fn(),
    },
    householdEntitlement: {
      findMany: jest.fn(),
    },
  };

  let repository: SubscriptionsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SubscriptionsRepository(mockPrismaService as any);
  });

  it('queries the latest subscription for a household', async () => {
    mockPrismaService.householdSubscription.findFirst.mockResolvedValue(null);

    await repository.findLatestSubscriptionForHousehold('household-1');

    expect(mockPrismaService.householdSubscription.findFirst).toHaveBeenCalledWith(
      {
        where: { householdId: 'household-1' },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      },
    );
  });

  it('queries entitlements for a household', async () => {
    mockPrismaService.householdEntitlement.findMany.mockResolvedValue([]);

    await repository.findEntitlementsForHousehold('household-1');

    expect(mockPrismaService.householdEntitlement.findMany).toHaveBeenCalledWith(
      {
        where: { householdId: 'household-1' },
        orderBy: { key: 'asc' },
      },
    );
  });
});
