import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportRepository } from '../repositories/import.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ImportRequestDto } from '../dto/import.dto';
import {
  ImportSource,
  ImportStatus,
  ImportEntityType,
} from '../constants/import.constants';

describe('ImportService', () => {
  let service: ImportService;

  const mockImportRepository = {
    findMappingsForUser: jest.fn(),
    findRecipeByFingerprint: jest.fn(),
    findShoppingListByFingerprint: jest.fn(),
  };

  const mockPrismaTransaction = {
    importBatch: {
      create: jest.fn(),
    },
    recipe: {
      create: jest.fn(),
    },
    shoppingList: {
      create: jest.fn(),
    },
    shoppingItem: {
      createMany: jest.fn(),
    },
    importMapping: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((callback) => callback(mockPrismaTransaction)),
  };

  const userId = 'user-123';
  const householdId = 'household-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportService,
        {
          provide: ImportRepository,
          useValue: mockImportRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ImportService>(ImportService);
    module.get<ImportRepository>(ImportRepository);
    module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset the transaction mock to use the callback pattern
    mockPrismaService.$transaction.mockImplementation((callback) =>
      callback(mockPrismaTransaction),
    );
  });

  describe('executeImport', () => {
    const mockRecipe = {
      id: 'local-recipe-1',
      title: 'Test Recipe',
      prepTime: 30,
      ingredients: [{ name: 'Flour', quantity: 2, unit: 'cups' }],
      instructions: [{ step: 1, instruction: 'Mix ingredients' }],
      imageUrl: 'https://example.com/image.jpg',
    };

    const mockShoppingList = {
      id: 'local-list-1',
      name: 'Groceries',
      color: '#FF6B35',
      items: [
        {
          name: 'Milk',
          quantity: 1,
          unit: 'gallon',
          category: 'Dairy',
          isChecked: false,
        },
      ],
    };

    const mockBatch = {
      id: 'batch-123',
      userId,
      source: ImportSource.GUEST_MODE_MIGRATION,
      status: ImportStatus.COMPLETED,
    };

    beforeEach(() => {
      mockPrismaTransaction.importBatch.create.mockResolvedValue(mockBatch);
      mockImportRepository.findMappingsForUser.mockResolvedValue(new Map());
      mockImportRepository.findRecipeByFingerprint.mockResolvedValue(null);
      mockImportRepository.findShoppingListByFingerprint.mockResolvedValue(
        null,
      );
    });

    describe.each([
      [
        'empty recipes and shopping lists',
        { recipes: [], shoppingLists: [] },
        new Map<string, string>(),
        { created: 0, skipped: 0, mappings: {} },
        'should return zero counts',
      ],
      [
        'new recipe only',
        { recipes: [mockRecipe] },
        new Map<string, string>(),
        {
          created: 1,
          skipped: 0,
          mappings: { 'local-recipe-1': 'server-recipe-1' },
        },
        'should create recipe and return mapping',
      ],
      [
        'duplicate recipe',
        { recipes: [mockRecipe] },
        new Map([
          [`${ImportEntityType.RECIPE}:local-recipe-1`, 'existing-recipe-1'],
        ]),
        {
          created: 0,
          skipped: 1,
          mappings: { 'local-recipe-1': 'existing-recipe-1' },
        },
        'should skip recipe and return existing mapping',
      ],
      [
        'new shopping list only',
        { shoppingLists: [mockShoppingList] },
        new Map<string, string>(),
        {
          created: 1,
          skipped: 0,
          mappings: { 'local-list-1': 'server-list-1' },
        },
        'should create list and items',
      ],
      [
        'duplicate shopping list',
        { shoppingLists: [mockShoppingList] },
        new Map([
          [`${ImportEntityType.SHOPPING_LIST}:local-list-1`, 'existing-list-1'],
        ]),
        {
          created: 0,
          skipped: 1,
          mappings: { 'local-list-1': 'existing-list-1' },
        },
        'should skip list and return existing mapping',
      ],
      [
        'mixed new and duplicate recipes',
        {
          recipes: [
            mockRecipe,
            { ...mockRecipe, id: 'local-recipe-2', title: 'Recipe 2' },
          ],
        },
        new Map([
          [`${ImportEntityType.RECIPE}:local-recipe-1`, 'existing-recipe-1'],
        ]),
        {
          created: 1,
          skipped: 1,
          mappings: {
            'local-recipe-1': 'existing-recipe-1',
            'local-recipe-2': 'server-recipe-1',
          },
        },
        'should create new and skip duplicate',
      ],
      [
        'recipes and shopping lists',
        { recipes: [mockRecipe], shoppingLists: [mockShoppingList] },
        new Map<string, string>(),
        {
          created: 2,
          skipped: 0,
          mappings: {
            'local-recipe-1': 'server-recipe-1',
            'local-list-1': 'server-list-1',
          },
        },
        'should create both recipes and lists',
      ],
      [
        'shopping list without items',
        {
          shoppingLists: [{ ...mockShoppingList, items: [] }],
        },
        new Map<string, string>(),
        {
          created: 1,
          skipped: 0,
          mappings: { 'local-list-1': 'server-list-1' },
        },
        'should create list without items',
      ],
    ])(
      'with %s',
      (
        _description,
        importRequest,
        existingMappings,
        expectedResponse,
        testDescription,
      ) => {
        it(testDescription, async () => {
          mockImportRepository.findMappingsForUser.mockResolvedValue(
            existingMappings,
          );

          // Mock recipe creation - only return ID as that's all we need
          const recipes = (importRequest as any).recipes || [];
          let recipeCounter = 1;
          recipes.forEach((recipe: any) => {
            const namespacedId = `${ImportEntityType.RECIPE}:${recipe.id}`;
            if (!existingMappings.has(namespacedId)) {
              mockPrismaTransaction.recipe.create.mockResolvedValueOnce({
                id: `server-recipe-${recipeCounter}`,
              });
              recipeCounter++;
            }
          });

          // Mock shopping list creation - only return ID as that's all we need
          const lists = (importRequest as any).shoppingLists || [];
          let listCounter = 1;
          lists.forEach((list: any) => {
            const namespacedId = `${ImportEntityType.SHOPPING_LIST}:${list.id}`;
            if (!existingMappings.has(namespacedId)) {
              mockPrismaTransaction.shoppingList.create.mockResolvedValueOnce({
                id: `server-list-${listCounter}`,
              });
              listCounter++;
            }
          });

          mockPrismaTransaction.importMapping.create.mockResolvedValue({});
          mockPrismaTransaction.shoppingItem.createMany.mockResolvedValue({});

          const result = await service.executeImport(
            userId,
            householdId,
            importRequest as ImportRequestDto,
          );

          expect(result.created).toBe(expectedResponse.created);
          expect(result.skipped).toBe(expectedResponse.skipped);
          expect(result.mappings).toEqual(expectedResponse.mappings);

          // Verify batch creation
          expect(mockPrismaTransaction.importBatch.create).toHaveBeenCalledWith(
            {
              data: {
                userId,
                source: ImportSource.GUEST_MODE_MIGRATION,
                status: ImportStatus.COMPLETED,
              },
            },
          );

          // Verify correct number of recipe creates
          const recipesForCheck = (importRequest as any).recipes || [];
          const newRecipes = recipesForCheck.filter(
            (r: any) =>
              !existingMappings.has(`${ImportEntityType.RECIPE}:${r.id}`),
          );
          expect(mockPrismaTransaction.recipe.create).toHaveBeenCalledTimes(
            newRecipes.length,
          );

          // Verify correct number of list creates
          const listsForCheck = (importRequest as any).shoppingLists || [];
          const newLists = listsForCheck.filter(
            (l: any) =>
              !existingMappings.has(
                `${ImportEntityType.SHOPPING_LIST}:${l.id}`,
              ),
          );
          expect(
            mockPrismaTransaction.shoppingList.create,
          ).toHaveBeenCalledTimes(newLists.length);
        });
      },
    );

    it('should create shopping items when list has items', async () => {
      mockPrismaTransaction.shoppingList.create.mockResolvedValue({
        id: 'server-list-1',
        name: mockShoppingList.name,
        color: mockShoppingList.color,
        householdId,
      });
      mockPrismaTransaction.shoppingItem.createMany.mockResolvedValue({});
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});

      await service.executeImport(userId, householdId, {
        shoppingLists: [mockShoppingList],
      });

      expect(
        mockPrismaTransaction.shoppingItem.createMany,
      ).toHaveBeenCalledWith({
        data: [
          {
            listId: 'server-list-1',
            name: 'Milk',
            quantity: 1,
            unit: 'gallon',
            category: 'Dairy',
            isChecked: false,
          },
        ],
      });
    });

    it('should not create shopping items when list has no items', async () => {
      mockPrismaTransaction.shoppingList.create.mockResolvedValue({
        id: 'server-list-1',
        name: mockShoppingList.name,
        color: mockShoppingList.color,
        householdId,
      });
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});

      await service.executeImport(userId, householdId, {
        shoppingLists: [{ ...mockShoppingList, items: [] }],
      });

      expect(
        mockPrismaTransaction.shoppingItem.createMany,
      ).not.toHaveBeenCalled();
    });

    describe('error handling', () => {
      it('should throw BadRequestException on P2002 (duplicate constraint) error', async () => {
        const duplicateError = {
          code: 'P2002',
          message: 'Unique constraint violation',
        };
        mockPrismaService.$transaction.mockRejectedValue(duplicateError);

        await expect(
          service.executeImport(userId, householdId, { recipes: [mockRecipe] }),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.executeImport(userId, householdId, { recipes: [mockRecipe] }),
        ).rejects.toThrow(
          'Import failed: Duplicate data detected. You may have already imported some of this data.',
        );
      });

      it('should throw BadRequestException on P2003 (foreign key) error', async () => {
        const foreignKeyError = {
          code: 'P2003',
          message: 'Foreign key constraint failed',
        };
        mockPrismaService.$transaction.mockRejectedValue(foreignKeyError);

        await expect(
          service.executeImport(userId, householdId, { recipes: [mockRecipe] }),
        ).rejects.toThrow(BadRequestException);

        await expect(
          service.executeImport(userId, householdId, { recipes: [mockRecipe] }),
        ).rejects.toThrow(
          'Import failed: Invalid household reference. Please ensure you are logged in properly.',
        );
      });

      it('should throw InternalServerErrorException on unknown error', async () => {
        const unknownError = new Error('Unknown database error');
        mockPrismaService.$transaction.mockRejectedValue(unknownError);

        await expect(
          service.executeImport(userId, householdId, {
            recipes: [mockRecipe],
            shoppingLists: [mockShoppingList],
          }),
        ).rejects.toThrow(InternalServerErrorException);

        await expect(
          service.executeImport(userId, householdId, {
            recipes: [mockRecipe],
            shoppingLists: [mockShoppingList],
          }),
        ).rejects.toThrow(
          'Failed to import 1 recipes and 1 shopping lists. Please try again later.',
        );
      });
    });

    it('should call findMappingsForUser with all source IDs', async () => {
      const importRequest = {
        recipes: [mockRecipe, { ...mockRecipe, id: 'local-recipe-2' }],
        shoppingLists: [mockShoppingList],
      };

      mockPrismaTransaction.importBatch.create.mockResolvedValue(mockBatch);
      mockPrismaTransaction.recipe.create.mockResolvedValueOnce({
        id: 'server-recipe-1',
      });
      mockPrismaTransaction.recipe.create.mockResolvedValueOnce({
        id: 'server-recipe-2',
      });
      mockPrismaTransaction.shoppingList.create.mockResolvedValue({
        id: 'server-list-1',
      });
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});
      mockPrismaTransaction.shoppingItem.createMany.mockResolvedValue({});

      await service.executeImport(
        userId,
        householdId,
        importRequest as ImportRequestDto,
      );

      expect(mockImportRepository.findMappingsForUser).toHaveBeenCalledWith(
        userId,
        ['local-recipe-1', 'local-recipe-2', 'local-list-1'],
      );
    });

    it('should create import mappings for all new items', async () => {
      const importRequest = {
        recipes: [mockRecipe],
        shoppingLists: [mockShoppingList],
      };

      mockPrismaTransaction.importBatch.create.mockResolvedValue(mockBatch);
      mockPrismaTransaction.recipe.create.mockResolvedValue({
        id: 'server-recipe-1',
      });
      mockPrismaTransaction.shoppingList.create.mockResolvedValue({
        id: 'server-list-1',
      });
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});
      mockPrismaTransaction.shoppingItem.createMany.mockResolvedValue({});

      await service.executeImport(
        userId,
        householdId,
        importRequest as ImportRequestDto,
      );

      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledTimes(
        2,
      );
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-123',
          userId,
          sourceField: 'local-recipe-1',
          sourceType: ImportEntityType.RECIPE,
          targetField: 'server-recipe-1',
        },
      });
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-123',
          userId,
          sourceField: 'local-list-1',
          sourceType: ImportEntityType.SHOPPING_LIST,
          targetField: 'server-list-1',
        },
      });
    });
  });

  describe('fingerprint deduplication', () => {
    const mockRecipe = {
      id: 'local-recipe-1',
      title: 'Pancakes',
      prepTime: 30,
      ingredients: [],
      instructions: [],
      imageUrl: '',
    };

    const mockShoppingList = {
      id: 'local-list-1',
      name: 'Groceries',
      color: '#000000',
      items: [],
    };

    const mockBatch = {
      id: 'batch-123',
      userId,
      source: ImportSource.GUEST_MODE_MIGRATION,
      status: ImportStatus.COMPLETED,
    };

    beforeEach(() => {
      mockPrismaTransaction.importBatch.create.mockResolvedValue(mockBatch);
      mockImportRepository.findMappingsForUser.mockResolvedValue(new Map());
    });

    it('should skip creation and map to existing recipe if title matches (fingerprint match)', async () => {
      // Mock: Fingerprint found
      mockImportRepository.findRecipeByFingerprint.mockResolvedValue(
        'existing-recipe-id',
      );
      // Mock: Mapping creation
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});

      const result = await service.executeImport(userId, householdId, {
        recipes: [mockRecipe],
      });

      // Verify: No recipe creation
      expect(mockPrismaTransaction.recipe.create).not.toHaveBeenCalled();
      // Verify: Fingerprint lookup called
      expect(mockImportRepository.findRecipeByFingerprint).toHaveBeenCalledWith(
        householdId,
        'Pancakes',
      );
      // Verify: Mapping created to existing ID
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-123',
          userId,
          sourceField: 'local-recipe-1',
          sourceType: ImportEntityType.RECIPE,
          targetField: 'existing-recipe-id',
        },
      });
      // Verify: Stats (skipped=1, created=0)
      expect(result.skipped).toBe(1);
      expect(result.created).toBe(0);
      expect(result.mappings['local-recipe-1']).toBe('existing-recipe-id');
    });

    it('should create new recipe if no fingerprint match found', async () => {
      // Mock: No fingerprint found
      mockImportRepository.findRecipeByFingerprint.mockResolvedValue(null);
      // Mock: Recipe creation
      mockPrismaTransaction.recipe.create.mockResolvedValue({
        id: 'new-recipe-id',
      });
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});

      const result = await service.executeImport(userId, householdId, {
        recipes: [mockRecipe],
      });

      // Verify: Recipe created
      expect(mockPrismaTransaction.recipe.create).toHaveBeenCalled();
      // Verify: Fingerprint lookup called
      expect(mockImportRepository.findRecipeByFingerprint).toHaveBeenCalledWith(
        householdId,
        'Pancakes',
      );
      // Verify: Mapping created to NEW ID
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-123',
          userId,
          sourceField: 'local-recipe-1',
          sourceType: ImportEntityType.RECIPE,
          targetField: 'new-recipe-id',
        },
      });
      // Verify: Stats
      expect(result.created).toBe(1);
    });

    it('should skip creation and map to existing list if name matches (fingerprint match)', async () => {
      // Mock: Fingerprint found
      mockImportRepository.findShoppingListByFingerprint.mockResolvedValue(
        'existing-list-id',
      );
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});

      const result = await service.executeImport(userId, householdId, {
        shoppingLists: [mockShoppingList],
      });

      // Verify: No list creation
      expect(mockPrismaTransaction.shoppingList.create).not.toHaveBeenCalled();
      // Verify: Fingerprint lookup called
      expect(
        mockImportRepository.findShoppingListByFingerprint,
      ).toHaveBeenCalledWith(householdId, 'Groceries');
      // Verify: Mapping created
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-123',
          userId,
          sourceField: 'local-list-1',
          sourceType: ImportEntityType.SHOPPING_LIST,
          targetField: 'existing-list-id',
        },
      });
      // Verify: Stats
      expect(result.skipped).toBe(1);
      expect(result.created).toBe(0);
    });

    it('should handle ID collisions between different entity types using namespacing', async () => {
      // Both items share the same local ID
      const sharedId = 'colliding-id';
      const collidingRecipe = {
        ...mockRecipe,
        id: sharedId,
        title: 'Recipe 1',
      };
      const collidingList = {
        ...mockShoppingList,
        id: sharedId,
        name: 'List 1',
      };

      // Mock: Recipe already imported, List NOT imported
      mockImportRepository.findMappingsForUser.mockResolvedValue(
        new Map([
          [`${ImportEntityType.RECIPE}:${sharedId}`, 'server-recipe-id'],
        ]),
      );

      // Mock: No fingerprint matches for either entity
      mockImportRepository.findRecipeByFingerprint.mockResolvedValue(null);
      mockImportRepository.findShoppingListByFingerprint.mockResolvedValue(
        null,
      );

      mockPrismaTransaction.shoppingList.create.mockResolvedValue({
        id: 'server-list-id',
      });
      mockPrismaTransaction.importMapping.create.mockResolvedValue({});

      const result = await service.executeImport(userId, householdId, {
        recipes: [collidingRecipe],
        shoppingLists: [collidingList],
      });

      // Verify: Recipe skipped, List created despite same ID
      expect(result.skipped).toBe(1); // Recipe
      expect(result.created).toBe(1); // List
      expect(result.mappings[sharedId]).toBe('server-list-id'); // List mapping overwrites recipe mapping in response, but both processed

      // Verify: Mapping created only for shopping list
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledTimes(
        1,
      );
      expect(mockPrismaTransaction.importMapping.create).toHaveBeenCalledWith({
        data: {
          batchId: mockBatch.id,
          userId,
          sourceField: sharedId,
          sourceType: ImportEntityType.SHOPPING_LIST,
          targetField: 'server-list-id',
        },
      });
    });
  });
});
