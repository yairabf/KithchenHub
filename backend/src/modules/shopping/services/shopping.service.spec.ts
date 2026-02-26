import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingService } from './shopping.service';
import { ShoppingRepository } from '../repositories/shopping.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

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
        isMain: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findListById').mockResolvedValue(mockList);

      await expect(
        service.deleteList(mockListId, mockHouseholdId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when deleting the main list', async () => {
      const mockMainList = {
        id: mockListId,
        householdId: mockHouseholdId,
        name: 'Main List',
        color: null,
        icon: null,
        isMain: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findListById').mockResolvedValue(mockMainList);

      await expect(
        service.deleteList(mockListId, mockHouseholdId),
      ).rejects.toThrow(BadRequestException);

      expect(repository.deleteList).not.toHaveBeenCalled();
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
        isMain: false,
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

    it('should return localized catalog item names when lang is provided', async () => {
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
            catalogItemId: 'g1',
            customItemId: null,
            name: 'Canonical Tomato',
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
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Canonical Tomato',
          translations: [
            { lang: 'he', name: 'עגבנייה' },
            { lang: 'en', name: 'Tomato' },
          ],
        },
      ] as any);

      const result = await service.getListDetails(
        mockListId,
        mockHouseholdId,
        'he',
      );

      expect(result.items[0]?.name).toBe('עגבנייה');
    });

    it('should fallback to english and canonical names in list details', async () => {
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
            catalogItemId: 'g1',
            customItemId: null,
            name: 'Canonical Tomato',
            quantity: 1,
            unit: null,
            isChecked: false,
            category: null,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
          {
            id: 'item-2',
            listId: mockListId,
            catalogItemId: 'g2',
            customItemId: null,
            name: 'Canonical Onion',
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
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Canonical Tomato',
          translations: [{ lang: 'en', name: 'Tomato' }],
        },
        {
          id: 'g2',
          name: 'Canonical Onion',
          translations: [],
        },
      ] as any);

      const result = await service.getListDetails(
        mockListId,
        mockHouseholdId,
        'he',
      );

      expect(
        result.items.find((item) => item.catalogItemId === 'g1')?.name,
      ).toBe('Tomato');
      expect(
        result.items.find((item) => item.catalogItemId === 'g2')?.name,
      ).toBe('Canonical Onion');
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

  describe('searchGroceries', () => {
    it('should return empty array for blank query', async () => {
      const result = await service.searchGroceries('   ');

      expect(result).toEqual([]);
      expect(prisma.masterGroceryCatalog.findMany).not.toHaveBeenCalled();
    });

    it('should rank exact name matches above alias and partial matches', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g3',
          name: 'Appetizer Mix',
          category: 'Snacks',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [{ lang: 'en', name: 'Appetizer Mix' }],
          aliases: [{ alias: 'app' }],
        },
        {
          id: 'g1',
          name: 'Apple',
          category: 'Fruits',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [{ lang: 'en', name: 'Apple' }],
          aliases: [{ alias: 'Malus domestica' }],
        },
        {
          id: 'g2',
          name: 'Red Fruit',
          category: 'Fruits',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [{ lang: 'en', name: 'Red Fruit' }],
          aliases: [{ alias: 'Apple' }],
        },
      ] as any);

      const result = await service.searchGroceries('apple');

      expect(result.map((item) => item.id)).toEqual(['g1', 'g2', 'g3']);
    });

    it('should query requested language translations with english fallback', async () => {
      const findManySpy = jest
        .spyOn(prisma.masterGroceryCatalog, 'findMany')
        .mockResolvedValue([] as any);

      await service.searchGroceries('עגבניה', 'he');

      const args = findManySpy.mock.calls[0]?.[0] as {
        select: {
          translations: { where: { OR: Array<Record<string, unknown>> } };
          aliases: { where: { OR: Array<Record<string, unknown>> } };
        };
      };
      expect(args.select.translations.where.OR).toEqual(
        expect.arrayContaining([
          { lang: 'he' },
          { lang: { startsWith: 'he-' } },
          { lang: 'en' },
          { lang: { startsWith: 'en-' } },
        ]),
      );
      expect(args.select.aliases.where.OR).toEqual(
        expect.arrayContaining([
          { lang: 'he' },
          { lang: { startsWith: 'he-' } },
        ]),
      );
    });

    it('should return requested language translation when available', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Tomato',
          category: 'Vegetables',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [
            { lang: 'he', name: 'עגבנייה' },
            { lang: 'en', name: 'Tomato' },
          ],
          aliases: [],
        },
      ] as any);

      const result = await service.searchGroceries('עגב', 'he');

      expect(result).toEqual([
        expect.objectContaining({
          id: 'g1',
          name: 'עגבנייה',
        }),
      ]);
    });

    it('should fallback to english translation when requested language is missing', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Tomato Canonical',
          category: 'Vegetables',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [{ lang: 'en', name: 'Tomato' }],
          aliases: [],
        },
      ] as any);

      const result = await service.searchGroceries('tomato', 'he');

      expect(result[0]?.name).toBe('Tomato');
    });

    it('should fallback to canonical name when no translations exist', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Tomato Canonical',
          category: 'Vegetables',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [],
          aliases: [],
        },
      ] as any);

      const result = await service.searchGroceries('tomato', 'he');

      expect(result[0]?.name).toBe('Tomato Canonical');
    });

    it('should support locale variants for search queries', async () => {
      const findManySpy = jest
        .spyOn(prisma.masterGroceryCatalog, 'findMany')
        .mockResolvedValue([
          {
            id: 'g1',
            name: 'Tomato Canonical',
            category: 'Vegetables',
            defaultUnit: null,
            imageUrl: null,
            defaultQuantity: 1,
            translations: [{ lang: 'en', name: 'Tomato' }],
            aliases: [],
          },
        ] as any);

      const result = await service.searchGroceries('tomate', 'fr-CA');

      const args = findManySpy.mock.calls[0]?.[0] as {
        select: {
          translations: { where: { OR: Array<Record<string, unknown>> } };
        };
      };
      expect(args.select.translations.where.OR).toEqual(
        expect.arrayContaining([
          { lang: 'fr-ca' },
          { lang: 'fr' },
          { lang: { startsWith: 'fr-' } },
          { lang: 'en' },
        ]),
      );
      expect(result[0]?.name).toBe('Tomato');
    });
  });

  describe('getGroceriesByCategory', () => {
    it('should support locale variants for category queries', async () => {
      const findManySpy = jest
        .spyOn(prisma.masterGroceryCatalog, 'findMany')
        .mockResolvedValue([
          {
            id: 'g1',
            name: 'Tomato',
            category: 'Vegetables',
            defaultUnit: null,
            imageUrl: null,
            defaultQuantity: 1,
            translations: [{ lang: 'en', name: 'Tomato' }],
            aliases: [],
          },
        ] as any);

      await service.getGroceriesByCategory('Vegetables', 'he-IL', 20);

      const args = findManySpy.mock.calls[0]?.[0] as {
        select: {
          translations: { where: { OR: Array<Record<string, unknown>> } };
          aliases: { where: { OR: Array<Record<string, unknown>> } };
        };
      };
      expect(args.select.translations.where.OR).toEqual(
        expect.arrayContaining([
          { lang: 'he-il' },
          { lang: 'he' },
          { lang: { startsWith: 'he-' } },
          { lang: 'en' },
        ]),
      );
      expect(args.select.aliases.where.OR).toEqual(
        expect.arrayContaining([
          { lang: 'he-il' },
          { lang: 'he' },
          { lang: { startsWith: 'he-' } },
        ]),
      );
    });

    it('should return localized item names using requested language translations', async () => {
      const findManySpy = jest
        .spyOn(prisma.masterGroceryCatalog, 'findMany')
        .mockResolvedValue([
          {
            id: 'g1',
            name: 'Tomato',
            category: 'Vegetables',
            defaultUnit: null,
            imageUrl: null,
            defaultQuantity: 1,
            translations: [
              { lang: 'he', name: 'עגבנייה' },
              { lang: 'en', name: 'Tomato' },
            ],
            aliases: [],
          },
        ] as any);

      const result = await service.getGroceriesByCategory(
        'Vegetables',
        'he',
        20,
      );

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          select: expect.objectContaining({
            translations: {
              where: {
                OR: expect.arrayContaining([
                  { lang: 'he' },
                  { lang: { startsWith: 'he-' } },
                  { lang: 'en' },
                  { lang: { startsWith: 'en-' } },
                ]),
              },
              select: { lang: true, name: true },
            },
          }),
        }),
      );
      expect(result[0]?.name).toBe('עגבנייה');
    });

    it('should fallback to english translation in category browse when requested language is missing', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Tomato Canonical',
          category: 'Vegetables',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [{ lang: 'en', name: 'Tomato' }],
          aliases: [],
        },
      ] as any);

      const result = await service.getGroceriesByCategory(
        'Vegetables',
        'he',
        20,
      );

      expect(result[0]?.name).toBe('Tomato');
    });

    it('should fallback to canonical name in category browse when translations are missing', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Tomato Canonical',
          category: 'Vegetables',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [],
          aliases: [],
        },
      ] as any);

      const result = await service.getGroceriesByCategory(
        'Vegetables',
        'he',
        20,
      );

      expect(result[0]?.name).toBe('Tomato Canonical');
    });
  });

  describe('getCatalogDisplayNames', () => {
    it('should return localized names for catalog IDs', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Milk',
          category: 'dairy',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [
            { lang: 'he', name: 'חלב' },
            { lang: 'en', name: 'Milk' },
          ],
        },
        {
          id: 'g2',
          name: 'Bread',
          category: 'bakery',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [
            { lang: 'he', name: 'לחם' },
            { lang: 'en', name: 'Bread' },
          ],
        },
      ] as any);

      const result = await service.getCatalogDisplayNames(['g1', 'g2'], 'he');

      expect(prisma.masterGroceryCatalog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ['g1', 'g2'] } },
          select: expect.objectContaining({
            id: true,
            name: true,
            translations: expect.any(Object),
          }),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result.find((r) => r.id === 'g1')?.name).toBe('חלב');
      expect(result.find((r) => r.id === 'g2')?.name).toBe('לחם');
    });

    it('should return empty array for empty ids', async () => {
      const result = await service.getCatalogDisplayNames([], 'he');
      expect(result).toEqual([]);
      expect(prisma.masterGroceryCatalog.findMany).not.toHaveBeenCalled();
    });

    it('should fallback to English when requested lang has no translation', async () => {
      jest.spyOn(prisma.masterGroceryCatalog, 'findMany').mockResolvedValue([
        {
          id: 'g1',
          name: 'Tomato Canonical',
          category: 'Vegetables',
          defaultUnit: null,
          imageUrl: null,
          defaultQuantity: 1,
          translations: [{ lang: 'en', name: 'Tomato' }],
        },
      ] as any);

      const result = await service.getCatalogDisplayNames(['g1'], 'he');

      expect(result[0]).toEqual({ id: 'g1', name: 'Tomato' });
    });
  });
});
