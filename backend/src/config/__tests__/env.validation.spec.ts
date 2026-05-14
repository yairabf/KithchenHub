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
      buildBaseEnv({ NODE_ENV: 'production', RESEND_API_KEY: 'resend-key' }),
    ],
    [
      'succeeds in production with DIRECT_URL',
      buildBaseEnv({
        NODE_ENV: 'production',
        DIRECT_URL: 'postgresql://user:***@localhost:5432/db?schema=public',
        RESEND_API_KEY: 'resend-key',
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

  it('parses AUTH_SKIP_EMAIL_VERIFICATION when enabled', () => {
    process.env = buildBaseEnv({
      AUTH_SKIP_EMAIL_VERIFICATION: 'true',
    }) as Record<string, string>;

    expect(validateEnv().AUTH_SKIP_EMAIL_VERIFICATION).toBe(true);
  });

  it('rejects AUTH_SKIP_EMAIL_VERIFICATION in production', () => {
    process.env = buildBaseEnv({
      NODE_ENV: 'production',
      AUTH_SKIP_EMAIL_VERIFICATION: 'true',
    }) as Record<string, string>;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('rejects production email verification when RESEND_API_KEY is missing', () => {
    process.env = buildBaseEnv({
      NODE_ENV: 'production',
      AUTH_SKIP_EMAIL_VERIFICATION: 'false',
      RESEND_API_KEY: undefined,
    }) as Record<string, string>;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('parses Resend email configuration with onboarding default sender', () => {
    process.env = buildBaseEnv({
      RESEND_API_KEY: 'resend-key',
      EMAIL_FROM: undefined,
    }) as Record<string, string>;

    const env = validateEnv();

    expect(env.RESEND_API_KEY).toBe('resend-key');
    expect(env.EMAIL_FROM).toBe('onboarding@resend.dev');
  });

  it('accepts Pexels API key for recipe image search', () => {
    process.env = buildBaseEnv({
      PEXELS_API_KEY: 'pexels-key',
    }) as Record<string, string>;

    const env = validateEnv();

    expect(env.PEXELS_API_KEY).toBe('pexels-key');
  });

  it('rejects env when webhook auth header is set without webhook auth secret', () => {
    process.env = buildBaseEnv({
      SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER: 'x-revenuecat-signature',
      SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET: undefined,
    }) as Record<string, string>;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('rejects env when webhook auth secret is set without webhook auth header', () => {
    process.env = buildBaseEnv({
      SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER: undefined,
      SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET: 'secret',
    }) as Record<string, string>;

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('accepts env when webhook auth header and secret are both set', () => {
    process.env = buildBaseEnv({
      SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER: 'x-revenuecat-signature',
      SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET: 'secret',
    }) as Record<string, string>;

    const env = validateEnv();

    expect(env.SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER).toBe(
      'x-revenuecat-signature',
    );
    expect(env.SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET).toBe('secret');
  });
});
