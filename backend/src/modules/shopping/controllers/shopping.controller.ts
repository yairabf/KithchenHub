import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ShoppingService } from '../services/shopping.service';
import {
  CreateListDto,
  AddItemsDto,
  UpdateItemDto,
} from '../dtos';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Groceries controller providing grocery search and category listing.
 * Public endpoints - no authentication required.
 */
@Controller('groceries')
export class GroceriesController {
  constructor(private shoppingService: ShoppingService) {}

  @Get('search')
  @Public()
  async searchGroceries(@Query('q') query: string) {
    return this.shoppingService.searchGroceries(query || '');
  }

  @Get('categories')
  @Public()
  async getCategories() {
    return this.shoppingService.getCategories();
  }
}

/**
 * Shopping lists controller handling shopping list CRUD operations.
 * All endpoints require authentication and household membership.
 */
@Controller('shopping-lists')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ShoppingListsController {
  constructor(private shoppingService: ShoppingService) {}

  @Get()
  async getLists(@CurrentUser() user: CurrentUserPayload) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    return this.shoppingService.getLists(user.householdId);
  }

  @Post()
  async createList(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateListDto,
  ) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    return this.shoppingService.createList(user.householdId, dto);
  }

  @Get(':id')
  async getListDetails(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') listId: string,
  ) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    return this.shoppingService.getListDetails(listId, user.householdId);
  }

  @Delete(':id')
  async deleteList(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') listId: string,
  ) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    await this.shoppingService.deleteList(listId, user.householdId);
    return { success: true };
  }

  @Post(':id/items')
  async addItems(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') listId: string,
    @Body() dto: AddItemsDto,
  ) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    return this.shoppingService.addItems(listId, user.householdId, dto);
  }
}

/**
 * Shopping items controller handling individual item operations.
 * All endpoints require authentication and household membership.
 */
@Controller('shopping-items')
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ShoppingItemsController {
  constructor(private shoppingService: ShoppingService) {}

  @Patch(':id')
  async updateItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    return this.shoppingService.updateItem(itemId, user.householdId, dto);
  }

  @Delete(':id')
  async deleteItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') itemId: string,
  ) {
    if (!user.householdId) {
      throw new Error('User must belong to a household');
    }
    await this.shoppingService.deleteItem(itemId, user.householdId);
    return { success: true };
  }
}
