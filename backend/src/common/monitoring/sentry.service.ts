import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AppConfig } from '../../config/configuration';

/**
 * Sentry service for error tracking and performance monitoring.
 * Initializes Sentry SDK with environment-aware configuration.
 * Gracefully degrades if Sentry DSN is not provided.
 */
@Injectable()
export class SentryService implements OnModuleInit {
  private isInitialized = false;

  constructor(private readonly config: AppConfig) {}

  onModuleInit(): void {
    this.initializeSentry();
  }

  /**
   * Initializes Sentry SDK if DSN is configured.
   * If DSN is not provided, Sentry is disabled (graceful degradation).
   * Note: Sentry is initialized in main.ts before NestJS bootstrap for early error capture.
   * This method checks if Sentry is already initialized to avoid double initialization.
   */
  private initializeSentry(): void {
    if (!this.config.sentry?.dsn) {
      // Sentry is optional - gracefully degrade if not configured
      return;
    }

    // Check if Sentry is already initialized (e.g., from main.ts)
    try {
      // If Sentry is already initialized, just mark as ready
      if (Sentry.getCurrentHub().getClient()) {
        this.isInitialized = true;
        return;
      }
    } catch {
      // Sentry not initialized yet, continue with initialization
    }

    try {
      Sentry.init({
        dsn: this.config.sentry.dsn,
        environment: this.config.sentry.environment || this.config.env,
        tracesSampleRate: this.config.sentry.tracesSampleRate,
        // HTTP request tracing is automatically enabled in Sentry v8
        // Filter out health check endpoints from performance monitoring
        ignoreTransactions: ['GET /api/health', 'GET /api/health/live'],
      });

      this.isInitialized = true;
    } catch (error) {
      // Log error but don't fail application startup
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Checks if Sentry is initialized and ready to use.
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Captures an exception and sends it to Sentry.
   * @param error - The error to capture
   * @param context - Additional context to include
   */
  captureException(
    error: Error,
    context?: {
      userId?: string;
      householdId?: string;
      requestId?: string;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    },
  ): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.withScope((scope) => {
      // Add user context
      if (context?.userId) {
        scope.setUser({
          id: context.userId,
        });
      }

      // Add tags
      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Add extra context
      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Add request ID for correlation
      if (context?.requestId) {
        scope.setTag('requestId', context.requestId);
        scope.setExtra('requestId', context.requestId);
      }

      // Add household ID if available
      if (context?.householdId) {
        scope.setTag('householdId', context.householdId);
      }

      Sentry.captureException(error);
    });
  }

  /**
   * Captures a message and sends it to Sentry.
   * @param message - The message to capture
   * @param level - The severity level
   * @param context - Additional context
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: {
      userId?: string;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
    },
  ): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      if (context?.extra) {
        Object.entries(context.extra).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      Sentry.captureMessage(message, level);
    });
  }

  /**
   * Sets user context for all subsequent events.
   * @param user - User information
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.setUser(user);
  }

  /**
   * Adds breadcrumb for debugging.
   * @param breadcrumb - Breadcrumb information
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.isInitialized) {
      return;
    }

    Sentry.addBreadcrumb(breadcrumb);
  }
}
