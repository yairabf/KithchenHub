import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Recipe } from '@prisma/client';

@Injectable()
export class RecipesRepository {
  constructor(private prisma: PrismaService) {}

  async findRecipesByHousehold(
    householdId: string,
    filters?: { category?: string; search?: string },
  ): Promise<Recipe[]> {
    const where: any = { householdId };

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

  async deleteRecipe(id: string): Promise<void> {
    await this.prisma.recipe.delete({
      where: { id },
    });
  }
}
