import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RecipesService } from '../services/recipes.service';
import { CreateRecipeDto, UpdateRecipeDto, CookRecipeDto } from '../dtos';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';

/**
 * Recipes controller handling recipe CRUD operations.
 * API Version: 1
 * All endpoints require authentication and household membership.
 */
@Controller({ path: 'recipes', version: '1' })
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  async getRecipes(
    @CurrentUser() user: CurrentUserPayload,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.recipesService.getRecipes(user.householdId, {
      category,
      search,
    });
  }

  @Post()
  async createRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRecipeDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.recipesService.createRecipe(user.householdId, dto);
  }

  @Get(':id')
  async getRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') recipeId: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.recipesService.getRecipe(recipeId, user.householdId);
  }

  @Put(':id')
  async updateRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') recipeId: string,
    @Body() dto: UpdateRecipeDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.recipesService.updateRecipe(recipeId, user.householdId, dto);
  }

  @Post(':id/cook')
  async cookRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') recipeId: string,
    @Body() dto: CookRecipeDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.recipesService.cookRecipe(recipeId, user.householdId, dto);
  }

  @Delete(':id')
  async deleteRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') recipeId: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    await this.recipesService.deleteRecipe(recipeId, user.householdId);
    return { success: true };
  }
}
