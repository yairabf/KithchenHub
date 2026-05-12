import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Cloud Run sets PORT=8080; default 3000 is for local dev only.
    PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive())
      .default('3000'),
    DATABASE_URL: z.string().url(),
    /**
     * Optional direct DB URL. Prisma uses DIRECT_URL for migrations when present;
     * when absent, Prisma uses DATABASE_URL. Set DIRECT_URL when DATABASE_URL is
     * a pooled connection (e.g. Supabase pooler, PgBouncer) so migrations run
     * against a direct connection. Optional in all environments.
     */
    DIRECT_URL: z.string().url().optional(),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_IMAGE_SEARCH_API_KEY: z.string().min(1).optional(),
    GOOGLE_IMAGE_SEARCH_CX: z.string().min(1).optional(),
    GOOGLE_CUSTOM_SEARCH_API_KEY: z.string().min(1).optional(),
    GOOGLE_CUSTOM_SEARCH_ENGINE_ID: z.string().min(1).optional(),
    GOOGLE_CUSTOM_SEARCH_CX: z.string().min(1).optional(),
    GOOGLE_IMAGE_SEARCH_SAFE: z
      .enum(['active', 'off'])
      .optional()
      .default('active'),
    /**
     * OAuth configuration for backend-driven flows
     */
    AUTH_BACKEND_BASE_URL: z.string().url(),
    AUTH_APP_SCHEME: z.string().default('kitchen-hub'),
    AUTH_STATE_SECRET: z.string().min(32),
    AUTH_SKIP_EMAIL_VERIFICATION: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SUPABASE_URL: z.string().url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .default(604800),
    RECIPE_IMAGE_UPLOADS_PER_HOUR: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .default(60),
    RECIPE_IMAGE_UPLOAD_BURST: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .default(10),
    /**
     * Logging configuration
     */
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
    /**
     * Sentry error tracking (optional)
     */
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(1))
      .optional()
      .default('0.1'),
    /**
     * Base URL for catalog icon storage (e.g. MinIO bucket).
     * When set, relative image_url values (e.g. items_images/chicken.png) are
     * rewritten to {CATALOG_ICONS_BASE_URL}/{image_url} in API responses.
     */
    CATALOG_ICONS_BASE_URL: z.string().optional(),
    /**
     * Email configuration (optional, for email verification)
     */
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive())
      .optional()
      .default('587'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().email().optional().default('noreply@kitchenhub.app'),
    EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive())
      .optional()
      .default('24'),
    /**
     * Optional full URLs for in-app / store legal links. When unset, the API
     * derives URLs from AUTH_BACKEND_BASE_URL + /privacy and /terms.
     */
    LEGAL_PRIVACY_POLICY_URL: z.string().url().optional(),
    LEGAL_TERMS_OF_SERVICE_URL: z.string().url().optional(),
    SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER: z.string().min(1).optional(),
    SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.AUTH_SKIP_EMAIL_VERIFICATION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_SKIP_EMAIL_VERIFICATION'],
        message: 'AUTH_SKIP_EMAIL_VERIFICATION cannot be true in production',
      });
    }

    if (
      Boolean(env.GOOGLE_IMAGE_SEARCH_API_KEY) !==
      Boolean(env.GOOGLE_IMAGE_SEARCH_CX)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_IMAGE_SEARCH_API_KEY'],
        message:
          'GOOGLE_IMAGE_SEARCH_API_KEY and GOOGLE_IMAGE_SEARCH_CX must be set together',
      });
    }

    if (
      Boolean(env.GOOGLE_CUSTOM_SEARCH_API_KEY) !==
      Boolean(env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || env.GOOGLE_CUSTOM_SEARCH_CX)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_CUSTOM_SEARCH_API_KEY'],
        message:
          'GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID must be set together',
      });
    }

    if (
      Boolean(env.SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER) !==
      Boolean(env.SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER'],
        message:
          'SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER and SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET must be set together',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if ('error' in parsed) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
