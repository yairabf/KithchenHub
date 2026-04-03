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
  CatalogDisplayNameDto,
  ShoppingDataDto,
  ShoppingListSummaryDto,
  ShoppingListDetailDto,
  CreateListDto,
  AddItemsDto,
  UpdateItemDto,
  UpdateListDto,
  ShoppingItemDto,
} from '../dtos';
import { loadConfiguration } from '../../../config/configuration';
import { MemoryCacheService } from '../../../infrastructure/cache';

interface CatalogSearchRow {
  catalog_id: string;
  match_name: string;
  category: string;
  default_unit: string | null;
  image_url: string | null;
  default_quantity: number | null;
  match_score: number;
}

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
  private static readonly SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
  private static readonly SEARCH_CACHE_PREFIX = 'catalog_search:';
  private static readonly SEARCH_RESULT_LIMIT = 50;

  constructor(
    private shoppingRepository: ShoppingRepository,
    private prisma: PrismaService,
    private cache: MemoryCacheService,
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
    const normalizedCatalogName = catalogItem?.name?.trim();
    const normalizedInputName = input.name?.trim();
    const name = normalizedCatalogName || normalizedInputName;
    if (!name) {
      throw new BadRequestException('Shopping item name is required');
    }

    const normalizedCatalogCategory = catalogItem?.category?.trim();
    const normalizedInputCategory = input.category?.trim();
    const category = normalizedCatalogCategory || normalizedInputCategory;

    return {
      catalogItemId,
      name,
      category,
      unit: input.unit ?? catalogItem?.defaultUnit ?? undefined,
      quantity: input.quantity ?? catalogItem?.defaultQuantity ?? 1,
      image: input.image ?? this.resolveCatalogImageUrl(catalogItem?.imageUrl),
      isChecked: input.isChecked ?? false,
    };
  }

  /**
   * Rewrites relative catalog image URLs to the configured storage base URL
   * (e.g. items_images/chicken.png → http://localhost:9000/catalog-icons/items_images/chicken.png).
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

  private normalizeSearchLanguage(lang?: string): string {
    const normalized = lang?.trim().toLowerCase();
    if (!normalized || normalized.length === 0) {
      return 'en';
    }

    return normalized;
  }

  private getBaseLanguage(lang: string): string {
    const [baseLanguage] = lang.split(/[-_]/);
    return baseLanguage && baseLanguage.length > 0 ? baseLanguage : 'en';
  }

  private buildLanguageOrFilters(
    normalizedLang: string,
    baseLang: string,
  ): Array<Record<string, unknown>> {
    const filters: Array<Record<string, unknown>> = [{ lang: normalizedLang }];

    if (baseLang !== normalizedLang) {
      filters.push({ lang: baseLang });
    }

    filters.push({ lang: { startsWith: `${baseLang}-` } });
    return filters;
  }

  private resolveLocalizedCatalogName(
    canonicalName: string,
    translations: Array<{ lang: string; name: string }>,
    normalizedLang: string,
    baseLang: string,
  ): string {
    const requestedName = translations
      .find((item) => item.lang === normalizedLang)
      ?.name?.trim();
    if (requestedName) {
      return requestedName;
    }

    const baseName = translations
      .find((item) => item.lang === baseLang)
      ?.name?.trim();
    if (baseName) {
      return baseName;
    }

    const baseVariantName = translations
      .find((item) => item.lang.startsWith(`${baseLang}-`))
      ?.name?.trim();
    if (baseVariantName) {
      return baseVariantName;
    }

    const englishName = translations
      .find((item) => item.lang === 'en')
      ?.name?.trim();
    if (englishName) {
      return englishName;
    }

    const englishVariantName = translations
      .find((item) => item.lang.startsWith('en-'))
      ?.name?.trim();
    if (englishVariantName) {
      return englishVariantName;
    }

    return canonicalName;
  }

  /**
   * Searches groceries using the database search_catalog() function.
   * Provides typo tolerance via pg_trgm similarity, multilingual support,
   * and database-level relevance scoring with in-memory TTL caching.
   *
   * @param query - Search query string
   * @param lang - Optional language code (e.g. 'he', 'en-US')
   * @returns Array of matching grocery items, ranked by relevance
   */
  async searchGroceries(
    query: string,
    lang?: string,
  ): Promise<GrocerySearchItemDto[]> {
    const searchTerm = query?.trim() ?? '';
    if (!searchTerm) {
      return [];
    }

    const normalizedLang = this.normalizeSearchLanguage(lang);
    const cacheKey = `${ShoppingService.SEARCH_CACHE_PREFIX}${normalizedLang}:${searchTerm.toLowerCase()}`;

    const cached = this.cache.get<GrocerySearchItemDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await this.prisma.$queryRaw<CatalogSearchRow[]>`
      SELECT * FROM search_catalog(
        ${searchTerm},
        ${normalizedLang},
        ${ShoppingService.SEARCH_RESULT_LIMIT}
      )
    `;

    const results = rows.map((row) => ({
      id: row.catalog_id,
      name: row.match_name,
      category: row.category,
      defaultUnit: row.default_unit ?? undefined,
      imageUrl: this.resolveCatalogImageUrl(row.image_url),
      defaultQuantity: row.default_quantity ?? 1,
    }));

    this.cache.set(cacheKey, results, ShoppingService.SEARCH_CACHE_TTL_MS);

    return results;
  }

  /**
   * Gets groceries by category name (case-insensitive).
   *
   * @param category - Category query string
   * @param limit - Maximum number of results to return (1-200)
   * @returns Array of matching grocery items
   */
  async getGroceriesByCategory(
    category: string,
    lang?: string,
    limit = 100,
  ): Promise<GrocerySearchItemDto[]> {
    const categoryTerm = category?.trim() ?? '';
    const normalizedLang = this.normalizeSearchLanguage(lang);
    const baseLang = this.getBaseLanguage(normalizedLang);
    const languageOrFilters = this.buildLanguageOrFilters(
      normalizedLang,
      baseLang,
    );
    if (!categoryTerm) {
      return [];
    }

    const safeLimit = Math.min(Math.max(limit, 1), 200);

    const rows = await this.prisma.masterGroceryCatalog.findMany({
      where: {
        category: {
          contains: categoryTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
        category: true,
        defaultUnit: true,
        imageUrl: true,
        defaultQuantity: true,
        translations: {
          where: {
            OR: [
              ...languageOrFilters,
              { lang: 'en' },
              { lang: { startsWith: 'en-' } },
            ],
          },
          select: {
            lang: true,
            name: true,
          },
        },
        aliases: {
          where: {
            OR: languageOrFilters,
          },
          select: {
            alias: true,
          },
        },
      },
    });

    return rows
      .map((row) => ({
        id: row.id,
        name: this.resolveLocalizedCatalogName(
          row.name,
          row.translations,
          normalizedLang,
          baseLang,
        ),
        category: row.category,
        defaultUnit: row.defaultUnit ?? undefined,
        imageUrl: this.resolveCatalogImageUrl(row.imageUrl),
        defaultQuantity: row.defaultQuantity ?? 1,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Returns display names for catalog IDs in the requested language.
   * Uses the same resolution order as search/category: requested lang → base lang → en → canonical.
   * IDs not found in the catalog are omitted from the result.
   *
   * @param ids - Catalog item IDs to resolve
   * @param lang - Optional language code (e.g. 'he', 'en')
   * @returns Array of { id, name } for found catalog items
   */
  async getCatalogDisplayNames(
    ids: string[],
    lang?: string,
  ): Promise<CatalogDisplayNameDto[]> {
    const uniqueIds = [...new Set(ids)].filter(
      (id) => id?.trim?.()?.length > 0,
    );
    if (uniqueIds.length === 0) {
      return [];
    }

    const normalizedLang = this.normalizeSearchLanguage(lang);
    const baseLang = this.getBaseLanguage(normalizedLang);
    const languageOrFilters = this.buildLanguageOrFilters(
      normalizedLang,
      baseLang,
    );

    const rows = await this.prisma.masterGroceryCatalog.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        name: true,
        translations: {
          where: {
            OR: [
              ...languageOrFilters,
              { lang: 'en' },
              { lang: { startsWith: 'en-' } },
            ],
          },
          select: {
            lang: true,
            name: true,
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: this.resolveLocalizedCatalogName(
        row.name,
        row.translations,
        normalizedLang,
        baseLang,
      ),
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

    const mappedLists = lists.map((list) => ({
      id: list.id,
      name: list.name,
      color: list.color ?? undefined,
      icon: list.icon ?? undefined,
      isMain: list.isMain,
      itemCount: list._count.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));

    // Sort so main list is always first
    return mappedLists.sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return 0;
    });
  }

  async getShoppingData(
    householdId: string,
    lang?: string,
  ): Promise<ShoppingDataDto> {
    const lists = await this.prisma.shoppingList.findMany({
      where: {
        householdId,
        ...ACTIVE_RECORDS_FILTER,
      },
      include: {
        items: {
          where: ACTIVE_RECORDS_FILTER,
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            items: {
              where: ACTIVE_RECORDS_FILTER,
            },
          },
        },
      },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }],
    });

    const mappedLists = lists.map((list) => ({
      id: list.id,
      name: list.name,
      color: list.color ?? undefined,
      icon: list.icon ?? undefined,
      isMain: list.isMain,
      itemCount: list._count.items,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));

    const allItems = lists.flatMap((list) =>
      list.items.map((item) => ({
        listId: list.id,
        ...item,
      })),
    );

    let nameByCatalogId: Map<string, string> = new Map();
    if (lang != null && lang.trim() !== '') {
      const catalogIds = allItems
        .map((item) => item.catalogItemId)
        .filter((id): id is string => id != null && id.trim() !== '');

      if (catalogIds.length > 0) {
        const resolved = await this.getCatalogDisplayNames(catalogIds, lang);
        nameByCatalogId = new Map(
          resolved.map((entry) => [entry.id, entry.name]),
        );
      }
    }

    return {
      lists: mappedLists,
      items: allItems.map((item) => {
        const displayName =
          item.catalogItemId != null
            ? nameByCatalogId.get(item.catalogItemId)
            : undefined;

        return {
          listId: item.listId,
          id: item.id,
          catalogItemId: item.catalogItemId ?? undefined,
          name: displayName ?? item.name,
          quantity: item.quantity,
          unit: item.unit,
          isChecked: item.isChecked,
          category: item.category,
          image: item.image ?? undefined,
        };
      }),
    };
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
   * @param lang - Optional language code to resolve catalog item names (e.g. 'he', 'en')
   * @returns Shopping list details with items
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async getListDetails(
    listId: string,
    householdId: string,
    lang?: string,
  ): Promise<ShoppingListDetailDto> {
    const list = await this.shoppingRepository.findListWithItems(listId);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    if (list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    let nameByCatalogId: Map<string, string> = new Map();
    if (lang != null && lang.trim() !== '') {
      const catalogIds = list.items
        .map((item) => item.catalogItemId)
        .filter((id): id is string => id != null && id.trim() !== '');
      if (catalogIds.length > 0) {
        const resolved = await this.getCatalogDisplayNames(catalogIds, lang);
        nameByCatalogId = new Map(resolved.map((r) => [r.id, r.name]));
      }
    }

    return {
      id: list.id,
      name: list.name,
      color: list.color,
      icon: list.icon ?? undefined,
      items: list.items.map((item) => {
        const displayName =
          item.catalogItemId != null
            ? nameByCatalogId.get(item.catalogItemId)
            : undefined;
        return {
          id: item.id,
          catalogItemId: item.catalogItemId ?? undefined,
          name: displayName ?? item.name,
          quantity: item.quantity,
          unit: item.unit,
          isChecked: item.isChecked,
          category: item.category,
          image: item.image ?? undefined,
        };
      }),
    };
  }

  /**
   * Gets the main shopping list for a household.
   *
   * @param householdId - The household ID
   * @returns Main shopping list or null if none exists
   */
  async getMainList(
    householdId: string,
  ): Promise<ShoppingListSummaryDto | null> {
    const mainList = await this.shoppingRepository.findMainList(householdId);
    if (!mainList) return null;

    const itemCount = await this.shoppingRepository.countActiveItems(
      mainList.id,
    );
    return {
      id: mainList.id,
      name: mainList.name,
      color: mainList.color ?? undefined,
      icon: mainList.icon ?? undefined,
      isMain: mainList.isMain,
      itemCount,
      createdAt: mainList.createdAt,
      updatedAt: mainList.updatedAt,
    };
  }

  /**
   * Updates a shopping list.
   *
   * @param listId - The shopping list ID
   * @param householdId - The household ID for authorization
   * @param dto - Update data
   * @returns Updated list
   * @throws NotFoundException if list doesn't exist
   * @throws ForbiddenException if user doesn't have access
   */
  async updateList(
    listId: string,
    householdId: string,
    dto: UpdateListDto,
  ): Promise<ShoppingListSummaryDto> {
    const list = await this.shoppingRepository.findListById(listId);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    if (list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    // If setting this list as main, remove main flag from other lists
    if (dto.isMain === true) {
      await this.shoppingRepository.clearMainListFlag(householdId, listId);
    }

    const updatedList = await this.shoppingRepository.updateList(listId, dto);
    const itemCount = await this.shoppingRepository.countActiveItems(listId);

    return {
      id: updatedList.id,
      name: updatedList.name,
      color: updatedList.color ?? undefined,
      icon: updatedList.icon ?? undefined,
      isMain: updatedList.isMain,
      itemCount,
      createdAt: updatedList.createdAt,
      updatedAt: updatedList.updatedAt,
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
      dto.items.map((item) =>
        this.createItemFromInput(listId, householdId, item),
      ),
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

    if (list.isMain) {
      throw new BadRequestException('Main shopping list cannot be deleted');
    }

    await this.shoppingRepository.deleteList(listId);
  }

  /**
   * Creates a shopping item from input and optional catalog defaults.
   *
   * @param listId - Shopping list ID
   * @param householdId - Household ID for custom item creation
   * @param item - Item input
   * @returns Persisted shopping item
   */
  async createItemFromInput(
    listId: string,
    householdId: string,
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
    let customItemId: string | undefined;

    if (catalogItemId) {
      catalogItem = await this.getCatalogItemOrThrow(catalogItemId);
    } else {
      const normalizedName = item.name?.trim();
      if (normalizedName) {
        const customItem = await this.shoppingRepository.findCustomItemByName(
          householdId,
          normalizedName,
        );
        if (customItem) {
          customItemId = customItem.id;
        } else {
          const newItem = await this.shoppingRepository.createCustomItem(
            householdId,
            normalizedName,
            item.category,
          );
          customItemId = newItem.id;
        }
      }
    }

    const itemData = this.buildItemData(item, catalogItem, catalogItemId);

    return this.shoppingRepository.createItem(listId, {
      ...itemData,
      customItemId,
    });
  }

  /**
   * Gets all custom items for a household.
   *
   * @param householdId - The household ID
   * @returns List of custom items
   */
  async getCustomItems(householdId: string) {
    return this.shoppingRepository.findCustomItems(householdId);
  }
}
