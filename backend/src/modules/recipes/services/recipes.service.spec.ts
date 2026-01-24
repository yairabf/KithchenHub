import { Test, TestingModule } from '@nestjs/testing';
import { RecipesService } from './recipes.service';
import { RecipesRepository } from '../repositories/recipes.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

/**
 * Recipes Service Unit Tests
 * 
 * Tests soft-delete behavior and business logic for recipes.
 */
describe('RecipesService - Soft-Delete Behavior', () => {
  let service: RecipesService;
  let repository: RecipesRepository;
  let prisma: PrismaService;

  const mockHouseholdId = 'household-123';
  const mockRecipeId = 'recipe-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: {
            findRecipesByHousehold: jest.fn(),
            findRecipeById: jest.fn(),
            createRecipe: jest.fn(),
            updateRecipe: jest.fn(),
            deleteRecipe: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            shoppingList: {
              findFirst: jest.fn(),
            },
            shoppingItem: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    repository = module.get<RecipesRepository>(RecipesRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getRecipes', () => {
    it('should return only active recipes (exclude soft-deleted)', async () => {
      const mockRecipes = [
        {
          id: 'recipe-1',
          householdId: mockHouseholdId,
          title: 'Active Recipe',
          prepTime: 30,
          ingredients: [],
          instructions: [],
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      jest.spyOn(repository, 'findRecipesByHousehold').mockResolvedValue(mockRecipes as any);

      const result = await service.getRecipes(mockHouseholdId);

      expect(repository.findRecipesByHousehold).toHaveBeenCalledWith(
        mockHouseholdId,
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Active Recipe');
    });

    it('should support search filters on active recipes', async () => {
      const mockRecipes = [
        {
          id: 'recipe-1',
          householdId: mockHouseholdId,
          title: 'Pasta Carbonara',
          prepTime: 30,
          ingredients: [],
          instructions: [],
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      jest.spyOn(repository, 'findRecipesByHousehold').mockResolvedValue(mockRecipes as any);

      const result = await service.getRecipes(mockHouseholdId, { search: 'pasta' });

      expect(repository.findRecipesByHousehold).toHaveBeenCalledWith(
        mockHouseholdId,
        { search: 'pasta' },
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('cookRecipe', () => {
    it('should add recipe ingredients to active shopping list', async () => {
      const mockRecipe = {
        id: mockRecipeId,
        householdId: mockHouseholdId,
        title: 'Test Recipe',
        prepTime: 30,
        ingredients: [
          { name: 'Tomato', quantity: 2, unit: 'kg' },
          { name: 'Onion', quantity: 1, unit: 'piece' },
        ],
        instructions: [],
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockList = {
        id: 'list-123',
        householdId: mockHouseholdId,
        name: 'Shopping List',
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockCreatedItems = [
        {
          id: 'item-1',
          listId: 'list-123',
          catalogItemId: null,
          name: 'Tomato',
          quantity: 2,
          unit: 'kg',
          isChecked: false,
          category: 'Recipe Ingredients',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'item-2',
          listId: 'list-123',
          catalogItemId: null,
          name: 'Onion',
          quantity: 1,
          unit: 'piece',
          isChecked: false,
          category: 'Recipe Ingredients',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      jest.spyOn(repository, 'findRecipeById').mockResolvedValue(mockRecipe as any);
      jest.spyOn(prisma.shoppingList, 'findFirst').mockResolvedValue(mockList as any);
      jest.spyOn(prisma.shoppingItem, 'create')
        .mockResolvedValueOnce(mockCreatedItems[0] as any)
        .mockResolvedValueOnce(mockCreatedItems[1] as any);

      const result = await service.cookRecipe(mockRecipeId, mockHouseholdId, {
        targetListId: 'list-123',
      });

      expect(prisma.shoppingList.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'list-123',
          deletedAt: null,
        },
      });
      expect(result.itemsAdded).toHaveLength(2);
      expect(result.itemsAdded[0].name).toBe('Tomato');
      expect(result.itemsAdded[1].name).toBe('Onion');
    });

    it('should throw NotFoundException if target shopping list is soft-deleted', async () => {
      const mockRecipe = {
        id: mockRecipeId,
        householdId: mockHouseholdId,
        title: 'Test Recipe',
        prepTime: 30,
        ingredients: [{ name: 'Tomato', quantity: 2 }],
        instructions: [],
        imageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      jest.spyOn(repository, 'findRecipeById').mockResolvedValue(mockRecipe as any);
      jest.spyOn(prisma.shoppingList, 'findFirst').mockResolvedValue(null);

      await expect(
        service.cookRecipe(mockRecipeId, mockHouseholdId, {
          targetListId: 'deleted-list',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
