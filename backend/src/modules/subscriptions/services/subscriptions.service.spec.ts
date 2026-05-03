import { SubscriptionsService } from './subscriptions.service';

const PREMIUM_OVERRIDE_KEY = 'premium_status';

describe('SubscriptionsService', () => {
  const mockSubscriptionsRepository = {
    findLatestSubscriptionForHousehold: jest.fn(),
    findEntitlementOverridesForHousehold: jest.fn(),
  };

  let service: SubscriptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionsService(mockSubscriptionsRepository as any);
  });

  it('returns not premium when householdId is missing', async () => {
    await expect(service.getPremiumStatusForHousehold(null)).resolves.toEqual({
      isPremium: false,
      status: 'inactive',
      trialEndsAt: null,
      currentPeriodEndsAt: null,
      override: null,
    });
  });

  it('returns premium for an active trial before the trial ends', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'trialing',
        trialEndsAt: new Date('2099-01-10T00:00:00.000Z'),
        currentPeriodEndsAt: null,
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-01-05T00:00:00.000Z'),
    });

    expect(summary).toEqual({
      isPremium: true,
      status: 'trialing',
      trialEndsAt: '2099-01-10T00:00:00.000Z',
      currentPeriodEndsAt: null,
      override: null,
    });
  });

  it('automatically disables premium when the trial has ended', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'trialing',
        trialEndsAt: new Date('2099-01-10T00:00:00.000Z'),
        currentPeriodEndsAt: null,
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-01-11T00:00:00.000Z'),
    });

    expect(summary.isPremium).toBe(false);
    expect(summary.status).toBe('expired');
  });

  it('returns premium for an active paid subscription before the billing period ends', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'active',
        trialEndsAt: null,
        currentPeriodEndsAt: new Date('2099-02-01T00:00:00.000Z'),
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-01-20T00:00:00.000Z'),
    });

    expect(summary.isPremium).toBe(true);
    expect(summary.status).toBe('active');
  });

  it('automatically disables premium when the paid period has ended', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'active',
        trialEndsAt: null,
        currentPeriodEndsAt: new Date('2099-02-01T00:00:00.000Z'),
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-02-02T00:00:00.000Z'),
    });

    expect(summary.isPremium).toBe(false);
    expect(summary.status).toBe('expired');
  });

  it('lets a household override force premium on', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'expired',
        trialEndsAt: null,
        currentPeriodEndsAt: new Date('2099-02-01T00:00:00.000Z'),
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [
        {
          key: PREMIUM_OVERRIDE_KEY,
          isEnabled: true,
          expiresAt: null,
        },
      ],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-02-02T00:00:00.000Z'),
    });

    expect(summary).toEqual({
      isPremium: true,
      status: 'override_on',
      trialEndsAt: null,
      currentPeriodEndsAt: '2099-02-01T00:00:00.000Z',
      override: {
        isPremium: true,
        expiresAt: null,
      },
    });
  });

  it('lets a household override force premium off', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'active',
        trialEndsAt: null,
        currentPeriodEndsAt: new Date('2099-02-10T00:00:00.000Z'),
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [
        {
          key: PREMIUM_OVERRIDE_KEY,
          isEnabled: false,
          expiresAt: null,
        },
      ],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-02-02T00:00:00.000Z'),
    });

    expect(summary).toEqual({
      isPremium: false,
      status: 'override_off',
      trialEndsAt: null,
      currentPeriodEndsAt: '2099-02-10T00:00:00.000Z',
      override: {
        isPremium: false,
        expiresAt: null,
      },
    });
  });

  it('ignores an expired premium override', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        planKey: 'premium',
        status: 'active',
        trialEndsAt: null,
        currentPeriodEndsAt: new Date('2099-02-10T00:00:00.000Z'),
      },
    );
    mockSubscriptionsRepository.findEntitlementOverridesForHousehold.mockResolvedValue(
      [
        {
          key: PREMIUM_OVERRIDE_KEY,
          isEnabled: false,
          expiresAt: new Date('2099-02-01T00:00:00.000Z'),
        },
      ],
    );

    const summary = await service.getPremiumStatusForHousehold('household-1', {
      now: new Date('2099-02-02T00:00:00.000Z'),
    });

    expect(summary.isPremium).toBe(true);
    expect(summary.status).toBe('active');
    expect(summary.override).toBeNull();
  });
});
