import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ImportRepository } from '../repositories/import.repository';
import {
  ImportRequestDto,
  ImportResponseDto,
  ImportRecipeDto,
  ImportShoppingListDto,
} from '../dto/import.dto';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ImportSource,
  ImportStatus,
  ImportEntityType,
} from '../constants/import.constants';

/**
 * Statistics for import operations
 */
interface ImportStats {
  created: number;
  skipped: number;
  mappings: Record<string, string>;
}

/**
 * Type alias for Prisma transaction client
 */
type PrismaTransaction = Omit<
  PrismaService,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$use'
  | '$extends'
  | 'onModuleInit'
  | 'onModuleDestroy'
>;

/**
 * Type guard for Prisma unique constraint violation errors
 * @param error - The error to check
 * @returns True if error is a Prisma unique constraint violation
 */
function isPrismaUniqueConstraintError(error: unknown): error is {
  code: string;
  meta?: {
    target?: string[];
  };
} {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  );
}

/**
 * Service for managing data import operations
 * Handles importing recipes and shopping lists from guest mode to household accounts
 * Implements deduplication through mapping tables
 */
@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly importRepository: ImportRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Executes the import of recipes and shopping lists from guest mode to household
   * Creates deduplication mappings to prevent duplicate imports
   *
   * @param userId - The ID of the user performing the import
   * @param householdId - The ID of the household to import data into
   * @param importRequest - The import payload containing recipes and shopping lists
   * @returns ImportResponseDto with counts and ID mappings
   * @throws BadRequestException if data is invalid or duplicates are detected
   * @throws InternalServerErrorException if transaction fails
   */
  async executeImport(
    userId: string,
    householdId: string,
    importRequest: ImportRequestDto,
  ): Promise<ImportResponseDto> {
    this.logger.log(
      `Starting import for user ${userId} in household ${householdId}`,
    );

    const sourceIds = this.extractSourceIds(importRequest);
    const existingMappings = await this.importRepository.findMappingsForUser(
      userId,
      sourceIds,
    );

    try {
      const result = await this.performImportTransaction(
        userId,
        householdId,
        importRequest,
        existingMappings,
      );

      this.logger.log(
        `Import completed: ${result.created} created, ${result.skipped} skipped for user ${userId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Import failed for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw this.handleImportError(error, userId, importRequest);
    }
  }

  /**
   * Extracts all source IDs from the import request for mapping lookup
   *
   * @param importRequest - The import request DTO
   * @returns Array of all source IDs (recipe and shopping list IDs)
   */
  private extractSourceIds(importRequest: ImportRequestDto): string[] {
    const recipeIds = importRequest.recipes?.map((recipe) => recipe.id) || [];
    const listIds = importRequest.shoppingLists?.map((list) => list.id) || [];
    return [...recipeIds, ...listIds];
  }

  /**
   * Performs the entire import operation within a database transaction
   *
   * @param userId - The user ID performing the import
   * @param householdId - The household ID to import into
   * @param importRequest - The import request payload
   * @param existingMappings - Map of already imported items
   * @returns Import statistics and mappings
   */
  private async performImportTransaction(
    userId: string,
    householdId: string,
    importRequest: ImportRequestDto,
    existingMappings: Map<string, string>,
  ): Promise<ImportResponseDto> {
    const stats: ImportStats = {
      created: 0,
      skipped: 0,
      mappings: {},
    };

    await this.prisma.$transaction(async (prismaTransaction) => {
      const batch = await this.createImportBatch(prismaTransaction, userId);

      if (importRequest.recipes && importRequest.recipes.length > 0) {
        const recipeStats = await this.importRecipes(
          prismaTransaction,
          userId,
          batch.id,
          householdId,
          importRequest.recipes,
          existingMappings,
        );
        stats.created += recipeStats.created;
        stats.skipped += recipeStats.skipped;
        Object.assign(stats.mappings, recipeStats.mappings);
      }

      if (
        importRequest.shoppingLists &&
        importRequest.shoppingLists.length > 0
      ) {
        const listStats = await this.importShoppingLists(
          prismaTransaction,
          userId,
          batch.id,
          householdId,
          importRequest.shoppingLists,
          existingMappings,
        );
        stats.created += listStats.created;
        stats.skipped += listStats.skipped;
        Object.assign(stats.mappings, listStats.mappings);
      }
    });

    return stats;
  }

  /**
   * Creates an import batch record to track this import operation
   *
   * @param prismaTransaction - The Prisma transaction client
   * @param userId - The user ID performing the import
   * @returns The created import batch record
   */
  private async createImportBatch(
    prismaTransaction: PrismaTransaction,
    userId: string,
  ) {
    return await prismaTransaction.importBatch.create({
      data: {
        userId,
        source: ImportSource.GUEST_MODE_MIGRATION,
        status: ImportStatus.COMPLETED,
      },
    });
  }

  /**
   * Imports recipes within a transaction, skipping duplicates
   *
   * @param prismaTransaction - The Prisma transaction client
   * @param userId - The user ID performing the import (for mapping creation)
   * @param batchId - The import batch ID
   * @param householdId - The household ID to import into
   * @param recipes - Array of recipes to import
   * @param existingMappings - Map of already imported items
   * @returns Statistics for recipe import operation
   */
  private async importRecipes(
    prismaTransaction: PrismaTransaction,
    userId: string,
    batchId: string,
    householdId: string,
    recipes: ImportRecipeDto[],
    existingMappings: Map<string, string>,
  ): Promise<ImportStats> {
    const stats: ImportStats = {
      created: 0,
      skipped: 0,
      mappings: {},
    };

    for (const recipe of recipes) {
      const namespacedSourceId = `${ImportEntityType.RECIPE}:${recipe.id}`;
      if (existingMappings.has(namespacedSourceId)) {
        stats.skipped++;
        stats.mappings[recipe.id] = existingMappings.get(namespacedSourceId)!;
        continue;
      }

      // Check for existing recipe by fingerprint (title)
      const existingRecipeId =
        await this.importRepository.findRecipeByFingerprint(
          householdId,
          recipe.title,
        );

      let targetId: string;

      if (existingRecipeId) {
        targetId = existingRecipeId;
        stats.skipped++; // Count as skipped since we didn't create a NEW recipe
      } else {
        const newRecipe = await prismaTransaction.recipe.create({
          data: {
            householdId,
            title: recipe.title,
            prepTime: recipe.prepTime,
            ingredients: recipe.ingredients as unknown as Prisma.JsonValue,
            instructions: recipe.instructions as unknown as Prisma.JsonValue,
            imageUrl: recipe.imageUrl,
          },
        });
        targetId = newRecipe.id;
        stats.created++;
      }

      await this.createImportMapping(
        prismaTransaction,
        userId,
        batchId,
        recipe.id,
        ImportEntityType.RECIPE,
        targetId,
      );

      stats.mappings[recipe.id] = targetId;
    }

    return stats;
  }

  /**
   * Imports shopping lists and their items within a transaction, skipping duplicates
   *
   * @param prismaTransaction - The Prisma transaction client
   * @param userId - The user ID performing the import (for mapping creation)
   * @param batchId - The import batch ID
   * @param householdId - The household ID to import into
   * @param shoppingLists - Array of shopping lists to import
   * @param existingMappings - Map of already imported items
   * @returns Statistics for shopping list import operation
   */
  private async importShoppingLists(
    prismaTransaction: PrismaTransaction,
    userId: string,
    batchId: string,
    householdId: string,
    shoppingLists: ImportShoppingListDto[],
    existingMappings: Map<string, string>,
  ): Promise<ImportStats> {
    const stats: ImportStats = {
      created: 0,
      skipped: 0,
      mappings: {},
    };

    for (const list of shoppingLists) {
      const namespacedSourceId = `${ImportEntityType.SHOPPING_LIST}:${list.id}`;
      if (existingMappings.has(namespacedSourceId)) {
        stats.skipped++;
        stats.mappings[list.id] = existingMappings.get(namespacedSourceId)!;
        continue;
      }

      // Check for existing list by fingerprint (name)
      const existingListId =
        await this.importRepository.findShoppingListByFingerprint(
          householdId,
          list.name,
        );

      let targetId: string;

      if (existingListId) {
        targetId = existingListId;
        stats.skipped++; // Count as skipped since we didn't create a NEW list
      } else {
        const newList = await prismaTransaction.shoppingList.create({
          data: {
            householdId,
            name: list.name,
            color: list.color,
          },
        });

        if (list.items && list.items.length > 0) {
          await this.createShoppingItems(
            prismaTransaction,
            newList.id,
            list.items,
          );
        }

        targetId = newList.id;
        stats.created++;
      }

      await this.createImportMapping(
        prismaTransaction,
        userId,
        batchId,
        list.id,
        ImportEntityType.SHOPPING_LIST,
        targetId,
      );

      stats.mappings[list.id] = targetId;
    }

    return stats;
  }

  /**
   * Creates shopping items for a list in bulk
   *
   * @param prismaTransaction - The Prisma transaction client
   * @param listId - The shopping list ID
   * @param items - Array of items to create
   */
  private async createShoppingItems(
    prismaTransaction: PrismaTransaction,
    listId: string,
    items: ImportShoppingListDto['items'],
  ): Promise<void> {
    await prismaTransaction.shoppingItem.createMany({
      data: items.map((item) => ({
        listId,
        name: item.name,
        quantity: item.quantity ?? 1,
        unit: item.unit,
        category: item.category,
        isChecked: item.isChecked ?? false,
      })),
    });
  }

  /**
   * Creates an import mapping record for deduplication tracking
   *
   * Note: If a unique constraint violation occurs (P2002) on [userId, sourceField],
   * this indicates a concurrent import request. The transaction will handle rollback
   * and the outer error handler will provide a meaningful error message.
   *
   * @param prismaTransaction - The Prisma transaction client
   * @param userId - The user ID performing the import
   * @param batchId - The import batch ID
   * @param sourceId - The original local ID from guest mode
   * @param targetId - The new server-side ID in the household
   * @throws Prisma error P2002 if mapping already exists (concurrent request scenario)
   */
  private async createImportMapping(
    prismaTransaction: PrismaTransaction,
    userId: string,
    batchId: string,
    sourceId: string,
    sourceType: ImportEntityType,
    targetId: string,
  ): Promise<void> {
    try {
      await prismaTransaction.importMapping.create({
        data: {
          batchId,
          userId,
          sourceField: sourceId,
          sourceType,
          targetField: targetId,
        },
      });
    } catch (error: unknown) {
      // Handle unique constraint violation (concurrent request scenario)
      if (
        isPrismaUniqueConstraintError(error) &&
        error.meta?.target?.includes('userId')
      ) {
        this.logger.warn(
          `Concurrent import detected: mapping already exists for user ${userId}, source ${sourceId}`,
        );
        // Re-throw with more context - the transaction will handle rollback
        throw new Error(
          `Import mapping already exists for source ${sourceId}. This may indicate a concurrent import request.`,
        );
      }
      throw error;
    }
  }

  /**
   * Handles errors during import operations and provides meaningful error messages
   *
   * @param error - The error that occurred
   * @param userId - The user ID performing the import
   * @param importRequest - The import request that failed
   * @throws BadRequestException for duplicate data or invalid references
   * @throws InternalServerErrorException for other failures
   */
  private handleImportError(
    error: any,
    userId: string,
    importRequest: ImportRequestDto,
  ): never {
    const recipeCount = importRequest.recipes?.length || 0;
    const listCount = importRequest.shoppingLists?.length || 0;

    if (error.code === 'P2002') {
      throw new BadRequestException(
        'Import failed: Duplicate data detected. You may have already imported some of this data.',
      );
    }

    if (error.code === 'P2003') {
      throw new BadRequestException(
        'Import failed: Invalid household reference. Please ensure you are logged in properly.',
      );
    }

    throw new InternalServerErrorException(
      `Failed to import ${recipeCount} recipes and ${listCount} shopping lists. Please try again later.`,
    );
  }
}
