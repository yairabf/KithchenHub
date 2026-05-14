import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  CustomItem,
  HouseholdItemFrequency,
  ShoppingItem,
  ShoppingList,
} from '@prisma/client';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

interface HouseholdFrequencyIdentityInput {
  householdId: string;
  catalogItemId?: string;
  customItemId?: string;
  name: string;
  category?: string;
  image?: string;
}

interface HouseholdFrequencyAddInput extends HouseholdFrequencyIdentityInput {
  quantity: number;
}

interface ShoppingItemCreateInput {
  catalogItemId?: string;
  customItemId?: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  image?: string;
  isChecked?: boolean;
}

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
    return this.prisma.shoppingList.findFirst({
      where: {
        id,
        ...ACTIVE_RECORDS_FILTER,
      },
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
    this.logger.log('Soft-deleting shopping list', {
      action: 'SOFT_DELETE_LIST',
      entityType: 'SHOPPING_LIST',
      entityId: id,
      timestamp: new Date().toISOString(),
    });
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
    this.logger.log('Restoring shopping list', {
      action: 'RESTORE_LIST',
      entityType: 'SHOPPING_LIST',
      entityId: id,
      timestamp: new Date().toISOString(),
    });
    await this.prisma.shoppingList.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async createItem(
    listId: string,
    data: ShoppingItemCreateInput,
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

  async createOrIncrementActiveItem(
    householdId: string,
    listId: string,
    data: ShoppingItemCreateInput,
  ): Promise<ShoppingItem> {
    const identityKey = this.getShoppingItemIdentityKey(data);

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${listId}), hashtext(${identityKey}))
      `;

      const existingItem = await this.findActiveItemByIdentityWithClient(
        tx,
        listId,
        data,
      );

      if (existingItem) {
        return tx.shoppingItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: { increment: data.quantity },
          },
        });
      }

      const customItemId =
        data.customItemId ??
        (data.catalogItemId
          ? undefined
          : await this.findOrCreateCustomItemWithClient(
              tx,
              householdId,
              data.name,
              data.category,
            ));

      return tx.shoppingItem.create({
        data: {
          listId,
          catalogItemId: data.catalogItemId,
          customItemId,
          name: data.name,
          quantity: data.quantity,
          unit: data.unit,
          category: data.category,
          image: data.image,
          isChecked: data.isChecked || false,
        },
      });
    });
  }

  private getShoppingItemIdentityKey(
    identity: ShoppingItemCreateInput,
  ): string {
    if (identity.catalogItemId) {
      return `catalog:${identity.catalogItemId}`;
    }
    if (identity.customItemId) {
      return `custom:${identity.customItemId}`;
    }
    return `name:${identity.name.trim().toLowerCase()}`;
  }

  private getShoppingItemIdentityFilter(identity: {
    catalogItemId?: string;
    customItemId?: string;
    name?: string;
  }):
    | { catalogItemId: string }
    | { customItemId: string }
    | { name: { equals: string; mode: 'insensitive' } }
    | null {
    if (identity.catalogItemId) {
      return { catalogItemId: identity.catalogItemId };
    }
    if (identity.customItemId) {
      return { customItemId: identity.customItemId };
    }
    if (identity.name) {
      return {
        name: { equals: identity.name, mode: 'insensitive' },
      };
    }
    return null;
  }

  private async findActiveItemByIdentityWithClient(
    client: Pick<PrismaService, 'shoppingItem'>,
    listId: string,
    identity: {
      catalogItemId?: string;
      customItemId?: string;
      name?: string;
    },
  ): Promise<ShoppingItem | null> {
    const identityFilter = this.getShoppingItemIdentityFilter(identity);

    if (!identityFilter) {
      return null;
    }

    return client.shoppingItem.findFirst({
      where: {
        listId,
        ...ACTIVE_RECORDS_FILTER,
        ...identityFilter,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async findOrCreateCustomItemWithClient(
    client: Pick<PrismaService, 'customItem'>,
    householdId: string,
    name: string,
    category?: string,
  ): Promise<string> {
    const customItem = await client.customItem.findFirst({
      where: {
        householdId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...ACTIVE_RECORDS_FILTER,
      },
    });

    if (customItem) {
      return customItem.id;
    }

    const newItem = await client.customItem.create({
      data: {
        householdId,
        name,
        category,
      },
    });

    return newItem.id;
  }

  async findActiveItemByIdentity(
    listId: string,
    identity: {
      catalogItemId?: string;
      customItemId?: string;
      name?: string;
    },
  ): Promise<ShoppingItem | null> {
    return this.findActiveItemByIdentityWithClient(
      this.prisma,
      listId,
      identity,
    );
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
    this.logger.log('Soft-deleting shopping item', {
      action: 'SOFT_DELETE_ITEM',
      entityType: 'SHOPPING_ITEM',
      entityId: id,
      timestamp: new Date().toISOString(),
    });
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
    this.logger.log('Restoring shopping item', {
      action: 'RESTORE_ITEM',
      entityType: 'SHOPPING_ITEM',
      entityId: id,
      timestamp: new Date().toISOString(),
    });
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

  private buildHouseholdFrequencyIdentityKey(
    input: Pick<
      HouseholdFrequencyIdentityInput,
      'catalogItemId' | 'customItemId'
    >,
  ): string {
    if (input.catalogItemId) {
      return `catalog:${input.catalogItemId}`;
    }

    if (input.customItemId) {
      return `custom:${input.customItemId}`;
    }

    throw new Error(
      'Household item frequency requires a catalogItemId or customItemId',
    );
  }

  async incrementHouseholdItemFrequencyForAdd(
    input: HouseholdFrequencyAddInput,
  ): Promise<HouseholdItemFrequency> {
    const identityKey = this.buildHouseholdFrequencyIdentityKey(input);
    const quantityBonus = input.quantity > 1 ? 1 : 0;

    return this.prisma.householdItemFrequency.upsert({
      where: {
        householdId_identityKey: {
          householdId: input.householdId,
          identityKey,
        },
      },
      create: {
        householdId: input.householdId,
        identityKey,
        catalogItemId: input.catalogItemId,
        customItemId: input.customItemId,
        name: input.name,
        category: input.category,
        image: input.image,
        score: 1 + quantityBonus,
        addEventCount: 1,
        quantityBonusCount: quantityBonus,
      },
      update: {
        catalogItemId: input.catalogItemId,
        customItemId: input.customItemId,
        name: input.name,
        category: input.category,
        image: input.image,
        score: { increment: 1 + quantityBonus },
        addEventCount: { increment: 1 },
        quantityBonusCount: { increment: quantityBonus },
      },
    });
  }

  async incrementHouseholdItemFrequencyForQuantityIncrease(
    input: HouseholdFrequencyIdentityInput,
  ): Promise<HouseholdItemFrequency> {
    const identityKey = this.buildHouseholdFrequencyIdentityKey(input);

    return this.prisma.householdItemFrequency.upsert({
      where: {
        householdId_identityKey: {
          householdId: input.householdId,
          identityKey,
        },
      },
      create: {
        householdId: input.householdId,
        identityKey,
        catalogItemId: input.catalogItemId,
        customItemId: input.customItemId,
        name: input.name,
        category: input.category,
        image: input.image,
        score: 1,
        manualQuantityIncreaseCount: 1,
      },
      update: {
        catalogItemId: input.catalogItemId,
        customItemId: input.customItemId,
        name: input.name,
        category: input.category,
        image: input.image,
        score: { increment: 1 },
        manualQuantityIncreaseCount: { increment: 1 },
      },
    });
  }

  async findTopHouseholdFrequentItems(
    householdId: string,
    limit: number,
  ): Promise<HouseholdItemFrequency[]> {
    return this.prisma.householdItemFrequency.findMany({
      where: { householdId },
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
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
