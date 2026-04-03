import { Test, TestingModule } from '@nestjs/testing';
import { ShoppingService } from './shopping.service';
import { ShoppingRepository } from '../repositories/shopping.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { MemoryCacheService } from '../../../infrastructure/cache';
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
  let cache: MemoryCacheService;

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
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: MemoryCacheService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            invalidateByPrefix: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ShoppingService>(ShoppingService);
    repository = module.get<ShoppingRepository>(ShoppingRepository);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<MemoryCacheService>(MemoryCacheService);
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
    describe('empty / blank queries should skip DB call', () => {
      it.each([
        ['whitespace-only', '   '],
        ['empty string', ''],
        ['single space', ' '],
      ])('should return [] for %s input', async (_label, input) => {
        const result = await service.searchGroceries(input);
        expect(result).toEqual([]);
        expect(prisma.$queryRaw).not.toHaveBeenCalled();
      });
    });

    describe('DTO mapping from raw SQL rows', () => {
      it.each([
        [
          'English result with all fields',
          'apple',
          'en',
          {
            catalog_id: 'g1',
            match_name: 'Apple',
            category: 'Fruits',
            default_unit: 'kg',
            image_url: 'items_images/apple.png',
            default_quantity: 3,
            match_score: 1000,
          },
          {
            id: 'g1',
            name: 'Apple',
            category: 'Fruits',
            defaultUnit: 'kg',
            defaultQuantity: 3,
          },
        ],
        [
          'Hebrew result with nullable fields',
          'עגב',
          'he',
          {
            catalog_id: 'g2',
            match_name: 'עגבנייה',
            category: 'Vegetables',
            default_unit: null,
            image_url: null,
            default_quantity: null,
            match_score: 900,
          },
          {
            id: 'g2',
            name: 'עגבנייה',
            category: 'Vegetables',
            defaultUnit: undefined,
            defaultQuantity: 1,
          },
        ],
      ])(
        'should correctly map %s',
        async (_label, query, lang, rawRow, expectedPartial) => {
          (prisma.$queryRaw as jest.Mock).mockResolvedValue([rawRow]);

          const result = await service.searchGroceries(query, lang);

          expect(prisma.$queryRaw).toHaveBeenCalled();
          expect(result[0]).toEqual(expect.objectContaining(expectedPartial));
        },
      );
    });

    it('should return cached results on cache hit without querying DB', async () => {
      const cachedResults = [
        { id: 'g1', name: 'Apple', category: 'Fruits', defaultQuantity: 1 },
      ];
      (cache.get as jest.Mock).mockReturnValue(cachedResults);

      const result = await service.searchGroceries('apple', 'en');

      expect(result).toBe(cachedResults);
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should populate cache after a successful query', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        {
          catalog_id: 'g1',
          match_name: 'Apple',
          category: 'Fruits',
          default_unit: null,
          image_url: null,
          default_quantity: 1,
          match_score: 1000,
        },
      ]);

      await service.searchGroceries('apple', 'en');

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('catalog_search:en:apple'),
        expect.any(Array),
        expect.any(Number),
      );
    });

    it('should propagate database errors from $queryRaw', async () => {
      const dbError = new Error('Connection refused');
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(dbError);

      await expect(service.searchGroceries('apple', 'en')).rejects.toThrow(
        'Connection refused',
      );
    });

    describe('locale normalization (underscore → hyphen)', () => {
      it.each([
        ['pt_BR', 'pt-br'],
        ['en_US', 'en-us'],
        ['he_IL', 'he-il'],
        ['zh_Hans_CN', 'zh-hans-cn'],
        ['pt-BR', 'pt-br'],
        ['en', 'en'],
      ])(
        'should normalize %s to %s in the cache key',
        async (inputLang, expectedNormalized) => {
          (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

          await service.searchGroceries('test', inputLang);

          expect(cache.set).toHaveBeenCalledWith(
            `catalog_search:${expectedNormalized}:test`,
            expect.any(Array),
            expect.any(Number),
          );
        },
      );
    });

    /*
     * NOTE: Language-fallback ranking (exact lang > base lang > en) is now
     * handled inside the search_catalog() SQL function. Unit testing the
     * JS layer can no longer cover this logic — it needs integration tests
     * against a real PostgreSQL instance. See migration file:
     * 20260403090000_add_catalog_search_function/migration.sql
     */
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
