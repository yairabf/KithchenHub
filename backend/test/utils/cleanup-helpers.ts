/**
 * Cleanup helper utilities for E2E tests.
 * Provides comprehensive cleanup functions to prevent test database pollution.
 */

import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';

/**
 * Cleans up all test data for a user and their household
 */
export async function cleanupTestUserData(
  prisma: PrismaService,
  userId: string,
  householdId?: string | null,
): Promise<void> {
  try {
    // Delete in reverse dependency order to avoid foreign key violations

    if (householdId) {
      // Delete shopping items first (they reference lists)
      await prisma.shoppingItem.deleteMany({
        where: { list: { householdId } },
      });

      // Delete shopping lists
      await prisma.shoppingList.deleteMany({
        where: { householdId },
      });

      // Delete recipes
      await prisma.recipe.deleteMany({
        where: { householdId },
      });

      // Delete chores
      await prisma.chore.deleteMany({
        where: { householdId },
      });

      // Delete custom items (household-scoped)
      await prisma.customItem.deleteMany({
        where: { householdId },
      });
    }

    // Delete refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    // Log with context for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Failed to cleanup test user data for userId=${userId}, householdId=${householdId}:`,
      errorMessage,
    );

    // In CI environments, rethrow to fail the test
    if (process.env.CI === 'true') {
      throw error;
    }
  }
}
