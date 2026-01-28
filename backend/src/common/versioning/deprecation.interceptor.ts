import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response, Request } from 'express';
import { isVersionDeprecated, getVersionMetadata } from './versioning.config';
import {
  DEPRECATION_METADATA_KEY,
  DeprecationOptions,
} from './deprecation.decorator';
import { extractVersionFromRequest } from './version.utils';

/**
 * Interceptor that adds deprecation headers to responses.
 *
 * Applies both:
 * - Version-wide deprecation headers (if the API version is deprecated)
 * - Endpoint-level deprecation headers (if the route is specifically deprecated)
 */
@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const version = extractVersionFromRequest(request);
    const endpointDeprecation = this.reflector.get<DeprecationOptions>(
      DEPRECATION_METADATA_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(() => {
        // Add version-wide deprecation headers if version is deprecated
        if (version && isVersionDeprecated(version)) {
          const versionMetadata = getVersionMetadata(version);
          this.addDeprecationHeaders(response, versionMetadata);
        }

        // Add endpoint-level deprecation headers if route is deprecated
        if (endpointDeprecation) {
          this.addEndpointDeprecationHeaders(response, endpointDeprecation);
        }
      }),
    );
  }

  private addDeprecationHeaders(
    response: Response,
    metadata: ReturnType<typeof getVersionMetadata>,
  ): void {
    if (!metadata) {
      return;
    }

    response.setHeader('Deprecation', 'true');

    if (metadata.sunsetAt) {
      response.setHeader('Sunset', metadata.sunsetAt.toUTCString());
    }

    if (metadata.migrationGuide) {
      response.setHeader(
        'Link',
        `<${metadata.migrationGuide}>; rel="deprecation"`,
      );
    }
  }

  private addEndpointDeprecationHeaders(
    response: Response,
    options: DeprecationOptions,
  ): void {
    response.setHeader('Deprecation', 'true');

    if (options.sunsetDate) {
      response.setHeader('Sunset', options.sunsetDate.toUTCString());
    }

    if (options.migrationGuide) {
      response.setHeader(
        'Link',
        `<${options.migrationGuide}>; rel="deprecation"`,
      );
    }
  }
}
