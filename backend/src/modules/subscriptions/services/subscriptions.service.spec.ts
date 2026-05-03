import { SubscriptionsService } from '../services/subscriptions.service';
import {
  PREMIUM_PLAN_ENTITLEMENTS,
  PREMIUM_PLAN_KEY,
} from '../constants/subscription-entitlements';

describe('SubscriptionsService', () => {
  const mockSubscriptionsRepository = {
    findLatestSubscriptionForHousehold: jest.fn(),
    findEntitlementsForHousehold: jest.fn(),
  };

  let service: SubscriptionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionsService(mockSubscriptionsRepository as any);
  });

  it('returns the default free summary when householdId is missing', async () => {
    await expect(service.getSummaryForHousehold(null)).resolves.toEqual({
      planKey: 'free',
      status: 'inactive',
      entitlements: [],
      trialEndsAt: null,
      currentPeriodEndsAt: null,
    });
  });

  it('returns the default free summary when no subscription exists', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      null,
    );
    mockSubscriptionsRepository.findEntitlementsForHousehold.mockResolvedValue([]);

    await expect(service.getSummaryForHousehold('household-1')).resolves.toEqual({
      planKey: 'free',
      status: 'inactive',
      entitlements: [],
      trialEndsAt: null,
      currentPeriodEndsAt: null,
    });
  });

  it('returns premium entitlements for an active premium subscription', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        householdId: 'household-1',
        planKey: PREMIUM_PLAN_KEY,
        status: 'active',
        trialEndsAt: null,
        currentPeriodEndsAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    );
    mockSubscriptionsRepository.findEntitlementsForHousehold.mockResolvedValue([]);

    const summary = await service.getSummaryForHousehold('household-1');

    expect(summary.planKey).toBe('premium');
    expect(summary.status).toBe('active');
    expect(summary.entitlements).toEqual([...PREMIUM_PLAN_ENTITLEMENTS]);
    expect(summary.currentPeriodEndsAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('respects explicit entitlement overrides', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        householdId: 'household-1',
        planKey: PREMIUM_PLAN_KEY,
        status: 'active',
        trialEndsAt: null,
        currentPeriodEndsAt: null,
      },
    );
    mockSubscriptionsRepository.findEntitlementsForHousehold.mockResolvedValue([
      {
        key: 'ai_voice_add',
        isEnabled: false,
      },
      {
        key: 'custom_beta_feature',
        isEnabled: true,
      },
    ]);

    const summary = await service.getSummaryForHousehold('household-1');

    expect(summary.entitlements).not.toContain('ai_voice_add');
    expect(summary.entitlements).toContain('custom_beta_feature');
  });

  it('fails closed for inactive premium subscriptions', async () => {
    mockSubscriptionsRepository.findLatestSubscriptionForHousehold.mockResolvedValue(
      {
        householdId: 'household-1',
        planKey: PREMIUM_PLAN_KEY,
        status: 'canceled',
        trialEndsAt: null,
        currentPeriodEndsAt: null,
      },
    );
    mockSubscriptionsRepository.findEntitlementsForHousehold.mockResolvedValue([]);

    const summary = await service.getSummaryForHousehold('household-1');

    expect(summary.planKey).toBe('premium');
    expect(summary.status).toBe('canceled');
    expect(summary.entitlements).toEqual([]);
  });
});
