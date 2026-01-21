import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ShoppingRepository } from '../repositories/shopping.repository';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  GrocerySearchItemDto,
  ShoppingListSummaryDto,
  ShoppingListDetailDto,
  CreateListDto,
  AddItemsDto,
  UpdateItemDto,
  ShoppingItemDto,
} from '../dtos';

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
  
  /**
   * In-memory grocery database.
   * TODO: Move to database table for production use.
   */
  private groceryDatabase: GrocerySearchItemDto[] = [
    { id: '1', name: 'Milk', category: 'Dairy', defaultUnit: 'gallon' },
    { id: '2', name: 'Eggs', category: 'Dairy', defaultUnit: 'dozen' },
    { id: '3', name: 'Bread', category: 'Bakery', defaultUnit: 'loaf' },
    { id: '4', name: 'Bananas', category: 'Produce', defaultUnit: 'lb' },
    { id: '5', name: 'Chicken', category: 'Meat', defaultUnit: 'lb' },
  ];

  constructor(
    private shoppingRepository: ShoppingRepository,
    private prisma: PrismaService,
  ) {}

  /**
   * Searches groceries by name (case-insensitive).
   * 
   * @param query - Search query string
   * @returns Array of matching grocery items
   */
  async searchGroceries(query: string): Promise<GrocerySearchItemDto[]> {
    const lowerQuery = query.toLowerCase();
    return this.groceryDatabase.filter((item) =>
      item.name.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Gets all unique grocery categories.
   * 
   * @returns Sorted array of category names
   */
  async getCategories(): Promise<string[]> {
    const categories = new Set(this.groceryDatabase.map((item) => item.category));
    return Array.from(categories).sort();
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
      where: { householdId },
      include: {
        _count: {
          select: { items: true },
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
    const list = await this.shoppingRepository.createList(householdId, dto);
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
  async getListDetails(listId: string, householdId: string): Promise<ShoppingListDetailDto> {
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
      items: list.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        category: item.category,
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
  async addItems(listId: string, householdId: string, dto: AddItemsDto): Promise<{ addedItems: ShoppingItemDto[] }> {
    const list = await this.shoppingRepository.findListById(listId);

    if (!list) {
      throw new NotFoundException('Shopping list not found');
    }

    if (list.householdId !== householdId) {
      throw new ForbiddenException('Access denied');
    }

    const addedItems = await Promise.all(
      dto.items.map((item) =>
        this.shoppingRepository.createItem(listId, {
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit,
          category: item.category,
          isChecked: item.isChecked || false,
        }),
      ),
    );

    return {
      addedItems: addedItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.isChecked,
        category: item.category,
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
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        isChecked: updatedItem.isChecked,
        category: updatedItem.category,
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
}
