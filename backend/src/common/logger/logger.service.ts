import { Injectable, Logger } from '@nestjs/common';

/**
 * Application-wide logger service.
 * Provides structured logging with context.
 */
@Injectable()
export class AppLogger extends Logger {
  logError(message: string, error: Error, context?: Record<string, unknown>): void {
    this.error(message, {
      ...context,
      error: error.message,
      stack: error.stack,
    });
  }
}
