import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ShoppingList, ShoppingItem, UserItem } from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

@Injectable()
export class ShoppingRepository {
  private readonly logger = new Logger(ShoppingRepository.name);

  constructor(private prisma: PrismaService) { }

  async findListsByHousehold(householdId: string): Promise<ShoppingList[]> {
    return this.prisma.shoppingList.findMany({
      where: {
        householdId,
        ...ACTIVE_RECORDS_FILTER,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findListById(id: string): Promise<ShoppingList | null> {
    return this.prisma.shoppingList.findUnique({
      where: { id },
    });
  }

  async findListWithItems(id: string): Promise<
    ShoppingList & {
      items: ShoppingItem[];
    }
  > {
    return this.prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          where: ACTIVE_RECORDS_FILTER,
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createList(
    householdId: string,
    data: { name: string; color?: string },
  ): Promise<ShoppingList> {
    return this.prisma.shoppingList.create({
      data: {
        householdId,
        name: data.name,
        color: data.color,
      },
    });
  }

  /**
   * Soft-deletes a shopping list by setting deletedAt timestamp.
   *
   * NOTE: Child items (ShoppingItem) are NOT automatically soft-deleted.
   * This is intentional design:
   * - Items are independently managed and soft-deleted via deleteItem()
   * - The application layer filters items by their own deletedAt status
   * - This allows for future features like "restore list with items"
   *
   * @param id - Shopping list ID to soft-delete
   */
  async deleteList(id: string): Promise<void> {
    this.logger.log(`Soft-deleting shopping list: ${id}`);
    await this.prisma.shoppingList.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted shopping list.
   *
   * @param id - Shopping list ID to restore
   */
  async restoreList(id: string): Promise<void> {
    this.logger.log(`Restoring shopping list: ${id}`);
    await this.prisma.shoppingList.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async createItem(
    listId: string,
    data: {
      catalogItemId?: string;
      userItemId?: string;
      name: string;
      quantity: number;
      unit?: string;
      category?: string;
      isChecked?: boolean;
    },
  ): Promise<ShoppingItem> {
    return this.prisma.shoppingItem.create({
      data: {
        listId,
        catalogItemId: data.catalogItemId,
        userItemId: data.userItemId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        isChecked: data.isChecked || false,
      },
    });
  }

  async findUserItemByName(
    userId: string,
    name: string,
  ): Promise<UserItem | null> {
    return this.prisma.userItem.findFirst({
      where: {
        userId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async createUserItem(
    userId: string,
    name: string,
    category?: string,
  ): Promise<UserItem> {
    return this.prisma.userItem.create({
      data: {
        userId,
        name,
        category,
      },
    });
  }

  async findUserItems(userId: string): Promise<UserItem[]> {
    return this.prisma.userItem.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findItemById(id: string): Promise<ShoppingItem | null> {
    return this.prisma.shoppingItem.findUnique({
      where: { id },
    });
  }

  async updateItem(
    id: string,
    data: { quantity?: number; isChecked?: boolean },
  ): Promise<ShoppingItem> {
    return this.prisma.shoppingItem.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft-deletes a shopping item by setting deletedAt timestamp.
   *
   * @param id - Shopping item ID to soft-delete
   */
  async deleteItem(id: string): Promise<void> {
    this.logger.log(`Soft-deleting shopping item: ${id}`);
    await this.prisma.shoppingItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted shopping item.
   *
   * @param id - Shopping item ID to restore
   */
  async restoreItem(id: string): Promise<void> {
    this.logger.log(`Restoring shopping item: ${id}`);
    await this.prisma.shoppingItem.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async countItemsByList(listId: string): Promise<number> {
    return this.prisma.shoppingItem.count({
      where: {
        listId,
        ...ACTIVE_RECORDS_FILTER,
      },
    });
  }
}
