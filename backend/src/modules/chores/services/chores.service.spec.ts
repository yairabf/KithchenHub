import { Test, TestingModule } from '@nestjs/testing';
import { ChoresService } from './chores.service';
import { ChoresRepository } from '../repositories/chores.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Chores Service Unit Tests
 *
 * Tests soft-delete behavior and business logic for chores.
 */
describe('ChoresService - Soft-Delete Behavior', () => {
  let service: ChoresService;
  let repository: ChoresRepository;

  const mockHouseholdId = 'household-123';
  const mockChoreId = 'chore-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChoresService,
        {
          provide: ChoresRepository,
          useValue: {
            findChoresByHousehold: jest.fn(),
            findChoreById: jest.fn(),
            createChore: jest.fn(),
            updateChore: jest.fn(),
            toggleCompletion: jest.fn(),
            countChoresByHousehold: jest.fn(),
            deleteChore: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChoresService>(ChoresService);
    repository = module.get<ChoresRepository>(ChoresRepository);
  });

  describe('getChores', () => {
    it('should return only active chores (exclude soft-deleted)', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockChores = [
        {
          id: 'chore-1',
          householdId: mockHouseholdId,
          title: 'Today Chore',
          assigneeId: null,
          assignee: null,
          dueDate: new Date(today.getTime() + 3600000), // 1 hour from start of today
          isCompleted: false,
          completedAt: null,
          repeat: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'chore-2',
          householdId: mockHouseholdId,
          title: 'Upcoming Chore',
          assigneeId: null,
          assignee: null,
          dueDate: new Date(tomorrow.getTime() + 3600000),
          isCompleted: false,
          completedAt: null,
          repeat: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      jest
        .spyOn(repository, 'findChoresByHousehold')
        .mockResolvedValue(mockChores as any);

      const result = await service.getChores(mockHouseholdId);

      expect(repository.findChoresByHousehold).toHaveBeenCalledWith(
        mockHouseholdId,
        { start: undefined, end: undefined },
      );
      expect(result.today).toHaveLength(1);
      expect(result.upcoming).toHaveLength(1);
      expect(result.today[0].title).toBe('Today Chore');
      expect(result.upcoming[0].title).toBe('Upcoming Chore');
    });
  });

  describe('getStats', () => {
    it('should count only active chores (exclude soft-deleted)', async () => {
      const mockStats = {
        total: 10,
        completed: 5,
      };

      jest
        .spyOn(repository, 'countChoresByHousehold')
        .mockResolvedValue(mockStats);

      const result = await service.getStats(mockHouseholdId);

      expect(repository.countChoresByHousehold).toHaveBeenCalledWith(
        mockHouseholdId,
        { date: undefined },
      );
      expect(result.total).toBe(10);
      expect(result.completed).toBe(5);
      expect(result.pending).toBe(5);
    });
  });

  describe('updateChore', () => {
    it('should update a chore successfully', async () => {
      const mockChore = {
        id: mockChoreId,
        householdId: mockHouseholdId,
        title: 'Original Title',
        assigneeId: null,
        assignee: null,
        dueDate: new Date(),
        isCompleted: false,
        completedAt: null,
        repeat: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockUpdatedChore = {
        ...mockChore,
        title: 'Updated Title',
      };

      jest
        .spyOn(repository, 'findChoreById')
        .mockResolvedValue(mockChore as any);
      jest
        .spyOn(repository, 'updateChore')
        .mockResolvedValue(mockUpdatedChore as any);

      const result = await service.updateChore(mockChoreId, mockHouseholdId, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if chore does not exist', async () => {
      jest.spyOn(repository, 'findChoreById').mockResolvedValue(null);

      await expect(
        service.updateChore(mockChoreId, mockHouseholdId, {
          title: 'New Title',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if chore belongs to different household', async () => {
      const mockChore = {
        id: mockChoreId,
        householdId: 'different-household',
        title: 'Test Chore',
        assigneeId: null,
        dueDate: new Date(),
        isCompleted: false,
        completedAt: null,
        repeat: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest
        .spyOn(repository, 'findChoreById')
        .mockResolvedValue(mockChore as any);

      await expect(
        service.updateChore(mockChoreId, mockHouseholdId, {
          title: 'New Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleCompletion', () => {
    it('should toggle chore completion status', async () => {
      const mockChore = {
        id: mockChoreId,
        householdId: mockHouseholdId,
        title: 'Test Chore',
        assigneeId: null,
        dueDate: new Date(),
        isCompleted: false,
        completedAt: null,
        repeat: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockStats = {
        total: 10,
        completed: 6,
      };

      jest
        .spyOn(repository, 'findChoreById')
        .mockResolvedValue(mockChore as any);
      jest.spyOn(repository, 'toggleCompletion').mockResolvedValue(undefined);
      jest
        .spyOn(repository, 'countChoresByHousehold')
        .mockResolvedValue(mockStats);

      const result = await service.toggleCompletion(
        mockChoreId,
        mockHouseholdId,
        {
          isCompleted: true,
        },
      );

      expect(repository.toggleCompletion).toHaveBeenCalledWith(
        mockChoreId,
        true,
      );
      expect(result.progress.total).toBe(10);
      expect(result.progress.completed).toBe(6);
      expect(result.progress.pending).toBe(4);
    });
  });

  describe('deleteChore', () => {
    it('should throw NotFoundException when chore does not exist', async () => {
      jest.spyOn(repository, 'findChoreById').mockResolvedValue(null);

      await expect(
        service.deleteChore(mockChoreId, mockHouseholdId),
      ).rejects.toThrow(NotFoundException);
      expect(repository.deleteChore).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when chore belongs to different household', async () => {
      const mockChore = {
        id: mockChoreId,
        householdId: 'other-household',
        title: 'Test Chore',
        assigneeId: null,
        assignee: null,
        dueDate: new Date(),
        isCompleted: false,
        completedAt: null,
        repeat: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      jest
        .spyOn(repository, 'findChoreById')
        .mockResolvedValue(mockChore as any);

      await expect(
        service.deleteChore(mockChoreId, mockHouseholdId),
      ).rejects.toThrow(ForbiddenException);
      expect(repository.deleteChore).not.toHaveBeenCalled();
    });

    it('should call repository deleteChore when chore exists and household matches', async () => {
      const mockChore = {
        id: mockChoreId,
        householdId: mockHouseholdId,
        title: 'Test Chore',
        assigneeId: null,
        assignee: null,
        dueDate: new Date(),
        isCompleted: false,
        completedAt: null,
        repeat: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      jest
        .spyOn(repository, 'findChoreById')
        .mockResolvedValue(mockChore as any);
      jest.spyOn(repository, 'deleteChore').mockResolvedValue(undefined);

      await service.deleteChore(mockChoreId, mockHouseholdId);

      expect(repository.findChoreById).toHaveBeenCalledWith(mockChoreId);
      expect(repository.deleteChore).toHaveBeenCalledWith(mockChoreId);
    });
  });
});
