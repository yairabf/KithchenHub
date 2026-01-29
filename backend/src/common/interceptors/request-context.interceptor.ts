import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Request context interceptor that adds correlation IDs to requests.
 * Generates a unique requestId for each request and adds it to:
 * - Request object (for use in controllers/services)
 * - Response headers (X-Request-Id)
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    // Generate or use existing request ID
    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();

    // Add requestId to request object for use in controllers/services
    (request as FastifyRequest & { requestId: string }).requestId = requestId;

    // Add requestId to response headers
    response.header('X-Request-Id', requestId);

    return next.handle();
  }
}
