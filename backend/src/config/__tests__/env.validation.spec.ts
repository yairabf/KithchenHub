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
    AUTH_BACKEND_BASE_URL: 'http://localhost:3000',
    AUTH_APP_SCHEME: 'kitchen-hub',
    AUTH_STATE_SECRET: 'test-secret-key-for-validation-only',
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
      buildBaseEnv({ NODE_ENV: 'development' }),
    ],
    [
      'succeeds in production without DIRECT_URL',
      buildBaseEnv({ NODE_ENV: 'production' }),
    ],
    [
      'succeeds in production with DIRECT_URL',
      buildBaseEnv({
        NODE_ENV: 'production',
        DIRECT_URL: 'postgresql://user:pass@localhost:5432/db?schema=public',
      }),
    ],
  ])('%s', (_label, env) => {
    // Filter out undefined values before setting process.env
    const filteredEnv = Object.fromEntries(
      Object.entries(env).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;
    process.env = filteredEnv;
    expect(validateEnv().DATABASE_URL).toBe(
      'postgresql://user:pass@localhost:5432/db?schema=public',
    );
  });
});
