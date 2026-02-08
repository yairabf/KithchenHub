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
  Req,
  Logger,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import '@fastify/multipart'; // Required for type augmentation
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
  private readonly logger = new Logger(RecipesController.name);

  constructor(private recipesService: RecipesService) {}

  @Get()
  async getRecipes(
    @CurrentUser() user: CurrentUserPayload,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    if (!user.householdId) {
      this.logger.warn('getRecipes called without householdId');
      throw new BadRequestException('User must belong to a household');
    }

    const result = await this.recipesService.getRecipes(user.householdId, {
      category,
      search,
    });
    this.logger.debug(`getRecipes returned ${result.length} recipes`);
    return result;
  }

  @Post()
  async createRecipe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRecipeDto,
  ) {
    if (!user.householdId) {
      this.logger.warn('createRecipe called without householdId');
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
      this.logger.warn('getRecipe called without householdId');
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

  @Post(':id/image')
  async uploadRecipeImage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') recipeId: string,
    @Req() req: FastifyRequest,
  ) {
    if (!user.householdId) {
      this.logger.warn('uploadRecipeImage called without householdId');
      throw new BadRequestException('User must belong to a household');
    }

    const data = await req.file();
    if (!data) {
      throw new BadRequestException('File is required');
    }

    const buffer = await data.toBuffer();
    return this.recipesService.uploadImage(
      recipeId,
      user.householdId,
      buffer,
      data.mimetype,
    );
  }
}
