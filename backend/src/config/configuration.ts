import { validateEnv } from './env.validation';

export interface AppConfig {
  env: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  google: {
    clientId?: string;
    clientSecret?: string;
  };
}

let config: AppConfig | null = null;

/**
 * Loads configuration values from environment variables with validation.
 * @returns Environment-aware configuration values.
 */
export const loadConfiguration = (): AppConfig => {
  if (config) {
    return config;
  }

  const env = validateEnv();

  // port comes from process.env.PORT (Cloud Run uses 8080; local default 3000)
  config = {
    env: env.NODE_ENV,
    port: env.PORT,
    database: {
      url: env.DATABASE_URL,
    },
    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  };

  return config;
};
