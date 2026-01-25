import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Recipe } from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

@Injectable()
export class RecipesRepository {
  private readonly logger = new Logger(RecipesRepository.name);

  constructor(private prisma: PrismaService) {}

  async findRecipesByHousehold(
    householdId: string,
    filters?: { category?: string; search?: string },
  ): Promise<Recipe[]> {
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

    return this.prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
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
      prepTime?: number;
      ingredients: any;
      instructions: any;
      imageUrl?: string;
    },
  ): Promise<Recipe> {
    return this.prisma.recipe.create({
      data: {
        householdId,
        title: data.title,
        prepTime: data.prepTime,
        ingredients: data.ingredients,
        instructions: data.instructions,
        imageUrl: data.imageUrl,
      },
    });
  }

  async updateRecipe(
    id: string,
    data: {
      title?: string;
      prepTime?: number;
      ingredients?: any;
      instructions?: any;
      imageUrl?: string;
    },
  ): Promise<Recipe> {
    return this.prisma.recipe.update({
      where: { id },
      data,
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
