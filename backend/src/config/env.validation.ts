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
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
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
