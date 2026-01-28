import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  isVersionSupported,
  isVersionSunset,
  getVersionMetadata,
} from './versioning.config';
import { extractVersionFromRequest } from './version.utils';
import { SUPPORTED_API_VERSIONS } from './api-version.constants';

/**
 * Guard that validates API version in requests.
 *
 * - Returns 404 for unknown/unsupported versions (matches "route not found" semantics)
 * - Returns 410 Gone for sunset versions (with clear error message)
 * - Allows requests through for supported/deprecated versions
 * - Skips validation for intentionally unversioned routes (e.g., /api/version)
 */
@Injectable()
export class VersionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get URL path - handle both Express and Fastify
    // Fastify: request.routerPath (route path) or request.url (full URL with query)
    // Express: request.url (full URL with query)
    const fastifyRequest = request as any;
    const urlPath = fastifyRequest.routerPath || request.url?.split('?')[0] || request.url;
    const fullUrl = request.url || '';
    
    // Skip version validation for intentionally unversioned routes
    // /api/version is the version discovery endpoint and must remain unversioned
    // Check both the route path and the full URL to handle both Express and Fastify
    if (
      urlPath === '/api/version' ||
      urlPath === '/version' ||
      fullUrl === '/api/version' ||
      fullUrl.startsWith('/api/version?') ||
      fullUrl.startsWith('/api/version#')
    ) {
      return true;
    }
    
    const version = extractVersionFromRequest(request);

    if (!version) {
      // NestJS routing should prevent this, but fail safe
      // Requests to /api/* without version should return 404
      throw new NotFoundException(
        'API version is required. Use /api/v1/* or /api/v2/* format.',
      );
    }

    if (isVersionSunset(version)) {
      const metadata = getVersionMetadata(version);
      const message = `API version ${version} has been sunset and is no longer available.`;
      const migrationGuide = metadata?.migrationGuide;

      throw new GoneException(
        migrationGuide
          ? `${message} See ${migrationGuide} for migration instructions.`
          : message,
      );
    }

    if (!isVersionSupported(version)) {
      // Unknown/unsupported version - return 404 to match "route not found" semantics
      throw new NotFoundException(
        `API version ${version} is not supported. Supported versions: ${SUPPORTED_API_VERSIONS.join(', ')}`,
      );
    }

    return true;
  }
}
