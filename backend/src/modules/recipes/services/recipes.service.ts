import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { RecipesRepository } from '../repositories/recipes.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  RecipeListItemDto,
  RecipeDetailDto,
  CreateRecipeDto,
  UpdateRecipeDto,
  CookRecipeDto,
} from '../dtos';
import { RecipeIngredientDto, RecipeInstructionDto } from '../dtos/recipe-detail-response.dto';

/**
 * Recipes service managing recipe CRUD operations and cooking functionality.
 * 
 * Responsibilities:
 * - Recipe listing with search and category filters
 * - Recipe creation and updates
 * - Recipe detail retrieval
 * - "Cook" feature that adds recipe ingredients to shopping lists
 */
@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private recipesRepository: RecipesRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * Gets all recipes for a household with optional filtering.
   * 
   * @param householdId - The household ID
   * @param filters - Optional category and search filters
   * @returns Array of recipe list items
   */
  async getRecipes(
    householdId: string,
    filters?: { category?: string; search?: string },
  ): Promise<RecipeListItemDto[]> {
    const recipes = await this.recipesRepository.findRecipesByHousehold(
      householdId,
      filters,
    );

    return recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
    }));
  }

  /**
   * Gets detailed information about a specific recipe.
   * 
   * @param recipeId - The recipe ID
   * @param householdId - The household ID for authorization
   * @returns Recipe details with ingredients and instructions
   * @throws NotFoundException if recipe doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async getRecipe(recipeId: string, householdId: string): Promise<RecipeDetailDto> {
    const recipe = await this.recipesRepository.findRecipeById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: recipe.id,
      title: recipe.title,
      prepTime: recipe.prepTime,
      ingredients: Array.isArray(recipe.ingredients)
        ? (recipe.ingredients as unknown as RecipeIngredientDto[])
        : [],
      instructions: Array.isArray(recipe.instructions)
        ? (recipe.instructions as unknown as RecipeInstructionDto[])
        : [],
      imageUrl: recipe.imageUrl,
    };
  }

  /**
   * Creates a new recipe for a household.
   * 
   * @param householdId - The household ID
   * @param dto - Recipe creation data
   * @returns Created recipe ID
   */
  async createRecipe(
    householdId: string,
    dto: CreateRecipeDto,
  ): Promise<{ id: string }> {
    const recipe = await this.recipesRepository.createRecipe(householdId, {
      title: dto.title,
      prepTime: dto.prepTime,
      ingredients: dto.ingredients,
      instructions: dto.instructions,
      imageUrl: dto.imageUrl,
    });

    return { id: recipe.id };
  }

  /**
   * Updates an existing recipe.
   * 
   * @param recipeId - The recipe ID
   * @param householdId - The household ID for authorization
   * @param dto - Update data
   * @returns Updated recipe details
   * @throws NotFoundException if recipe doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async updateRecipe(
    recipeId: string,
    householdId: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeDetailDto> {
    const recipe = await this.recipesRepository.findRecipeById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedRecipe = await this.recipesRepository.updateRecipe(recipeId, {
      title: dto.title,
      prepTime: dto.prepTime,
      ingredients: dto.ingredients,
      instructions: dto.instructions,
      imageUrl: dto.imageUrl,
    });

    return this.getRecipe(updatedRecipe.id, householdId);
  }

  /**
   * Adds recipe ingredients to a shopping list (cook feature).
   * 
   * @param recipeId - The recipe ID
   * @param householdId - The household ID for authorization
   * @param dto - Contains target shopping list ID
   * @returns Added items
   * @throws NotFoundException if recipe or shopping list doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async cookRecipe(
    recipeId: string,
    householdId: string,
    dto: CookRecipeDto,
  ): Promise<{ itemsAdded: Array<{ id: string; name: string; quantity: number; unit?: string }> }> {
    const recipe = await this.recipesRepository.findRecipeById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const list = await this.prisma.shoppingList.findUnique({
      where: { id: dto.targetListId },
    });

    if (!list || list.householdId !== householdId) {
      throw new NotFoundException('Shopping list not found');
    }

    const ingredients = Array.isArray(recipe.ingredients)
      ? (recipe.ingredients as unknown[])
      : [];

    const itemsAdded = await Promise.all(
      ingredients.map(async (ingredient: any) =>
        this.prisma.shoppingItem.create({
          data: {
            listId: dto.targetListId,
            name: ingredient.name,
            quantity: ingredient.quantity || 1,
            unit: ingredient.unit,
            category: 'Recipe Ingredients',
          },
        }),
      ),
    );

    return {
      itemsAdded: itemsAdded.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
    };
  }
}
