import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../users.repository';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'Member',
    createdAt: new Date(),
    householdId: 'household-1',
    household: {
      id: 'household-1',
      name: 'Test Household',
      deletedAt: null,
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    recipe: {
      findMany: jest.fn(),
    },
    shoppingList: {
      findMany: jest.fn(),
    },
    chore: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    jest.clearAllMocks();
  });

  describe('getUserExportData', () => {
    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.getUserExportData('user-1');

      expect(result).toBeNull();
      expect(mockPrismaService.recipe.findMany).not.toHaveBeenCalled();
    });

    it('should return export data with household when user has household', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.recipe.findMany.mockResolvedValue([
        { id: 'r1', title: 'Recipe 1' },
      ]);
      mockPrismaService.shoppingList.findMany.mockResolvedValue([
        { id: 'l1', name: 'List 1', items: [] },
      ]);
      mockPrismaService.chore.findMany.mockResolvedValue([
        { id: 'c1', title: 'Chore 1' },
      ]);

      const result = await repository.getUserExportData('user-1');

      expect(result).not.toBeNull();
      expect(result!.user.id).toBe('user-1');
      expect(result!.user.email).toBe('test@example.com');
      expect(result!.household).toEqual({
        id: 'household-1',
        name: 'Test Household',
        role: 'Member',
      });
      expect(result!.recipes).toHaveLength(1);
      expect(result!.shoppingLists).toHaveLength(1);
      expect(result!.assignedChores).toHaveLength(1);
    });

    it('should return export data with null household when household is soft-deleted', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        household: {
          id: 'household-1',
          name: 'Test Household',
          deletedAt: new Date(),
        },
      });
      mockPrismaService.recipe.findMany.mockResolvedValue([]);
      mockPrismaService.shoppingList.findMany.mockResolvedValue([]);
      mockPrismaService.chore.findMany.mockResolvedValue([]);

      const result = await repository.getUserExportData('user-1');

      expect(result).not.toBeNull();
      expect(result!.household).toBeNull();
      expect(result!.recipes).toHaveLength(0);
    });

    it('should return export data with null household when user has no household', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        householdId: null,
        household: null,
      });

      const result = await repository.getUserExportData('user-1');

      expect(result).not.toBeNull();
      expect(result!.household).toBeNull();
      expect(mockPrismaService.recipe.findMany).not.toHaveBeenCalled();
    });
  });
});
