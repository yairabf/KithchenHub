import { validateEnv } from '../env.validation';

function buildBaseEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
    JWT_SECRET: 'x'.repeat(32),
    JWT_REFRESH_SECRET: 'y'.repeat(32),
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    ...overrides,
  } satisfies Record<string, string | undefined>;
}

describe('validateEnv', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it.each([
    [
      'succeeds in development without DIRECT_URL',
      buildBaseEnv({ NODE_ENV: 'development', DIRECT_URL: undefined }),
      'success' as const,
    ],
    [
      'fails in production without DIRECT_URL',
      buildBaseEnv({ NODE_ENV: 'production', DIRECT_URL: undefined }),
      'failure' as const,
    ],
    [
      'succeeds in production with DIRECT_URL',
      buildBaseEnv({
        NODE_ENV: 'production',
        DIRECT_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
      }),
      'success' as const,
    ],
  ])('%s', (_label, env, expected) => {
    process.env = env;

    if (expected === 'failure') {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(() => validateEnv()).toThrow('Invalid environment variables');
      return;
    }

    expect(validateEnv().DATABASE_URL).toBe(
      'postgresql://user:pass@localhost:5432/db?schema=public',
    );
  });
});
