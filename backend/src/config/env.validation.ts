import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Render sets PORT=10000; default 3000 is for local dev only.
    PORT: z
      .string()
      .transform(Number)
      .pipe(z.number().int().positive())
      .default('3000'),
    DATABASE_URL: z.string().url(),
    /**
     * Prisma uses DIRECT_URL for migrations/administrative operations when present.
     * In production deployments we require this to avoid migration failures.
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
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.DIRECT_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DIRECT_URL'],
        message:
          'DIRECT_URL is required in production (used by Prisma for migrations).',
      });
    }
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
