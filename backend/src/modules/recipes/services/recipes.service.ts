import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { RecipesRepository } from '../repositories/recipes.repository';
// import { StorageService } from '../../storage/storage.service'; // Deprecated for recipes
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
import { RecipeImagesService } from './recipe-images.service';
import { normalizeRecipeCategory } from '../constants';

/**
 * Shape of recipe entity as returned by the repository (Prisma JSON columns are untyped).
 */
type RecipeEntityShape = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  prepTime?: number | null;
  ingredients?: unknown;
  instructions?: unknown;
  imageUrl?: string | null;
  imageKey?: string | null;
  thumbKey?: string | null;
  imageVersion?: number | null;
  imageUpdatedAt?: Date | null;
};

type IngredientRow = {
  name: string;
  quantityAmount?: number;
  quantityUnit?: string;
  quantityUnitType?: string;
  quantityModifier?: string;
  quantity?: number;
  unit?: string;
};

/**
 * Maps a repository recipe entity to RecipeDetailDto.
 * Prisma JSON columns (ingredients, instructions) are untyped; we normalize to DTO shape here.
 * Supports both new (quantityAmount/quantityUnit/quantityUnitType) and legacy (quantity/unit) ingredient shape.
 *
 * @param recipe - Recipe entity from repository
 * @returns RecipeDetailDto for API response
 */
function mapRecipeToDetailDto(recipe: RecipeEntityShape): RecipeDetailDto {
  const ingredients: RecipeIngredientDto[] = Array.isArray(recipe.ingredients)
    ? (recipe.ingredients as IngredientRow[]).map((ing) => ({
        name: ing.name,
        quantityAmount: ing.quantityAmount ?? ing.quantity,
        quantityUnit: ing.quantityUnit ?? ing.unit,
        quantityUnitType: ing.quantityUnitType,
        quantityModifier: ing.quantityModifier,
        quantity: ing.quantity,
        unit: ing.unit,
      }))
    : [];

  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description ?? undefined,
    category: normalizeRecipeCategory(recipe.category),
    prepTime: recipe.prepTime ?? undefined,
    ingredients,
    instructions: Array.isArray(recipe.instructions)
      ? (recipe.instructions as unknown as RecipeInstructionDto[])
      : [],
    hasImage: Boolean(recipe.imageKey || recipe.imageUrl),
    imageUrl: recipe.imageUrl ?? undefined,
    imageVersion: recipe.imageVersion ?? undefined,
    imageUpdatedAt: recipe.imageUpdatedAt ?? undefined,
    imageKey: recipe.imageKey ?? null,
    thumbKey: recipe.thumbKey ?? null,
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
    private recipeImagesService: RecipeImagesService,
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

    const normalizedFilters = {
      category: filters?.category
        ? normalizeRecipeCategory(filters.category)
        : undefined,
      search: filters?.search,
    };

    const recipes = await this.recipesRepository.findRecipesByHousehold(
      householdId,
      normalizedFilters,
    );

    this.logger.log(
      `Found ${recipes.length} recipes for household ${householdId}`,
    );

    const mapped = await Promise.all(
      recipes.map(async (recipe) => {
        const { imageUrl, thumbUrl } =
          await this.recipeImagesService.getRecipeImageUrls({
            imageKey: recipe.imageKey,
            thumbKey: recipe.thumbKey,
          });

        // Fallback to legacy imageUrl if new system has no image
        const finalImageUrl = imageUrl || recipe.imageUrl;

        return {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description ?? undefined,
          category: normalizeRecipeCategory(recipe.category),
          prepTime: recipe.prepTime ?? undefined,
          hasImage: Boolean(recipe.imageKey || recipe.imageUrl),
          imageUrl: finalImageUrl ?? undefined,
          thumbUrl: thumbUrl ?? undefined,
          imageKey: recipe.imageKey ?? null,
          thumbKey: recipe.thumbKey ?? null,
          imageVersion: recipe.imageVersion ?? undefined,
          imageUpdatedAt: recipe.imageUpdatedAt ?? undefined,
        };
      }),
    );

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
      this.logger.warn(
        `Access denied: Recipe ${recipeId} belongs to household ${recipe.householdId}, user belongs to ${householdId}`,
      );
      throw new ForbiddenException('Access denied');
    }

    const mapped = mapRecipeToDetailDto(recipe);

    // Resolve new image URLs
    const { imageUrl, thumbUrl } =
      await this.recipeImagesService.getRecipeImageUrls({
        imageKey: recipe.imageKey,
        thumbKey: recipe.thumbKey,
      });

    // Fallback to legacy
    mapped.imageUrl = imageUrl || recipe.imageUrl || undefined;
    mapped.thumbUrl = thumbUrl ?? undefined;
    mapped.imageVersion = recipe.imageVersion ?? undefined;
    mapped.imageUpdatedAt = recipe.imageUpdatedAt ?? undefined;
    mapped.imageKey = recipe.imageKey ?? null;
    mapped.thumbKey = recipe.thumbKey ?? null;
    mapped.hasImage = Boolean(recipe.imageKey || recipe.imageUrl);

    this.logger.log(`Recipe ${recipeId} found, returning details`);
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
      description: dto.description,
      category: normalizeRecipeCategory(dto.category),
      prepTime: dto.prepTime,
      ingredients: dto.ingredients,
      instructions: dto.instructions,
      imageUrl: dto.imageUrl, // Legacy support
    });

    this.logger.log(`Recipe created successfully with ID: ${recipe.id}`);

    const mapped = mapRecipeToDetailDto(recipe);
    // New recipe won't have imageKey yet (uploaded separately), so just return as is
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
      description: dto.description,
      category:
        dto.category === undefined
          ? undefined
          : normalizeRecipeCategory(dto.category),
      prepTime: dto.prepTime,
      ingredients: dto.ingredients,
      instructions: dto.instructions,
      imageUrl: dto.imageUrl,
    });

    const mapped = mapRecipeToDetailDto(updatedRecipe);

    const { imageUrl } = await this.recipeImagesService.getRecipeImageUrls({
      imageKey: updatedRecipe.imageKey,
      thumbKey: updatedRecipe.thumbKey,
    });

    mapped.imageUrl = imageUrl || updatedRecipe.imageUrl || undefined;

    return mapped;
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
      ingredients.map(async (ingredient: IngredientRow) =>
        this.prisma.shoppingItem.create({
          data: {
            listId: dto.targetListId,
            name: ingredient.name,
            quantity: ingredient.quantityAmount ?? ingredient.quantity ?? 1,
            unit: ingredient.quantityUnit ?? ingredient.unit,
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
