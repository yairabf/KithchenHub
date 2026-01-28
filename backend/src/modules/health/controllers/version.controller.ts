import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import {
  CURRENT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  DEPRECATED_API_VERSIONS,
  SUNSET_API_VERSIONS,
} from '../../../common/versioning/api-version.constants';

/**
 * Version discovery endpoint.
 *
 * This endpoint is intentionally NOT versioned (exception to version requirement)
 * to allow clients to discover available API versions before making versioned requests.
 *
 * Public endpoint - no authentication required.
 */
@Controller('version')
@Public()
export class VersionController {
  /**
   * Returns information about supported API versions.
   *
   * @returns Version metadata including current, supported, deprecated, and sunset versions
   */
  @Get()
  getVersionInfo() {
    return {
      current: CURRENT_API_VERSION,
      supported: [...SUPPORTED_API_VERSIONS],
      deprecated: [...DEPRECATED_API_VERSIONS],
      sunset: [...SUNSET_API_VERSIONS],
      docs: {
        v1: '/api/docs/v1',
        // v2: '/api/docs/v2', // when available
      },
    };
  }
}
