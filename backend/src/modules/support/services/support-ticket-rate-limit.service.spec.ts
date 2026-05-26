import { SupportTicketRateLimitService } from './support-ticket-rate-limit.service';

describe('SupportTicketRateLimitService', () => {
  it('checks quota without consuming tokens', () => {
    const service = new SupportTicketRateLimitService();
    const now = 1_800_000;

    expect(service.check('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 3,
    });
    expect(service.check('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 3,
    });
  });

  it('consumes a small burst and rejects repeated successful submissions from the same user', () => {
    const service = new SupportTicketRateLimitService();
    const now = 1_800_000;

    expect(service.consume('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 2,
    });
    expect(service.consume('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 1,
    });
    expect(service.consume('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 0,
    });

    expect(service.check('user-1', now)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 1200,
      remainingTokens: 0,
    });
  });

  it('does not consume quota for failed submissions', () => {
    const service = new SupportTicketRateLimitService();
    const now = 1_800_000;

    expect(service.check('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 3,
    });
    expect(service.check('user-1', now)).toMatchObject({
      allowed: true,
      remainingTokens: 3,
    });
  });

  it('refills tickets over time independently per user', () => {
    const service = new SupportTicketRateLimitService();
    const now = 1_800_000;

    service.consume('user-1', now);
    service.consume('user-1', now);
    service.consume('user-1', now);

    expect(service.check('user-2', now)).toMatchObject({
      allowed: true,
      remainingTokens: 3,
    });
    expect(service.consume('user-1', now + 1_200_000)).toMatchObject({
      allowed: true,
      remainingTokens: 0,
    });
  });
});
