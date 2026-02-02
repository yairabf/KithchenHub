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
  auth: {
    backendBaseUrl: string;
    appScheme: string;
    stateSecret: string;
  };
  logging: {
    level: string;
    format: 'json' | 'pretty';
  };
  sentry?: {
    dsn?: string;
    environment?: string;
    tracesSampleRate: number;
  };
  /** Base URL for catalog icons (e.g. http://localhost:9000/catalog-icons). When set, relative image_url are rewritten. */
  catalogIconsBaseUrl?: string;
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
    auth: {
      backendBaseUrl: env.AUTH_BACKEND_BASE_URL,
      appScheme: env.AUTH_APP_SCHEME,
      stateSecret: env.AUTH_STATE_SECRET,
    },
    logging: {
      level: env.LOG_LEVEL,
      format: env.LOG_FORMAT,
    },
    sentry: env.SENTRY_DSN
      ? {
          dsn: env.SENTRY_DSN,
          environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
          tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
        }
      : undefined,
    catalogIconsBaseUrl:
      env.CATALOG_ICONS_BASE_URL && env.CATALOG_ICONS_BASE_URL.trim() !== ''
        ? env.CATALOG_ICONS_BASE_URL.replace(/\/$/, '')
        : undefined,
  };

  return config;
};
