import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { StructuredLoggerService } from '../logger/structured-logger.service';

/**
 * Logging interceptor that logs HTTP requests and responses.
 * Logs request start, completion, and errors with timing information.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly structuredLogger: StructuredLoggerService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const { method, url } = request;
    const requestId =
      (request as FastifyRequest & { requestId?: string }).requestId ||
      'unknown';
    const startTime = Date.now();

    // Extract user ID from request if available
    const userId =
      (request as FastifyRequest & { user?: { id?: string } }).user?.id ||
      undefined;

    // Log request start
    this.structuredLogger.logWithContext('info', 'Incoming request', {
      requestId,
      method,
      url,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.structuredLogger.logWithContext('info', 'Request completed', {
            requestId,
            method,
            url,
            statusCode,
            responseTime,
            userId,
          });
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          this.structuredLogger.logWithContext('error', 'Request failed', {
            requestId,
            method,
            url,
            statusCode,
            responseTime,
            error: error.message,
            stack: error.stack,
            userId,
          });
        },
      }),
    );
  }
}
