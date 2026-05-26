import { Injectable } from '@nestjs/common';

const SUPPORT_TICKET_SUBMISSIONS_PER_HOUR = 3;
const SUPPORT_TICKET_SUBMISSION_BURST = 3;

type TokenBucket = {
  tokens: number;
  lastRefillMs: number;
};

export type SupportTicketRateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds?: number;
  remainingTokens: number;
};

@Injectable()
export class SupportTicketRateLimitService {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly refillPerMs =
    SUPPORT_TICKET_SUBMISSIONS_PER_HOUR / 3_600_000;
  private readonly capacity = SUPPORT_TICKET_SUBMISSION_BURST;

  check(userId: string, now = Date.now()): SupportTicketRateLimitDecision {
    const bucket = this.refillBucket(userId, now);

    if (bucket.tokens >= 1) {
      return {
        allowed: true,
        remainingTokens: Math.floor(bucket.tokens),
      };
    }

    return this.buildRejectedDecision(bucket);
  }

  consume(userId: string, now = Date.now()): SupportTicketRateLimitDecision {
    const bucket = this.refillBucket(userId, now);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remainingTokens: Math.floor(bucket.tokens),
      };
    }

    return this.buildRejectedDecision(bucket);
  }

  private refillBucket(userId: string, now: number): TokenBucket {
    const bucket = this.buckets.get(userId) ?? {
      tokens: this.capacity,
      lastRefillMs: now,
    };

    const elapsedMs = Math.max(0, now - bucket.lastRefillMs);
    const refill = elapsedMs * this.refillPerMs;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
    bucket.lastRefillMs = now;
    this.buckets.set(userId, bucket);

    return bucket;
  }

  private buildRejectedDecision(
    bucket: TokenBucket,
  ): SupportTicketRateLimitDecision {
    const deficit = 1 - bucket.tokens;
    const retryAfterSeconds = Math.ceil(deficit / this.refillPerMs / 1000);
    return {
      allowed: false,
      retryAfterSeconds,
      remainingTokens: 0,
    };
  }
}
