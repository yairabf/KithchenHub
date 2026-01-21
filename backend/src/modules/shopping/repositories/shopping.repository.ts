import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ShoppingList, ShoppingItem } from '@prisma/client';

@Injectable()
export class ShoppingRepository {
  constructor(private prisma: PrismaService) {}

  async findListsByHousehold(householdId: string): Promise<ShoppingList[]> {
    return this.prisma.shoppingList.findMany({
      where: { householdId },
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

  async deleteList(id: string): Promise<void> {
    await this.prisma.shoppingList.delete({
      where: { id },
    });
  }

  async createItem(
    listId: string,
    data: {
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
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        isChecked: data.isChecked || false,
      },
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

  async deleteItem(id: string): Promise<void> {
    await this.prisma.shoppingItem.delete({
      where: { id },
    });
  }

  async countItemsByList(listId: string): Promise<number> {
    return this.prisma.shoppingItem.count({
      where: { listId },
    });
  }
}
