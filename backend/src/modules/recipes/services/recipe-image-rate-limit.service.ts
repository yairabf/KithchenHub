import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RECIPE_IMAGE_UPLOADS_PER_HOUR,
  RECIPE_IMAGE_UPLOAD_BURST,
} from '../../../common/constants';

type TokenBucket = {
  tokens: number;
  lastRefillMs: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds?: number;
  remainingTokens: number;
};

@Injectable()
export class RecipeImageRateLimitService {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly refillPerMs: number;
  private readonly capacity: number;

  constructor(private readonly configService: ConfigService) {
    const uploadsPerHourRaw = this.configService.get<string | number>(
      'RECIPE_IMAGE_UPLOADS_PER_HOUR',
    );
    const burstRaw = this.configService.get<string | number>(
      'RECIPE_IMAGE_UPLOAD_BURST',
    );
    const uploadsPerHour = Number(
      uploadsPerHourRaw ?? RECIPE_IMAGE_UPLOADS_PER_HOUR,
    );
    const burst = Number(burstRaw ?? RECIPE_IMAGE_UPLOAD_BURST);

    this.capacity = Math.max(1, burst);
    this.refillPerMs = Math.max(1, uploadsPerHour) / 3_600_000;
  }

  check(userId: string, now = Date.now()): RateLimitDecision {
    const bucket = this.buckets.get(userId) ?? {
      tokens: this.capacity,
      lastRefillMs: now,
    };

    const elapsedMs = Math.max(0, now - bucket.lastRefillMs);
    const refill = elapsedMs * this.refillPerMs;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refill);
    bucket.lastRefillMs = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(userId, bucket);
      return {
        allowed: true,
        remainingTokens: Math.floor(bucket.tokens),
      };
    }

    const deficit = 1 - bucket.tokens;
    const retryAfterSeconds = Math.ceil(deficit / this.refillPerMs / 1000);
    this.buckets.set(userId, bucket);
    return {
      allowed: false,
      retryAfterSeconds,
      remainingTokens: 0,
    };
  }
}
