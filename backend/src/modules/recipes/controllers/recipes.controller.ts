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
    console.log('[RecipesController] GET /recipes - getRecipes called');
    console.log(
      '[RecipesController] User:',
      JSON.stringify({
        id: user.id,
        email: user.email,
        householdId: user.householdId,
      }),
    );
    console.log(
      '[RecipesController] Query params:',
      JSON.stringify({ category, search }),
    );

    if (!user.householdId) {
      console.error(
        '[RecipesController] Error: User must belong to a household',
      );
      throw new BadRequestException('User must belong to a household');
    }

    const result = await this.recipesService.getRecipes(user.householdId, {
      category,
      search,
    });

    console.log('[RecipesController] Returning', result.length, 'recipes');
    console.log(
      '[RecipesController] Recipes:',
      JSON.stringify(result, null, 2),
    );
    return result;
  }

  @Post()
  async createRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRecipeDto,
  ) {
    console.log('[RecipesController] POST /recipes - createRecipe called');
    console.log(
      '[RecipesController] User:',
      JSON.stringify({
        id: user.id,
        email: user.email,
        householdId: user.householdId,
      }),
    );
    console.log('[RecipesController] DTO:', JSON.stringify(dto, null, 2));

    if (!user.householdId) {
      console.error(
        '[RecipesController] Error: User must belong to a household',
      );
      throw new BadRequestException('User must belong to a household');
    }

    const result = await this.recipesService.createRecipe(
      user.householdId,
      dto,
    );
    console.log(
      '[RecipesController] Recipe created successfully:',
      JSON.stringify(result, null, 2),
    );
    return result;
  }

  @Get(':id')
  async getRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') recipeId: string,
  ) {
    console.log('[RecipesController] GET /recipes/:id - getRecipe called');
    console.log(
      '[RecipesController] User:',
      JSON.stringify({
        id: user.id,
        email: user.email,
        householdId: user.householdId,
      }),
    );
    console.log('[RecipesController] Recipe ID:', recipeId);

    if (!user.householdId) {
      console.error(
        '[RecipesController] Error: User must belong to a household',
      );
      throw new BadRequestException('User must belong to a household');
    }

    const result = await this.recipesService.getRecipe(
      recipeId,
      user.householdId,
    );
    console.log(
      '[RecipesController] Recipe details fetched:',
      JSON.stringify(result, null, 2),
    );
    return result;
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
