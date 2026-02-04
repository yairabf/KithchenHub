import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingService } from './shopping.service';
import { ShoppingRepository } from '../repositories/shopping.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Shopping Service Unit Tests
 *
 * Tests soft-delete behavior and business logic for shopping lists and items.
 */
describe('ShoppingService - Soft-Delete Behavior', () => {
  let service: ShoppingService;
  let repository: ShoppingRepository;
  let prisma: PrismaService;

  const mockHouseholdId = 'household-123';
  const mockListId = 'list-123';
  const mockItemId = 'item-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingService,
        {
          provide: ShoppingRepository,
          useValue: {
            findListById: jest.fn(),
            findListWithItems: jest.fn(),
            findItemById: jest.fn(),
            deleteList: jest.fn(),
            deleteItem: jest.fn(),
            createList: jest.fn(),
            createItem: jest.fn(),
            updateItem: jest.fn(),
            findCustomItemByName: jest.fn(),
            createCustomItem: jest.fn(),
            findCustomItems: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            shoppingList: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
            },
            masterGroceryCatalog: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ShoppingService>(ShoppingService);
    repository = module.get<ShoppingRepository>(ShoppingRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('deleteList', () => {
    it('should soft-delete a shopping list', async () => {
      const mockList = {
        id: mockListId,
        householdId: mockHouseholdId,
        name: 'Test List',
        color: null,
        icon: null,
        isMain: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findListById').mockResolvedValue(mockList);
      jest.spyOn(repository, 'deleteList').mockResolvedValue(undefined);

      await service.deleteList(mockListId, mockHouseholdId);

      expect(repository.findListById).toHaveBeenCalledWith(mockListId);
      expect(repository.deleteList).toHaveBeenCalledWith(mockListId);
    });

    it('should throw NotFoundException if list does not exist', async () => {
      jest.spyOn(repository, 'findListById').mockResolvedValue(null);

      await expect(
        service.deleteList(mockListId, mockHouseholdId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if list belongs to different household', async () => {
      const mockList = {
        id: mockListId,
        householdId: 'different-household',
        name: 'Test List',
        color: null,
        icon: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findListById').mockResolvedValue(mockList);

      await expect(
        service.deleteList(mockListId, mockHouseholdId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteItem', () => {
    it('should soft-delete a shopping item', async () => {
      const mockItem = {
        id: mockItemId,
        listId: mockListId,
        catalogItemId: null,
        customItemId: null,
        name: 'Test Item',
        quantity: 1,
        unit: null,
        isChecked: false,
        category: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockList = {
        id: mockListId,
        householdId: mockHouseholdId,
        name: 'Test List',
        color: null,
        icon: null,
        isMain: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findItemById').mockResolvedValue(mockItem);
      jest.spyOn(repository, 'findListById').mockResolvedValue(mockList);
      jest.spyOn(repository, 'deleteItem').mockResolvedValue(undefined);

      await service.deleteItem(mockItemId, mockHouseholdId);

      expect(repository.findItemById).toHaveBeenCalledWith(mockItemId);
      expect(repository.findListById).toHaveBeenCalledWith(mockListId);
      expect(repository.deleteItem).toHaveBeenCalledWith(mockItemId);
    });

    it('should throw NotFoundException if item does not exist', async () => {
      jest.spyOn(repository, 'findItemById').mockResolvedValue(null);

      await expect(
        service.deleteItem(mockItemId, mockHouseholdId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if item belongs to different household', async () => {
      const mockItem = {
        id: mockItemId,
        listId: mockListId,
        catalogItemId: null,
        customItemId: null,
        name: 'Test Item',
        quantity: 1,
        unit: null,
        isChecked: false,
        category: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockList = {
        id: mockListId,
        householdId: 'different-household',
        name: 'Test List',
        color: null,
        icon: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findItemById').mockResolvedValue(mockItem);
      jest.spyOn(repository, 'findListById').mockResolvedValue(mockList);

      await expect(
        service.deleteItem(mockItemId, mockHouseholdId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getLists', () => {
    it('should return only active shopping lists (exclude soft-deleted)', async () => {
      const mockLists = [
        {
          id: 'list-1',
          name: 'Active List',
          color: null,
          householdId: mockHouseholdId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _count: { items: 5 },
        },
      ];

      jest
        .spyOn(prisma.shoppingList, 'findMany')
        .mockResolvedValue(mockLists as any);

      const result = await service.getLists(mockHouseholdId);

      expect(prisma.shoppingList.findMany).toHaveBeenCalledWith({
        where: {
          householdId: mockHouseholdId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              items: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Active List');
    });
  });

  describe('getListDetails', () => {
    it('should return only active items in list details', async () => {
      const mockList = {
        id: mockListId,
        name: 'Test List',
        color: null,
        icon: null,
        isMain: false,
        householdId: mockHouseholdId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        items: [
          {
            id: 'item-1',
            listId: mockListId,
            catalogItemId: null,
            customItemId: null,
            name: 'Active Item',
            quantity: 1,
            unit: null,
            isChecked: false,
            category: null,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
      };

      jest
        .spyOn(repository, 'findListWithItems')
        .mockResolvedValue(mockList as any);

      const result = await service.getListDetails(mockListId, mockHouseholdId);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Active Item');
    });
  });

  describe('getCustomItems', () => {
    it('should return custom items from repository', async () => {
      const mockCustomItems = [
        {
          id: 'ci-1',
          householdId: mockHouseholdId,
          name: 'Custom Item',
          category: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest
        .spyOn(repository, 'findCustomItems')
        .mockResolvedValue(mockCustomItems as any);

      const result = await service.getCustomItems(mockHouseholdId);

      expect(repository.findCustomItems).toHaveBeenCalledWith(mockHouseholdId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Custom Item');
    });
  });
});
