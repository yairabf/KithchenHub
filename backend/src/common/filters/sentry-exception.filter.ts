import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiResponse } from '../dtos/api-response.dto';
import { SentryService } from '../monitoring/sentry.service';
import { FastifyRequest } from 'fastify';

/**
 * Enhanced exception filter that reports errors to Sentry.
 * Extends the basic error handling with Sentry integration.
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  constructor(private readonly sentryService: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        message =
          typeof exceptionResponse.message === 'string'
            ? exceptionResponse.message
            : exceptionResponse.message[0] || message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Extract request context
    const requestId =
      (request as FastifyRequest & { requestId?: string }).requestId ||
      undefined;
    const userId =
      (request as FastifyRequest & { user?: { id?: string } }).user?.id ||
      undefined;
    const householdId =
      (
        request as FastifyRequest & {
          user?: { householdId?: string };
        }
      ).user?.householdId || undefined;

    // Report to Sentry only for server errors (5xx)
    // Client errors (4xx) are expected and don't need tracking
    if (status >= 500) {
      const error =
        exception instanceof Error
          ? exception
          : new Error(message || 'Unknown error');

      // Filter out sensitive data from request
      const sanitizedHeaders = this.sanitizeHeaders(request.headers);
      const sanitizedBody = this.sanitizeBody(request.body);

      this.sentryService.captureException(error, {
        userId,
        householdId,
        requestId,
        tags: {
          statusCode: status.toString(),
          method: request.method,
          path: request.url,
          environment: process.env.NODE_ENV || 'unknown',
        },
        extra: {
          url: request.url,
          method: request.method,
          headers: sanitizedHeaders,
          body: sanitizedBody,
          query: request.query,
        },
      });
    }

    // Send response
    response.status(status).send(ApiResponse.error(message));
  }

  /**
   * Sanitizes request headers to remove sensitive information.
   */
  private sanitizeHeaders(
    headers: FastifyRequest['headers'],
  ): Record<string, unknown> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];

    const sanitized: Record<string, unknown> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitizes request body to remove sensitive information.
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
    ];

    const sanitized: Record<string, unknown> = {};
    Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }
}
