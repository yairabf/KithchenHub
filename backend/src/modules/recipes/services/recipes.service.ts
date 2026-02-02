import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RecipesRepository } from '../repositories/recipes.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';
import {
  RecipeListItemDto,
  RecipeDetailDto,
  CreateRecipeDto,
  UpdateRecipeDto,
  CookRecipeDto,
} from '../dtos';
import {
  RecipeIngredientDto,
  RecipeInstructionDto,
} from '../dtos/recipe-detail-response.dto';

/**
 * Shape of recipe entity as returned by the repository (Prisma JSON columns are untyped).
 */
type RecipeEntityShape = {
  id: string;
  title: string;
  prepTime?: number | null;
  ingredients?: unknown;
  instructions?: unknown;
  imageUrl?: string | null;
};

/**
 * Maps a repository recipe entity to RecipeDetailDto.
 * Prisma JSON columns (ingredients, instructions) are untyped; we normalize to DTO shape here.
 *
 * @param recipe - Recipe entity from repository
 * @returns RecipeDetailDto for API response
 */
function mapRecipeToDetailDto(recipe: RecipeEntityShape): RecipeDetailDto {
  return {
    id: recipe.id,
    title: recipe.title,
    prepTime: recipe.prepTime ?? undefined,
    ingredients: Array.isArray(recipe.ingredients)
      ? (recipe.ingredients as unknown as RecipeIngredientDto[])
      : [],
    instructions: Array.isArray(recipe.instructions)
      ? (recipe.instructions as unknown as RecipeInstructionDto[])
      : [],
    imageUrl: recipe.imageUrl ?? undefined,
  };
}

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
    this.logger.log(`Getting recipes for household ${householdId}`);
    this.logger.debug(`Filters: ${JSON.stringify(filters, null, 2)}`);
    
    const recipes = await this.recipesRepository.findRecipesByHousehold(
      householdId,
      filters,
    );

    this.logger.log(`Found ${recipes.length} recipes for household ${householdId}`);
    this.logger.debug(`Recipes: ${JSON.stringify(recipes.map(r => ({ id: r.id, title: r.title })), null, 2)}`);

    const mapped = recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
    }));
    
    this.logger.debug(`Mapped recipes DTO: ${JSON.stringify(mapped, null, 2)}`);
    return mapped;
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
  async getRecipe(
    recipeId: string,
    householdId: string,
  ): Promise<RecipeDetailDto> {
    this.logger.log(`Getting recipe ${recipeId} for household ${householdId}`);
    
    const recipe = await this.recipesRepository.findRecipeById(recipeId);

    if (!recipe) {
      this.logger.warn(`Recipe ${recipeId} not found`);
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      this.logger.warn(`Access denied: Recipe ${recipeId} belongs to household ${recipe.householdId}, user belongs to ${householdId}`);
      throw new ForbiddenException('Access denied');
    }

    const mapped = mapRecipeToDetailDto(recipe);
    this.logger.log(`Recipe ${recipeId} found, returning details`);
    this.logger.debug(`Recipe details: ${JSON.stringify(mapped, null, 2)}`);
    return mapped;
  }

  /**
   * Creates a new recipe for a household.
   *
   * @param householdId - The household ID
   * @param dto - Recipe creation data
   * @returns Created recipe with full details
   */
  async createRecipe(
    householdId: string,
    dto: CreateRecipeDto,
  ): Promise<RecipeDetailDto> {
    this.logger.log(`Creating recipe for household ${householdId}`);
    this.logger.debug(`Recipe data: ${JSON.stringify(dto, null, 2)}`);
    
    const recipe = await this.recipesRepository.createRecipe(householdId, {
      title: dto.title,
      prepTime: dto.prepTime,
      ingredients: dto.ingredients,
      instructions: dto.instructions,
      imageUrl: dto.imageUrl,
    });

    this.logger.log(`Recipe created successfully with ID: ${recipe.id}`);
    this.logger.debug(`Created recipe: ${JSON.stringify(recipe, null, 2)}`);

    const mapped = mapRecipeToDetailDto(recipe);
    this.logger.debug(`Mapped recipe DTO: ${JSON.stringify(mapped, null, 2)}`);
    return mapped;
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

    return mapRecipeToDetailDto(updatedRecipe);
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
  ): Promise<{
    itemsAdded: Array<{
      id: string;
      name: string;
      quantity: number;
      unit?: string;
    }>;
  }> {
    const recipe = await this.recipesRepository.findRecipeById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const list = await this.prisma.shoppingList.findFirst({
      where: {
        id: dto.targetListId,
        ...ACTIVE_RECORDS_FILTER,
      },
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

  /**
   * Deletes a recipe.
   *
   * @param recipeId - The recipe ID
   * @param householdId - The household ID for authorization
   * @throws NotFoundException if recipe doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async deleteRecipe(recipeId: string, householdId: string): Promise<void> {
    const recipe = await this.recipesRepository.findRecipeById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    await this.recipesRepository.deleteRecipe(recipeId);
  }
}
