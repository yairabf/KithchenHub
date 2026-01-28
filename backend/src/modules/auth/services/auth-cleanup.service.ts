/**
 * Service for cleaning up old idempotency keys.
 *
 * Removes completed idempotency keys older than the retention period
 * to prevent unbounded table growth.
 *
 * **Scheduled Cleanup:**
 * To enable scheduled cleanup, install @nestjs/schedule:
 * ```bash
 * npm install @nestjs/schedule
 * ```
 *
 * Then in auth.module.ts:
 * 1. Import ScheduleModule: `import { ScheduleModule } from '@nestjs/schedule';`
 * 2. Add to imports: `ScheduleModule.forRoot()`
 *
 * Then uncomment the @Cron decorator on handleScheduledCleanup() method below.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Service for cleaning up old idempotency keys.
 *
 * Removes completed idempotency keys older than the retention period
 * to prevent unbounded table growth.
 */
@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  // Constants for date calculations
  private static readonly MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  private static readonly DEFAULT_RETENTION_DAYS = 30;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cleans up old idempotency keys that have been processed and are older than retention period.
   *
   * Only removes keys with status 'COMPLETED' and processedAt older than retentionDays.
   * Keeps PENDING and FAILED keys for manual review.
   *
   * @param retentionDays - Number of days to retain keys (default: 30)
   * @returns Number of keys deleted
   */
  async cleanupOldIdempotencyKeys(
    retentionDays: number = AuthCleanupService.DEFAULT_RETENTION_DAYS,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await this.prisma.syncIdempotencyKey.deleteMany({
        where: {
          status: 'COMPLETED',
          processedAt: {
            not: null,
            lt: cutoffDate,
          },
        },
      });

      this.logger.log('Cleaned up old idempotency keys', {
        deletedCount: result.count,
        retentionDays,
      });

      return result.count;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to cleanup old idempotency keys', {
        error: errorMessage,
        retentionDays,
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Scheduled job to cleanup old idempotency keys daily at 2 AM.
   *
   * Runs every day to remove completed keys older than 30 days.
   *
   * **To enable scheduled cleanup:**
   * 1. Install @nestjs/schedule: `npm install @nestjs/schedule`
   * 2. Import ScheduleModule in auth.module.ts and add to imports
   * 3. Uncomment the @Cron decorator below:
   *    ```typescript
   *    import { Cron, CronExpression } from '@nestjs/schedule';
   *    // ...
   *    @Cron(CronExpression.EVERY_DAY_AT_2AM)
   *    async handleScheduledCleanup(): Promise<void> {
   *    ```
   */
  async handleScheduledCleanup(): Promise<void> {
    this.logger.log('Running scheduled idempotency key cleanup');
    try {
      const deletedCount = await this.cleanupOldIdempotencyKeys(
        AuthCleanupService.DEFAULT_RETENTION_DAYS,
      );
      this.logger.log('Scheduled cleanup completed', {
        deletedCount,
      });
    } catch (error) {
      this.logger.error('Scheduled cleanup failed', {
        error: error instanceof Error ? error.message : String(error),
        originalError: error,
      });
    }
  }

  /**
   * Gets statistics about idempotency keys for monitoring.
   *
   * @returns Statistics about key counts by status
   */
  async getIdempotencyKeyStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    oldCompleted: number; // Completed keys older than 30 days
  }> {
    const [total, completed, pending, failed, oldCompleted] = await Promise.all(
      [
        this.prisma.syncIdempotencyKey.count(),
        this.prisma.syncIdempotencyKey.count({
          where: { status: 'COMPLETED' },
        }),
        this.prisma.syncIdempotencyKey.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.syncIdempotencyKey.count({
          where: { status: 'FAILED' },
        }),
        this.prisma.syncIdempotencyKey.count({
          where: {
            status: 'COMPLETED',
            processedAt: {
              not: null,
              lt: new Date(
                Date.now() -
                  AuthCleanupService.DEFAULT_RETENTION_DAYS *
                    AuthCleanupService.MILLISECONDS_PER_DAY,
              ),
            },
          },
        }),
      ],
    );

    return {
      total,
      completed,
      pending,
      failed,
      oldCompleted,
    };
  }
}
