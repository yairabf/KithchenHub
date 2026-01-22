/**
 * ShoppingService tests covering catalog-backed grocery search and item creation.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ShoppingService } from './shopping.service';
import { ShoppingRepository } from '../repositories/shopping.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

describe('ShoppingService', () => {
  let service: ShoppingService;
  let shoppingRepository: {
    findListById: jest.Mock;
    createItem: jest.Mock;
  };
  let prismaService: {
    masterGroceryCatalog: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const householdId = 'household-1';
  const listId = 'list-1';

  beforeEach(async () => {
    shoppingRepository = {
      findListById: jest.fn(),
      createItem: jest.fn(),
    };

    prismaService = {
      masterGroceryCatalog: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShoppingService,
        {
          provide: ShoppingRepository,
          useValue: shoppingRepository,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<ShoppingService>(ShoppingService);
  });

  describe('addItems', () => {
    beforeEach(() => {
      shoppingRepository.findListById.mockResolvedValue({
        id: listId,
        householdId,
      });
    });

    describe.each([
      [
        'uses catalog defaults when quantity/unit not provided',
        {
          catalogItemId: 'g1',
          quantity: undefined,
          unit: undefined,
          isChecked: true,
        },
        {
          id: 'g1',
          name: 'Banana',
          category: 'Fruits',
          defaultUnit: 'each',
          defaultQuantity: 6,
        },
        {
          name: 'Banana',
          category: 'Fruits',
          unit: 'each',
          quantity: 6,
          isChecked: true,
        },
      ],
      [
        'uses caller overrides for quantity/unit when provided',
        {
          catalogItemId: 'g2',
          quantity: 3,
          unit: 'lb',
        },
        {
          id: 'g2',
          name: 'Apples',
          category: 'Fruits',
          defaultUnit: 'each',
          defaultQuantity: 4,
        },
        {
          name: 'Apples',
          category: 'Fruits',
          unit: 'lb',
          quantity: 3,
          isChecked: false,
        },
      ],
      [
        'resolves legacy master item identifier',
        {
          masterItemId: 'g3',
          quantity: undefined,
          unit: undefined,
        },
        {
          id: 'g3',
          name: 'Green Apple',
          category: 'Fruits',
          defaultUnit: 'each',
          defaultQuantity: 4,
        },
        {
          name: 'Green Apple',
          category: 'Fruits',
          unit: 'each',
          quantity: 4,
          isChecked: false,
        },
      ],
    ])('%s', (_description, itemInput, catalogItem, expectedData) => {
      it('should create item using catalog data', async () => {
        prismaService.masterGroceryCatalog.findUnique.mockResolvedValue(catalogItem);
        shoppingRepository.createItem.mockResolvedValue({
          id: 'item-1',
          listId,
          ...expectedData,
        });

        const result = await service.addItems(listId, householdId, {
          items: [itemInput],
        });

        const requestedCatalogId = itemInput.catalogItemId ?? itemInput.masterItemId;
        expect(prismaService.masterGroceryCatalog.findUnique).toHaveBeenCalledWith({
          where: { id: requestedCatalogId },
        });
        expect(shoppingRepository.createItem).toHaveBeenCalledWith(listId, {
          ...expectedData,
          catalogItemId: requestedCatalogId,
        });
        expect(result.addedItems[0]).toMatchObject({
          id: 'item-1',
          name: expectedData.name,
          quantity: expectedData.quantity,
          unit: expectedData.unit,
          category: expectedData.category,
          isChecked: expectedData.isChecked,
        });
      });
    });

    it('should fall back to custom name/category when no catalog ID is provided', async () => {
      shoppingRepository.createItem.mockResolvedValue({
        id: 'item-2',
        listId,
        name: 'Custom Item',
        category: 'Custom',
        quantity: 2,
        unit: 'box',
        isChecked: false,
      });

      const result = await service.addItems(listId, householdId, {
        items: [
          {
            name: 'Custom Item',
            category: 'Custom',
            quantity: 2,
            unit: 'box',
          },
        ],
      });

      expect(shoppingRepository.createItem).toHaveBeenCalledWith(listId, {
        name: 'Custom Item',
        category: 'Custom',
        quantity: 2,
        unit: 'box',
        isChecked: false,
        catalogItemId: undefined,
      });
      expect(result.addedItems[0].name).toBe('Custom Item');
    });

    it('should throw when catalog item does not exist', async () => {
      prismaService.masterGroceryCatalog.findUnique.mockResolvedValue(null);

      await expect(
        service.addItems(listId, householdId, {
          items: [{ catalogItemId: 'missing-item' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when both catalog identifiers are provided', async () => {
      await expect(
        service.addItems(listId, householdId, {
          items: [{ catalogItemId: 'g1', masterItemId: 'g2' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when list is missing', async () => {
      shoppingRepository.findListById.mockResolvedValue(null);

      await expect(
        service.addItems(listId, householdId, {
          items: [{ name: 'Milk' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when household access is denied', async () => {
      shoppingRepository.findListById.mockResolvedValue({
        id: listId,
        householdId: 'other-household',
      });

      await expect(
        service.addItems(listId, householdId, {
          items: [{ name: 'Milk' }],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('searchGroceries', () => {
    it('should search catalog by case-insensitive name', async () => {
      const catalogItems = [
        { id: 'g1', name: 'Banana', category: 'Fruits', defaultUnit: 'each' },
      ];
      prismaService.masterGroceryCatalog.findMany.mockResolvedValue(catalogItems);

      const result = await service.searchGroceries('Ban');

      expect(prismaService.masterGroceryCatalog.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'Ban', mode: 'insensitive' } },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          category: true,
          defaultUnit: true,
          imageUrl: true,
          defaultQuantity: true,
        },
      });
      expect(result).toEqual(catalogItems);
    });
  });

  describe('getCategories', () => {
    it('should return unique sorted categories', async () => {
      prismaService.masterGroceryCatalog.findMany.mockResolvedValue([
        { category: 'Dairy' },
        { category: 'Produce' },
        { category: 'Dairy' },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['Dairy', 'Produce']);
    });
  });
});
