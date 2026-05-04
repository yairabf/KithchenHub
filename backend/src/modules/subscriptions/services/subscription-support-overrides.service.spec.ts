import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionSupportOverridesService } from './subscription-support-overrides.service';

describe('SubscriptionSupportOverridesService', () => {
  let service: SubscriptionSupportOverridesService;

  const mockSubscriptionsRepository = {
    findUserMembership: jest.fn(),
    upsertHouseholdEntitlementOverride: jest.fn(),
    deleteHouseholdEntitlementOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionSupportOverridesService,
        {
          provide: SubscriptionsRepository,
          useValue: mockSubscriptionsRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionSupportOverridesService>(
      SubscriptionSupportOverridesService,
    );
    jest.clearAllMocks();
  });

  it('allows an admin to set a premium override for their household', async () => {
    mockSubscriptionsRepository.findUserMembership.mockResolvedValue({
      householdId: 'household-1',
      role: 'Admin',
    });

    mockSubscriptionsRepository.upsertHouseholdEntitlementOverride.mockResolvedValue(
      {
        householdId: 'household-1',
        key: 'premium_status',
        isEnabled: true,
        source: 'support',
        reason: 'manual support grant',
        expiresAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    );

    await expect(
      service.setPremiumOverride('user-1', 'household-1', {
        isPremium: true,
        reason: 'manual support grant',
        expiresAt: '2026-06-01T00:00:00.000Z',
      }),
    ).resolves.toEqual({
      householdId: 'household-1',
      key: 'premium_status',
      isPremium: true,
      source: 'support',
      reason: 'manual support grant',
      expiresAt: '2026-06-01T00:00:00.000Z',
    });
  });

  it('rejects non-admin callers', async () => {
    mockSubscriptionsRepository.findUserMembership.mockResolvedValue({
      householdId: 'household-1',
      role: 'Member',
    });

    await expect(
      service.setPremiumOverride('user-1', 'household-1', { isPremium: true }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects invalid expiresAt input', async () => {
    mockSubscriptionsRepository.findUserMembership.mockResolvedValue({
      householdId: 'household-1',
      role: 'Admin',
    });

    await expect(
      service.setPremiumOverride('user-1', 'household-1', {
        isPremium: false,
        expiresAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows an admin to clear the premium override for their household', async () => {
    mockSubscriptionsRepository.findUserMembership.mockResolvedValue({
      householdId: 'household-1',
      role: 'Admin',
    });

    await expect(
      service.clearPremiumOverride('user-1', 'household-1'),
    ).resolves.toEqual({ cleared: true });

    expect(
      mockSubscriptionsRepository.deleteHouseholdEntitlementOverride,
    ).toHaveBeenCalledWith('household-1', 'premium_status');
  });
});
