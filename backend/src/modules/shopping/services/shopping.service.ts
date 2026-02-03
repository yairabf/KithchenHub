import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ShoppingRepository } from '../repositories/shopping.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';
import {
  GrocerySearchItemDto,
  ShoppingListSummaryDto,
  ShoppingListDetailDto,
  CreateListDto,
  AddItemsDto,
  UpdateItemDto,
  ShoppingItemDto,
} from '../dtos';
import { loadConfiguration } from '../../../config/configuration';

/**
 * Shopping service handling shopping lists, items, and grocery search.
 *
 * Responsibilities:
 * - Shopping list CRUD operations
 * - Shopping item management
 * - Grocery search and category retrieval
 */
@Injectable()
export class ShoppingService {
  private readonly logger = new Logger(ShoppingService.name);

  constructor(
    private shoppingRepository: ShoppingRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * Resolves a catalog item by ID and throws if not found.
   *
   * @param catalogItemId - Catalog item identifier
   * @returns Catalog item entity
   */
  private async getCatalogItemOrThrow(catalogItemId: string) {
    const catalogItem = await this.prisma.masterGroceryCatalog.findUnique({
      where: { id: catalogItemId },
    });

    if (!catalogItem) {
      throw new BadRequestException('Catalog item not found');
    }

    return catalogItem;
  }

  /**
   * Builds shopping item data from catalog/defaults and input overrides.
   *
   * @param input - Shopping item input
   * @param catalogItem - Catalog item if present
   * @param catalogItemId - Catalog item identifier
   * @returns Persistable shopping item fields
   */
  private buildItemData(
    input: {
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      image?: string;
      isChecked?: boolean;
    },
    catalogItem: {
      name: string;
      category: string;
      defaultUnit?: string | null;
      defaultQuantity?: number | null;
      imageUrl?: string | null;
    } | null,
    catalogItemId?: string,
  ) {
    const name = catalogItem?.name ?? input.name;
    if (!name) {
      throw new BadRequestException('Shopping item name is required');
    }

    return {
      catalogItemId,
      name,
      category: catalogItem?.category ?? input.category,
      unit: input.unit ?? catalogItem?.defaultUnit ?? undefined,
      quantity: input.quantity ?? catalogItem?.defaultQuantity ?? 1,
      image: input.image ?? this.resolveCatalogImageUrl(catalogItem?.imageUrl),
      isChecked: input.isChecked ?? false,
    };
  }

  /**
   * Rewrites relative catalog image URLs to the configured storage base URL
   * (e.g. downloaded_icons/chicken.png → http://localhost:9000/catalog-icons/downloaded_icons/chicken.png).
   */
  private resolveCatalogImageUrl(
    imageUrl: string | null | undefined,
  ): string | undefined {
    if (imageUrl == null || imageUrl === '') {
      return undefined;
    }
    const trimmed = imageUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const { catalogIconsBaseUrl } = loadConfiguration();
    if (!catalogIconsBaseUrl) {
      return trimmed;
    }
    const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    return `${catalogIconsBaseUrl}/${path}`;
  }

  /**
   * Searches groceries by name (case-insensitive).
   *
   * @param query - Search query string
   * @returns Array of matching grocery items
   */
  async searchGroceries(query: string): Promise<GrocerySearchItemDto[]> {
    const searchTerm = query?.trim() ?? '';
    const rows = await this.prisma.masterGroceryCatalog.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
        imageUrl: true,
        defaultQuantity: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      defaultUnit: row.defaultUnit ?? undefined,
      imageUrl: this.resolveCatalogImageUrl(row.imageUrl),
      defaultQuantity: row.defaultQuantity ?? 1,
    }));
  }

  /**
   * Gets all unique grocery categories.
   *
   * @returns Sorted array of category names
   */
  async getCategories(): Promise<string[]> {
    const categories = await this.prisma.masterGroceryCatalog.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map((item) => item.category);
  }

  /**
   * Gets all shopping lists for a household with item counts.
   * Uses a single query with aggregation to avoid N+1 problem.
   *
   * @param householdId - The household ID
   * @returns Array of shopping list summaries with item counts
   */
  async getLists(householdId: string): Promise<ShoppingListSummaryDto[]> {
    const lists = await this.prisma.shoppingList.findMany({
      where: {
        householdId,
        ...ACTIVE_RECORDS_FILTER,
      },
      include: {
        _count: {
          select: {
            items: {
              where: ACTIVE_RECORDS_FILTER,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      color: list.color,
      itemCount: list._count.items,
    }));
  }

  /**
   * Creates a new shopping list.
   *
   * @param householdId - The household ID
   * @param dto - List creation data
   * @returns Created list ID and name
   */
  async createList(
    householdId: string,
    dto: CreateListDto,
  ): Promise<{ id: string; name: string }> {
    this.logger.log(`Creating shopping list for household ${householdId}`);
    this.logger.debug(`List data: ${JSON.stringify(dto, null, 2)}`);

    const list = await this.shoppingRepository.createList(householdId, dto);

    this.logger.log(`Shopping list created successfully with ID: ${list.id}`);
    this.logger.debug(`Created list: ${JSON.stringify(list, null, 2)}`);

    return { id: list.id, name: list.name };
  }

  /**
   * Gets detailed information about a shopping list including all items.
   *
   * @param listId - The shopping list ID
   * @param householdId - The household ID for authorization
   * @returns Shopping list details with items
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async getListDetails(
    listId: string,
    householdId: string,
  ): Promise<ShoppingListDetailDto> {
    const list = await this.shoppingRepository.findListWithItems(listId);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    if (list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      id: list.id,
      name: list.name,
      color: list.color,
      icon: list.icon ?? undefined,
      items: list.items.map((item) => ({
        id: item.id,
        catalogItemId: item.catalogItemId ?? undefined,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        category: item.category,
        image: item.image ?? undefined,
      })),
    };
  }

  /**
   * Adds multiple items to a shopping list.
   *
   * @param listId - The shopping list ID
   * @param householdId - The household ID for authorization
   * @param dto - Items to add
   * @returns Added items
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async addItems(
    listId: string,
    householdId: string,
    userId: string,
    dto: AddItemsDto,
  ): Promise<{ addedItems: ShoppingItemDto[] }> {
    const list = await this.shoppingRepository.findListById(listId);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    if (list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const addedItems = await Promise.all(
      dto.items.map((item) => this.createItemFromInput(listId, userId, item)),
    );

    return {
      addedItems: addedItems.map((item) => ({
        id: item.id,
        catalogItemId: item.catalogItemId ?? undefined,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        category: item.category,
        image: item.image ?? undefined,
      })),
    };
  }

  /**
   * Updates a shopping item (quantity or checked status).
   *
   * @param itemId - The shopping item ID
   * @param householdId - The household ID for authorization
   * @param dto - Update data
   * @returns Updated item
   * @throws NotFoundException if item doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async updateItem(
    itemId: string,
    householdId: string,
    dto: UpdateItemDto,
  ): Promise<{ updatedItem: ShoppingItemDto }> {
    const item = await this.shoppingRepository.findItemById(itemId);

    if (!item) {
      throw new NotFoundException('Shopping item not found');
    }

    const list = await this.shoppingRepository.findListById(item.listId);

    if (!list || list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedItem = await this.shoppingRepository.updateItem(itemId, dto);

    return {
      updatedItem: {
        id: updatedItem.id,
        catalogItemId: updatedItem.catalogItemId ?? undefined,
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        isChecked: updatedItem.isChecked,
        category: updatedItem.category,
        image: updatedItem.image ?? undefined,
      },
    };
  }

  /**
   * Deletes a shopping item.
   *
   * @param itemId - The shopping item ID
   * @param householdId - The household ID for authorization
   * @throws NotFoundException if item doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async deleteItem(itemId: string, householdId: string): Promise<void> {
    const item = await this.shoppingRepository.findItemById(itemId);

    if (!item) {
      throw new NotFoundException('Shopping item not found');
    }

    const list = await this.shoppingRepository.findListById(item.listId);

    if (!list || list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    await this.shoppingRepository.deleteItem(itemId);
  }

  /**
   * Deletes a shopping list and all its items.
   *
   * @param listId - The shopping list ID
   * @param householdId - The household ID for authorization
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async deleteList(listId: string, householdId: string): Promise<void> {
    const list = await this.shoppingRepository.findListById(listId);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    if (list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    await this.shoppingRepository.deleteList(listId);
  }

  /**
   * Creates a shopping item from input and optional catalog defaults.
   *
   * @param listId - Shopping list ID
   * @param item - Item input
   * @returns Persisted shopping item
   */
  async createItemFromInput(
    listId: string,
    userId: string,
    item: {
      catalogItemId?: string;
      masterItemId?: string;
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string;
      image?: string;
      isChecked?: boolean;
    },
  ) {
    if (item.catalogItemId && item.masterItemId) {
      throw new BadRequestException('Only one catalog identifier is allowed');
    }

    const catalogItemId = item.catalogItemId ?? item.masterItemId;
    let catalogItem = null;
    let userItemId: string | undefined;

    if (catalogItemId) {
      catalogItem = await this.getCatalogItemOrThrow(catalogItemId);
    } else {
      const normalizedName = item.name?.trim();
      if (normalizedName) {
        const userItem = await this.shoppingRepository.findUserItemByName(
          userId,
          normalizedName,
        );
        if (userItem) {
          userItemId = userItem.id;
        } else {
          const newItem = await this.shoppingRepository.createUserItem(
            userId,
            normalizedName,
            item.category,
          );
          userItemId = newItem.id;
        }
      }
    }

    const itemData = this.buildItemData(item, catalogItem, catalogItemId);

    return this.shoppingRepository.createItem(listId, {
      ...itemData,
      userItemId,
    });
  }

  /**
   * Gets all custom user items.
   *
   * @param userId - The user ID
   * @returns List of user items
   */
  async getUserItems(userId: string) {
    return this.shoppingRepository.findUserItems(userId);
  }
}
