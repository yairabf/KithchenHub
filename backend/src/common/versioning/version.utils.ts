import { Request } from 'express';

/**
 * Extended request interface that includes version information from NestJS versioning.
 */
export interface VersionedRequest extends Request {
  version?: string | string[];
}

/**
 * Extracts API version from request URL or NestJS versioning metadata.
 *
 * Checks both:
 * 1. URL path pattern: /api/v1/... or /api/v2/...
 * 2. NestJS versioning metadata (request.version)
 *
 * @param request - Express/Fastify request object
 * @returns Version string (e.g., "1", "2") or null if not found
 */
export function extractVersionFromRequest(
  request: VersionedRequest,
): string | null {
  // Extract version from URL path: /api/v1/... or /api/v2/...
  // Pattern matches: /api/v1/, /api/v2/, /api/v1?query, /api/v1#fragment
  const pathMatch = request.url.match(/^\/api\/v(\d+)(?:\/|$|\?|#)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  // Also check the version from NestJS versioning (if available)
  if (request.version) {
    const version = Array.isArray(request.version)
      ? request.version[0]
      : request.version;
    return typeof version === 'string' ? version : null;
  }

  return null;
}
