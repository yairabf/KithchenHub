import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for deprecation information
 */
export const DEPRECATION_METADATA_KEY = 'deprecation';

/**
 * Options for endpoint-level deprecation
 */
export interface DeprecationOptions {
  /**
   * Date when the endpoint will be removed (sunset date)
   */
  sunsetDate?: Date;

  /**
   * URL to migration guide for this endpoint
   */
  migrationGuide?: string;
}

/**
 * Decorator to mark an endpoint as deprecated.
 *
 * This is for rare cases where individual endpoints within a current version
 * need to be deprecated. For version-wide deprecation, use the version
 * constants in api-version.constants.ts.
 *
 * @example
 * ```typescript
 * @Get('old-endpoint')
 * @Deprecated({ sunsetDate: new Date('2026-12-31'), migrationGuide: 'https://docs.example.com/migration' })
 * async oldEndpoint() {
 *   // ...
 * }
 * ```
 */
export const Deprecated = (options?: DeprecationOptions) =>
  SetMetadata(DEPRECATION_METADATA_KEY, options || {});
