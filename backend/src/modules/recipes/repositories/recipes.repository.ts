import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Prisma, Recipe } from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

@Injectable()
export class RecipesRepository {
  private readonly logger = new Logger(RecipesRepository.name);

  constructor(private prisma: PrismaService) {}

  async findRecipesByHousehold(
    householdId: string,
    filters?: { category?: string; search?: string },
  ): Promise<Recipe[]> {
    this.logger.log(`Finding recipes for household ${householdId}`);
    this.logger.debug(`Filters: ${JSON.stringify(filters, null, 2)}`);

    const where: any = {
      householdId,
      ...ACTIVE_RECORDS_FILTER,
    };

    if (filters?.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    this.logger.debug(`Prisma where clause: ${JSON.stringify(where, null, 2)}`);

    try {
      const recipes = await this.prisma.recipe.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      this.logger.log(
        `Found ${recipes.length} recipes in database for household ${householdId}`,
      );
      this.logger.debug(`Recipe IDs: ${recipes.map((r) => r.id).join(', ')}`);
      return recipes;
    } catch (error) {
      this.logger.error(
        `Failed to find recipes: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }

  async findRecipeById(id: string): Promise<Recipe | null> {
    return this.prisma.recipe.findUnique({
      where: { id },
    });
  }

  async createRecipe(
    householdId: string,
    data: {
      title: string;
      category?: string;
      prepTime?: number;
      cookTime?: number;
      ingredients: any;
      instructions: any;
      imageUrl?: string;
    },
  ): Promise<Recipe> {
    this.logger.log(`Creating recipe in database for household ${householdId}`);
    this.logger.debug(`Recipe data: ${JSON.stringify(data, null, 2)}`);

    try {
      const recipe = await this.prisma.recipe.create({
        data: {
          householdId,
          title: data.title,
          category: data.category,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          ingredients: data.ingredients,
          instructions: data.instructions,
          imageUrl: data.imageUrl,
        },
      });

      this.logger.log(`Recipe created in database with ID: ${recipe.id}`);
      this.logger.debug(
        `Created recipe entity: ${JSON.stringify(recipe, null, 2)}`,
      );
      return recipe;
    } catch (error) {
      this.logger.error(
        `Failed to create recipe in database: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
  }

  async updateRecipe(
    id: string,
    data: {
      title?: string;
      category?: string;
      prepTime?: number;
      cookTime?: number;
      /** JSON-serializable; cast to Prisma input at boundary */
      ingredients?: unknown;
      /** JSON-serializable; cast to Prisma input at boundary */
      instructions?: unknown;
      imageUrl?: string | null;
    },
  ): Promise<Recipe> {
    return this.prisma.recipe.update({
      where: { id },
      data: data as Prisma.RecipeUpdateInput,
    });
  }

  /**
   * Soft-deletes a recipe by setting deletedAt timestamp.
   *
   * @param id - Recipe ID to soft-delete
   */
  async deleteRecipe(id: string): Promise<void> {
    this.logger.log(`Soft-deleting recipe: ${id}`);
    await this.prisma.recipe.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted recipe.
   *
   * @param id - Recipe ID to restore
   */
  async restoreRecipe(id: string): Promise<void> {
    this.logger.log(`Restoring recipe: ${id}`);
    await this.prisma.recipe.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
