import {
  ExecutionContext,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';

import { SupportTicketRateLimitGuard } from './support-ticket-rate-limit.guard';
import { SupportTicketRateLimitService } from '../services/support-ticket-rate-limit.service';

const createContext = (userId?: string) => {
  const response = { header: jest.fn() };
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ user: userId ? { userId } : undefined }),
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return { context, response };
};

describe('SupportTicketRateLimitGuard', () => {
  it('requires an authenticated user before consuming a rate-limit token', () => {
    const service = {
      check: jest.fn(),
    } as unknown as SupportTicketRateLimitService;
    const guard = new SupportTicketRateLimitGuard(service);
    const { context } = createContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(service.check).not.toHaveBeenCalled();
  });

  it('allows the request when the user has support-ticket quota', () => {
    const service = {
      check: jest.fn().mockReturnValue({ allowed: true, remainingTokens: 2 }),
    } as unknown as SupportTicketRateLimitService;
    const guard = new SupportTicketRateLimitGuard(service);
    const { context } = createContext('user-1');

    expect(guard.canActivate(context)).toBe(true);
    expect(service.check).toHaveBeenCalledWith('user-1');
  });

  it('rejects and sets Retry-After when support-ticket quota is exhausted', () => {
    const service = {
      check: jest.fn().mockReturnValue({
        allowed: false,
        retryAfterSeconds: 1200,
        remainingTokens: 0,
      }),
    } as unknown as SupportTicketRateLimitService;
    const guard = new SupportTicketRateLimitGuard(service);
    const { context, response } = createContext('user-1');

    expect(() => guard.canActivate(context)).toThrow(HttpException);
    expect(response.header).toHaveBeenCalledWith('Retry-After', '1200');
  });
});
