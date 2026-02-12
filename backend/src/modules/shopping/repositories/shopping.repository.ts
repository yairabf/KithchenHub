import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ShoppingList, ShoppingItem, CustomItem } from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

@Injectable()
export class ShoppingRepository {
  private readonly logger = new Logger(ShoppingRepository.name);

  constructor(private prisma: PrismaService) {}

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
    data: { name: string; color?: string; icon?: string },
  ): Promise<ShoppingList> {
    this.logger.log(
      `Creating shopping list in database for household ${householdId}`,
    );
    this.logger.debug(`List data: ${JSON.stringify(data, null, 2)}`);

    try {
      const list = await this.prisma.shoppingList.create({
        data: {
          householdId,
          name: data.name,
          color: data.color,
          icon: data.icon,
        },
      });

      this.logger.log(`Shopping list created in database with ID: ${list.id}`);
      this.logger.debug(
        `Created list entity: ${JSON.stringify(list, null, 2)}`,
      );
      return list;
    } catch (error) {
      this.logger.error(
        `Failed to create shopping list in database: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error, null, 2)}`);
      throw error;
    }
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
      customItemId?: string;
      name: string;
      quantity: number;
      unit?: string;
      category?: string;
      image?: string;
      isChecked?: boolean;
    },
  ): Promise<ShoppingItem> {
    return this.prisma.shoppingItem.create({
      data: {
        listId,
        catalogItemId: data.catalogItemId,
        customItemId: data.customItemId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        image: data.image,
        isChecked: data.isChecked || false,
      },
    });
  }

  async findCustomItemByName(
    householdId: string,
    name: string,
  ): Promise<CustomItem | null> {
    return this.prisma.customItem.findFirst({
      where: {
        householdId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...ACTIVE_RECORDS_FILTER,
      },
    });
  }

  async createCustomItem(
    householdId: string,
    name: string,
    category?: string,
  ): Promise<CustomItem> {
    return this.prisma.customItem.create({
      data: {
        householdId,
        name,
        category,
      },
    });
  }

  async findCustomItems(householdId: string): Promise<CustomItem[]> {
    return this.prisma.customItem.findMany({
      where: {
        householdId,
        ...ACTIVE_RECORDS_FILTER,
      },
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

  async findMainList(householdId: string): Promise<ShoppingList | null> {
    return this.prisma.shoppingList.findFirst({
      where: {
        householdId,
        isMain: true,
        ...ACTIVE_RECORDS_FILTER,
      },
    });
  }

  async clearMainListFlag(
    householdId: string,
    excludeListId?: string,
  ): Promise<void> {
    await this.prisma.shoppingList.updateMany({
      where: {
        householdId,
        isMain: true,
        id: excludeListId ? { not: excludeListId } : undefined,
        ...ACTIVE_RECORDS_FILTER,
      },
      data: { isMain: false },
    });
  }

  async countActiveItems(listId: string): Promise<number> {
    return this.prisma.shoppingItem.count({
      where: {
        listId,
        ...ACTIVE_RECORDS_FILTER,
      },
    });
  }

  async updateList(
    id: string,
    data: { name?: string; color?: string; icon?: string; isMain?: boolean },
  ): Promise<ShoppingList> {
    return this.prisma.shoppingList.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft-deletes a custom item by setting deletedAt timestamp.
   *
   * @param id - Custom item ID to soft-delete
   */
  async deleteCustomItem(id: string): Promise<void> {
    this.logger.log(`Soft-deleting custom item: ${id}`);
    await this.prisma.customItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted custom item.
   *
   * @param id - Custom item ID to restore
   */
  async restoreCustomItem(id: string): Promise<void> {
    this.logger.log(`Restoring custom item: ${id}`);
    await this.prisma.customItem.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
