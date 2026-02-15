import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';
import type { Recipe, ShoppingList, ShoppingItem, Chore } from '@prisma/client';

/** Recipe shape returned in user data export (active records only). */
export type RecipeExport = Recipe;

/** Shopping list with items for export. */
export type ShoppingListExport = ShoppingList & {
  items: ShoppingItem[];
};

/** Chore shape for export (assigned to user). */
export type ChoreExport = Chore;

export interface UserExportData {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
    createdAt: Date;
  };
  household: {
    id: string;
    name: string;
    role: string;
  } | null;
  recipes: RecipeExport[];
  shoppingLists: ShoppingListExport[];
  assignedChores: ChoreExport[];
}

/**
 * Repository for user-related data access (export, etc.).
 */
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches all data needed for GDPR data export for the given user.
   * Excludes soft-deleted household data.
   */
  async getUserExportData(userId: string): Promise<UserExportData | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        householdId: true,
        household: {
          select: {
            id: true,
            name: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!user) return null;

    const householdId = user.householdId;
    const householdRow = user.household;
    const household =
      householdRow && !householdRow.deletedAt
        ? { id: householdRow.id, name: householdRow.name }
        : null;

    let recipes: RecipeExport[] = [];
    let shoppingLists: ShoppingListExport[] = [];
    let assignedChores: ChoreExport[] = [];

    if (householdId && household) {
      const [recipesList, listsWithItems, chores] = await Promise.all([
        this.prisma.recipe.findMany({
          where: { householdId, ...ACTIVE_RECORDS_FILTER },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.shoppingList.findMany({
          where: { householdId, ...ACTIVE_RECORDS_FILTER },
          include: {
            items: { where: ACTIVE_RECORDS_FILTER },
          },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.chore.findMany({
          where: { assigneeId: userId, ...ACTIVE_RECORDS_FILTER },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      recipes = recipesList;
      shoppingLists = listsWithItems;
      assignedChores = chores;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      household: household
        ? {
            id: household.id,
            name: household.name,
            role: user.role,
          }
        : null,
      recipes,
      shoppingLists,
      assignedChores,
    };
  }
}
