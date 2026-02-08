import { ConfigService } from '@nestjs/config';
import { RecipeImageRateLimitService } from './recipe-image-rate-limit.service';
import {
  RECIPE_IMAGE_UPLOAD_BURST,
  RECIPE_IMAGE_UPLOADS_PER_HOUR,
} from '../../../common/constants';

describe('RecipeImageRateLimitService', () => {
  let service: RecipeImageRateLimitService;

  beforeEach(() => {
    const configGet = jest.fn().mockReturnValue(undefined);
    service = new RecipeImageRateLimitService({
      get: configGet,
    } as unknown as ConfigService);
  });

  it('allows up to burst capacity immediately', () => {
    const now = Date.now();
    for (let i = 0; i < RECIPE_IMAGE_UPLOAD_BURST; i += 1) {
      const result = service.check('user-1', now);
      expect(result.allowed).toBe(true);
    }

    const denied = service.check('user-1', now);
    expect(denied.allowed).toBe(false);
  });

  it('returns a retry-after when limit is exceeded', () => {
    const now = Date.now();
    for (let i = 0; i < RECIPE_IMAGE_UPLOAD_BURST; i += 1) {
      service.check('user-2', now);
    }

    const denied = service.check('user-2', now);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('refills tokens over time', () => {
    const now = 1_700_000_000_000;
    for (let i = 0; i < RECIPE_IMAGE_UPLOAD_BURST; i += 1) {
      service.check('user-3', now);
    }

    const denied = service.check('user-3', now);
    expect(denied.allowed).toBe(false);

    const refillMs = Math.ceil(3_600_000 / RECIPE_IMAGE_UPLOADS_PER_HOUR);
    const allowed = service.check('user-3', now + refillMs);
    expect(allowed.allowed).toBe(true);
  });
});
