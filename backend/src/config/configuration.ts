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
    skipEmailVerification: boolean;
  };
  /**
   * Optional URL overrides for client legal links.
   * Always present at runtime; unset sides default to AUTH_BACKEND_BASE_URL + /privacy | /terms.
   */
  legal: {
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
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
  email?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    from: string;
    verificationTokenExpiryHours: number;
  };
}

let config: AppConfig | null = null;

/**
 * Reads CATALOG_ICONS_BASE_URL without running full env validation.
 * Used where relative catalog image paths must resolve without DATABASE_URL
 * and other required vars (e.g. unit tests, CI).
 */
export function readCatalogIconsBaseUrlFromEnv(): string | undefined {
  const raw = process.env.CATALOG_ICONS_BASE_URL;
  if (!raw || raw.trim() === '') {
    return undefined;
  }
  return raw.replace(/\/$/, '');
}

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
      skipEmailVerification: env.AUTH_SKIP_EMAIL_VERIFICATION,
    },
    legal: {
      privacyPolicyUrl: env.LEGAL_PRIVACY_POLICY_URL?.trim() || undefined,
      termsOfServiceUrl: env.LEGAL_TERMS_OF_SERVICE_URL?.trim() || undefined,
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
    catalogIconsBaseUrl: readCatalogIconsBaseUrlFromEnv(),
    email:
      env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
        ? {
            smtpHost: env.SMTP_HOST,
            smtpPort: env.SMTP_PORT,
            smtpUser: env.SMTP_USER,
            smtpPass: env.SMTP_PASS,
            from: env.EMAIL_FROM,
            verificationTokenExpiryHours:
              env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS,
          }
        : undefined,
  };

  return config;
};
