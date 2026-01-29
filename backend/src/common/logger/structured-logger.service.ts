import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';
import { AppConfig } from '../../config/configuration';

/**
 * Structured logger service using Pino.
 * Provides JSON-formatted logs for production and pretty-printed logs for development.
 */
@Injectable()
export class StructuredLoggerService implements LoggerService {
  private readonly logger: pino.Logger;

  constructor(config: AppConfig) {
    const isDevelopment = config.env === 'development';
    const isPretty = config.logging.format === 'pretty' || isDevelopment;

    const pinoOptions: pino.LoggerOptions = {
      level: config.logging.level,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    if (isPretty) {
      // Use pino-pretty for development
      // Import pino-pretty dynamically to avoid bundling in production
      try {
        const pinoPretty = require('pino-pretty');
        const stream = pinoPretty({
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        });
        this.logger = pino(pinoOptions, stream);
      } catch (error) {
        // Fallback to JSON if pino-pretty not available
        console.warn(
          'pino-pretty not available, using JSON format for logs',
        );
        this.logger = pino(pinoOptions);
      }
    } else {
      // Use JSON output for production
      this.logger = pino(pinoOptions);
    }
  }

  /**
   * Log a message at debug level
   */
  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  /**
   * Log a message at error level
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(
      {
        context,
        trace,
      },
      message,
    );
  }

  /**
   * Log a message at info level
   */
  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  /**
   * Log a message at warn level
   */
  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  /**
   * Log a message at verbose level (maps to debug)
   */
  verbose(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  /**
   * Log with custom context
   */
  logWithContext(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context: Record<string, unknown>,
  ): void {
    this.logger[level](context, message);
  }

  /**
   * Get the underlying Pino logger instance
   */
  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}
