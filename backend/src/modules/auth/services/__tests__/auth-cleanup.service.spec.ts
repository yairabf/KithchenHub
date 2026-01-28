import { Test, TestingModule } from '@nestjs/testing';
import { AuthCleanupService } from '../auth-cleanup.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

describe('AuthCleanupService', () => {
  let service: AuthCleanupService;

  const mockPrismaService = {
    syncIdempotencyKey: {
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCleanupService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthCleanupService>(AuthCleanupService);
    module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanupOldIdempotencyKeys', () => {
    it('should delete completed keys older than retention period', async () => {
      const retentionDays = 30;
      const deletedCount = 5;

      mockPrismaService.syncIdempotencyKey.deleteMany.mockResolvedValue({
        count: deletedCount,
      });

      const result = await service.cleanupOldIdempotencyKeys(retentionDays);

      expect(result).toBe(deletedCount);
      expect(
        mockPrismaService.syncIdempotencyKey.deleteMany,
      ).toHaveBeenCalledWith({
        where: {
          status: 'COMPLETED',
          processedAt: {
            not: null,
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should use default retention of 30 days when not specified', async () => {
      mockPrismaService.syncIdempotencyKey.deleteMany.mockResolvedValue({
        count: 0,
      });

      await service.cleanupOldIdempotencyKeys();

      const call =
        mockPrismaService.syncIdempotencyKey.deleteMany.mock.calls[0][0];
      const cutoffDate = call.where.processedAt.lt;
      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 30);

      // Allow 1 second difference for test execution time
      expect(
        Math.abs(cutoffDate.getTime() - expectedCutoff.getTime()),
      ).toBeLessThan(1000);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      mockPrismaService.syncIdempotencyKey.deleteMany.mockRejectedValue(error);

      await expect(service.cleanupOldIdempotencyKeys(30)).rejects.toThrow(
        'Database error',
      );
    });

    it('should only delete COMPLETED keys with processedAt', async () => {
      mockPrismaService.syncIdempotencyKey.deleteMany.mockResolvedValue({
        count: 0,
      });

      await service.cleanupOldIdempotencyKeys(30);

      const call =
        mockPrismaService.syncIdempotencyKey.deleteMany.mock.calls[0][0];
      expect(call.where.status).toBe('COMPLETED');
      expect(call.where.processedAt).toEqual({
        not: null,
        lt: expect.any(Date),
      });
    });
  });

  describe('handleScheduledCleanup', () => {
    it('should call cleanupOldIdempotencyKeys with 30 days retention', async () => {
      mockPrismaService.syncIdempotencyKey.deleteMany.mockResolvedValue({
        count: 10,
      });

      await service.handleScheduledCleanup();

      expect(
        mockPrismaService.syncIdempotencyKey.deleteMany,
      ).toHaveBeenCalled();
      const call =
        mockPrismaService.syncIdempotencyKey.deleteMany.mock.calls[0][0];
      const cutoffDate = call.where.processedAt.lt;
      const expectedCutoff = new Date();
      expectedCutoff.setDate(expectedCutoff.getDate() - 30);

      expect(
        Math.abs(cutoffDate.getTime() - expectedCutoff.getTime()),
      ).toBeLessThan(1000);
    });

    it('should handle cleanup errors without throwing', async () => {
      const error = new Error('Cleanup failed');
      mockPrismaService.syncIdempotencyKey.deleteMany.mockRejectedValue(error);

      // Should not throw
      await expect(service.handleScheduledCleanup()).resolves.not.toThrow();
    });
  });

  describe('getIdempotencyKeyStats', () => {
    it('should return statistics about idempotency keys', async () => {
      mockPrismaService.syncIdempotencyKey.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // completed
        .mockResolvedValueOnce(15) // pending
        .mockResolvedValueOnce(5) // failed
        .mockResolvedValueOnce(20); // oldCompleted

      const stats = await service.getIdempotencyKeyStats();

      expect(stats).toEqual({
        total: 100,
        completed: 80,
        pending: 15,
        failed: 5,
        oldCompleted: 20,
      });

      expect(mockPrismaService.syncIdempotencyKey.count).toHaveBeenCalledTimes(
        5,
      );
    });

    it('should calculate oldCompleted keys correctly (30 days ago)', async () => {
      mockPrismaService.syncIdempotencyKey.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getIdempotencyKeyStats();

      // Check the last call (oldCompleted)
      const lastCall =
        mockPrismaService.syncIdempotencyKey.count.mock.calls[4][0];
      expect(lastCall.where.status).toBe('COMPLETED');
      expect(lastCall.where.processedAt).toEqual({
        not: null,
        lt: expect.any(Date),
      });

      const cutoffDate = lastCall.where.processedAt.lt;
      const expectedCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      expect(
        Math.abs(cutoffDate.getTime() - expectedCutoff.getTime()),
      ).toBeLessThan(1000);
    });
  });
});
