import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

/**
 * Repository for managing import-related database operations
 */
@Injectable()
export class ImportRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves existing import mappings for a user's source fields
   * Uses efficient query with direct userId filter and sourceField IN clause
   *
   * Requires database index on userId and composite index on (userId, sourceField)
   * for optimal performance. The unique constraint @@unique([userId, sourceField])
   * automatically creates the necessary index.
   *
   * @param userId - The user ID to filter mappings by
   * @param sourceFields - Array of source field IDs to find mappings for
   * @returns Map of sourceField -> targetField mappings
   */
  async findMappingsForUser(
    userId: string,
    sourceFields: string[],
  ): Promise<Map<string, string>> {
    if (sourceFields.length === 0) {
      return new Map<string, string>();
    }

    const mappings = await this.prisma.importMapping.findMany({
      where: {
        userId,
        sourceField: {
          in: sourceFields,
        },
      },
      select: {
        sourceField: true,
        sourceType: true,
        targetField: true,
      },
    });

    return new Map(
      mappings.map((mapping) => [
        `${mapping.sourceType}:${mapping.sourceField}`,
        mapping.targetField,
      ]),
    );
  }

  /**
   * Finds a recipe by household ID and title (case-insensitive)
   * Used for fingerprint deduplication
   *
   * @param householdId - The household ID to search in
   * @param title - The recipe title to search for
   * @returns The matching recipe's ID if found, null otherwise
   */
  async findRecipeByFingerprint(
    householdId: string,
    title: string,
  ): Promise<string | null> {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        householdId,
        title: {
          equals: title,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    return recipe?.id || null;
  }

  /**
   * Finds a shopping list by household ID and name (case-insensitive)
   * Used for fingerprint deduplication
   *
   * @param householdId - The household ID to search in
   * @param name - The shopping list name to search for
   * @returns The matching shopping list's ID if found, null otherwise
   */
  async findShoppingListByFingerprint(
    householdId: string,
    name: string,
  ): Promise<string | null> {
    const list = await this.prisma.shoppingList.findFirst({
      where: {
        householdId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
      },
    });

    return list?.id || null;
  }
}
