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
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShoppingService } from '../services/shopping.service';
import {
  CreateListDto,
  AddItemsDto,
  UpdateItemDto,
  UpdateListDto,
} from '../dtos';
import { ShoppingDataDto } from '../dtos/shopping-list-response.dto';
import { JwtAuthGuard, HouseholdGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Groceries controller providing grocery search and category listing.
 * API Version: 1
 * Public endpoints - no authentication required.
 */
@Controller({ path: 'groceries', version: '1' })
export class GroceriesController {
  constructor(private shoppingService: ShoppingService) {}

  @Get('search')
  @Public()
  async searchGroceries(
    @Query('q') query: string,
    @Query('lang') lang?: string,
  ) {
    return this.shoppingService.searchGroceries(query || '', lang);
  }

  @Get('by-category')
  @Public()
  async getGroceriesByCategory(
    @Query('category') category: string,
    @Query('lang') lang?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit);
    return this.shoppingService.getGroceriesByCategory(
      category || '',
      lang,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Get('categories')
  @Public()
  async getCategories() {
    return this.shoppingService.getCategories();
  }

  @Get('names')
  @Public()
  async getCatalogDisplayNames(
    @Query('ids') idsParam: string,
    @Query('lang') lang?: string,
  ) {
    const ids = idsParam
      ? idsParam
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];
    const MAX_IDS = 200;
    if (ids.length > MAX_IDS) {
      throw new BadRequestException(
        `Too many catalog IDs (max ${MAX_IDS}). Requested: ${ids.length}.`,
      );
    }
    return this.shoppingService.getCatalogDisplayNames(ids, lang);
  }
}

/**
 * Shopping lists controller handling shopping list CRUD operations.
 * API Version: 1
 * All endpoints require authentication and household membership.
 */
@ApiTags('shopping-lists')
@Controller({ path: 'shopping-lists', version: '1' })
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ShoppingListsController {
  private readonly logger = new Logger(ShoppingListsController.name);

  constructor(private shoppingService: ShoppingService) {}

  @Get()
  async getLists(@CurrentUser() user: CurrentUserPayload) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.getLists(user.householdId);
  }

  @Get('main')
  async getMainList(@CurrentUser() user: CurrentUserPayload) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.getMainList(user.householdId);
  }

  @ApiOperation({
    summary: 'Get all shopping lists and items in a single request',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description:
      'Language code for catalog item name localization (e.g. "en", "he")',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated shopping data',
    type: ShoppingDataDto,
  })
  @Get('aggregate')
  async getShoppingData(
    @CurrentUser() user: CurrentUserPayload,
    @Query('lang') lang?: string,
  ): Promise<ShoppingDataDto> {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }

    return this.shoppingService.getShoppingData(user.householdId, lang);
  }

  @Post()
  async createList(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateListDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }

    this.logger.debug('POST /shopping-lists - createList called', {
      userId: user.userId,
      householdId: user.householdId,
    });

    const result = await this.shoppingService.createList(user.householdId, dto);
    this.logger.debug('Shopping list created successfully', {
      userId: user.userId,
      listId: result.id,
    });
    return result;
  }

  @Get(':id')
  async getListDetails(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') listId: string,
    @Query('lang') lang?: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.getListDetails(listId, user.householdId, lang);
  }

  @Patch(':id')
  async updateList(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') listId: string,
    @Body() dto: UpdateListDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.updateList(listId, user.householdId, dto);
  }

  @Delete(':id')
  async deleteList(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') listId: string,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
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
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.addItems(listId, user.householdId, dto);
  }
}

/**
 * Shopping items controller handling individual item operations.
 * API Version: 1
 * All endpoints require authentication and household membership.
 */
@Controller({ path: 'shopping-items', version: '1' })
@UseGuards(JwtAuthGuard, HouseholdGuard)
export class ShoppingItemsController {
  private readonly logger = new Logger(ShoppingItemsController.name);

  constructor(private shoppingService: ShoppingService) {}

  @Get('custom')
  async getCustomItems(@CurrentUser() user: CurrentUserPayload) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.getCustomItems(user.householdId);
  }

  @Patch(':id')
  async updateItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') itemId: string,
    @Body() dto: UpdateItemDto,
  ) {
    if (!user.householdId) {
      throw new BadRequestException('User must belong to a household');
    }
    return this.shoppingService.updateItem(itemId, user.householdId, dto);
  }

  @Delete(':id')
  async deleteItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') itemId: string,
  ) {
    this.logger.log(`DELETE /shopping-items/${itemId} - deleteItem called`);
    this.logger.debug(
      `User: ${JSON.stringify({
        id: user.userId,
        email: user.email,
        householdId: user.householdId,
      })}`,
    );

    if (!user.householdId) {
      this.logger.error('User must belong to a household');
      throw new BadRequestException('User must belong to a household');
    }

    await this.shoppingService.deleteItem(itemId, user.householdId);
    this.logger.log(`Item ${itemId} deleted successfully`);
    return { success: true };
  }
}
