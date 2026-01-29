import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * Health check service that performs various health checks.
 * Used by health check endpoints to determine application status.
 */
@Injectable()
export class HealthService {
  private readonly startTime = Date.now();
  private readonly version = process.env.npm_package_version || '0.0.1';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs a basic health check (liveness probe).
   * Returns healthy if the application is running.
   */
  async checkLiveness(): Promise<{ status: 'healthy'; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Performs a readiness check.
   * Checks if critical dependencies (database) are available.
   */
  async checkReadiness(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    checks: {
      database: { status: 'up' | 'down' };
    };
  }> {
    const databaseCheck = await this.checkDatabase();

    const status = databaseCheck.status === 'up' ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: databaseCheck.status,
        },
      },
    };
  }

  /**
   * Performs a detailed health check.
   * Includes all checks: database, memory, uptime.
   */
  async checkDetailed(): Promise<HealthCheckResult> {
    const [databaseCheck, memoryCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (databaseCheck.status === 'down') {
      status = 'unhealthy';
    } else if (memoryCheck.percentage > 90) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      checks: {
        database: databaseCheck,
        memory: memoryCheck,
      },
    };
  }

  /**
   * Checks database connectivity and measures latency.
   */
  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    latency?: number;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        status: 'up',
        latency,
      };
    } catch (error) {
      // Log error for debugging but don't fail health check
      // Using console.error since logger might not be available during health checks
      console.error('Database health check failed:', error);
      return {
        status: 'down',
      };
    }
  }

  /**
   * Checks memory usage.
   */
  private async checkMemory(): Promise<{
    used: number;
    total: number;
    percentage: number;
  }> {
    const usage = process.memoryUsage();
    const used = usage.heapUsed;
    const total = usage.heapTotal;
    const percentage = Math.round((used / total) * 100);

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage,
    };
  }
}
