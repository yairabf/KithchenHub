import { Test, TestingModule } from '@nestjs/testing';
import type { CurrentUserPayload } from '../../../common/decorators';
import { SubscriptionSupportOverridesController } from './subscription-support-overrides.controller';
import { SubscriptionSupportOverridesService } from '../services/subscription-support-overrides.service';

describe('SubscriptionSupportOverridesController', () => {
  let controller: SubscriptionSupportOverridesController;

  const mockSubscriptionSupportOverridesService = {
    setPremiumOverride: jest.fn(),
    clearPremiumOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionSupportOverridesController],
      providers: [
        {
          provide: SubscriptionSupportOverridesService,
          useValue: mockSubscriptionSupportOverridesService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionSupportOverridesController>(
      SubscriptionSupportOverridesController,
    );
    jest.clearAllMocks();
  });

  it('delegates set override to service for authenticated caller', async () => {
    const user: CurrentUserPayload = {
      userId: 'user-1',
      householdId: 'household-1',
      email: 'user@example.com',
    };

    const payload = {
      isPremium: true,
      reason: 'manual support grant',
      expiresAt: '2026-06-01T00:00:00.000Z',
    };

    mockSubscriptionSupportOverridesService.setPremiumOverride.mockResolvedValue(
      {
        householdId: 'household-1',
        key: 'premium_status',
        isPremium: true,
        source: 'support',
        reason: 'manual support grant',
        expiresAt: '2026-06-01T00:00:00.000Z',
      },
    );

    await expect(
      controller.setPremiumOverride('household-1', user, payload),
    ).resolves.toEqual({
      householdId: 'household-1',
      key: 'premium_status',
      isPremium: true,
      source: 'support',
      reason: 'manual support grant',
      expiresAt: '2026-06-01T00:00:00.000Z',
    });

    expect(
      mockSubscriptionSupportOverridesService.setPremiumOverride,
    ).toHaveBeenCalledWith('user-1', 'household-1', payload);
  });

  it('delegates clear override to service for authenticated caller', async () => {
    const user: CurrentUserPayload = {
      userId: 'user-1',
      householdId: 'household-1',
      email: 'user@example.com',
    };

    mockSubscriptionSupportOverridesService.clearPremiumOverride.mockResolvedValue(
      {
        cleared: true,
      },
    );

    await expect(
      controller.clearPremiumOverride('household-1', user),
    ).resolves.toEqual({
      cleared: true,
    });

    expect(
      mockSubscriptionSupportOverridesService.clearPremiumOverride,
    ).toHaveBeenCalledWith('user-1', 'household-1');
  });
});
