import { z } from 'zod';

const envSchema = z.object({
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
  /**
   * OAuth configuration for backend-driven flows
   */
  AUTH_BACKEND_BASE_URL: z.string().url(),
  AUTH_APP_SCHEME: z.string().default('kitchen-hub'),
  AUTH_STATE_SECRET: z.string().min(32),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(604800),
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
   * When set, relative image_url values (e.g. downloaded_icons/chicken.png) are
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
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
