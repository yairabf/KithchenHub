import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../../modules/subscriptions/services/subscriptions.service';
import { EntitlementGuard } from './entitlement.guard';

describe('EntitlementGuard', () => {
  const mockReflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const mockSubscriptionsService = {
    getPremiumStatusForHousehold: jest.fn(),
  } as unknown as SubscriptionsService;

  const guard = new EntitlementGuard(mockReflector, mockSubscriptionsService);

  function buildContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows routes without entitlement metadata', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    await expect(
      guard.canActivate(buildContext({ userId: 'u1', householdId: 'h1' })),
    ).resolves.toBe(true);

    expect(
      mockSubscriptionsService.getPremiumStatusForHousehold,
    ).not.toHaveBeenCalled();
  });

  it('throws when user is missing', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['premium']);

    await expect(guard.canActivate(buildContext(undefined))).rejects.toThrow(
      new ForbiddenException('User not authenticated'),
    );
  });

  it('throws when household is missing', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['premium']);

    await expect(
      guard.canActivate(buildContext({ userId: 'u1', householdId: null })),
    ).rejects.toThrow(
      new ForbiddenException('User does not belong to a household'),
    );
  });

  it('throws when premium is not active for required premium entitlement', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['premium']);
    (mockSubscriptionsService.getPremiumStatusForHousehold as jest.Mock).mockResolvedValue({
      isPremium: false,
    });

    await expect(
      guard.canActivate(buildContext({ userId: 'u1', householdId: 'h1' })),
    ).rejects.toThrow(new ForbiddenException('Premium entitlement required'));
  });

  it('allows when premium is active for required premium entitlement', async () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['premium']);
    (mockSubscriptionsService.getPremiumStatusForHousehold as jest.Mock).mockResolvedValue({
      isPremium: true,
    });

    await expect(
      guard.canActivate(buildContext({ userId: 'u1', householdId: 'h1' })),
    ).resolves.toBe(true);
  });
});
