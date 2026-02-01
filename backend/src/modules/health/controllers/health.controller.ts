import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { HealthService } from '../services/health.service';

/**
 * Health check controller.
 * Provides endpoints for monitoring application health.
 * All endpoints are public (no authentication required) for uptime monitoring.
 */
@Controller({ path: 'health', version: '1' })
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Basic health check endpoint.
   * Returns 200 OK if the application is running.
   * Used for simple liveness probes.
   *
   * @returns Basic health status
   */
  @Get()
  async checkHealth(): Promise<{ status: 'healthy'; timestamp: string }> {
    return this.healthService.checkLiveness();
  }

  /**
   * Liveness probe endpoint.
   * Returns 200 OK if the application is alive.
   * Used by container orchestration (Kubernetes, ECS, etc.) to determine if container should be restarted.
   *
   * @returns Liveness status
   */
  @Get('live')
  async checkLiveness(): Promise<{ status: 'healthy'; timestamp: string }> {
    return this.healthService.checkLiveness();
  }

  /**
   * Readiness probe endpoint.
   * Returns 200 OK if the application is ready to serve traffic.
   * Checks critical dependencies (database, etc.).
   * Used by load balancers to determine if traffic should be routed to this instance.
   *
   * @returns Readiness status with dependency checks
   */
  @Get('ready')
  async checkReadiness(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    checks: {
      database: { status: 'up' | 'down' };
    };
  }> {
    return this.healthService.checkReadiness();
  }

  /**
   * Detailed health check endpoint.
   * Returns comprehensive health information including:
   * - Overall status (healthy, degraded, unhealthy)
   * - Database connectivity and latency
   * - Memory usage
   * - Uptime
   * - Version information
   *
   * @returns Detailed health status
   */
  @Get('detailed')
  async checkDetailed() {
    return this.healthService.checkDetailed();
  }
}
