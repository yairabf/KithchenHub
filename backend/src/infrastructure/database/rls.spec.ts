import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Row Level Security (RLS) Integration Tests
 * 
 * Verifies that the multi-tenant isolation policies correctly restrict access 
 * based on household membership.
 */
describe('Row Level Security (RLS) Integration Tests', () => {
    let prisma: PrismaClient;

    beforeAll(async () => {
        prisma = new PrismaClient();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    /**
     * Helper to create a complete test context for a household.
     */
    async function createTestContext(prefix: string) {
        const householdId = `${prefix}-h-${randomUUID().slice(0, 8)}`;
        const userId = randomUUID();

        await prisma.household.create({
            data: { id: householdId, name: `${prefix} Household` },
        });

        await prisma.user.create({
            data: { id: userId, householdId: householdId, email: `${prefix}-${userId}@test.com` },
        });

        return { householdId, userId };
    }

    /**
     * Helper to clean up test data.
     */
    async function cleanupContext(context: { householdId: string; userId: string }) {
        // Cascading deletes should handle most items if they depend on household/user
        await prisma.recipe.deleteMany({ where: { householdId: context.householdId } });
        await prisma.shoppingList.deleteMany({ where: { householdId: context.householdId } });
        await prisma.chore.deleteMany({ where: { householdId: context.householdId } });
        await prisma.user.deleteMany({ where: { id: context.userId } });
        await prisma.household.deleteMany({ where: { id: context.householdId } });
    }

    /**
     * Parameterized tests for household-isolated entities.
     * Rule 8: Always parameterize tests.
     */
    describe.each([
        ['Recipe', 'recipe'],
        ['Shopping List', 'shoppingList'],
        ['Chore', 'chore'],
    ])('%s isolation', (label, collection) => {
        it(`should prevent cross-household access for ${label}`, async () => {
            const contextA = await createTestContext('a');
            const contextB = await createTestContext('b');

            // 1. Create data for both households (as admin)
            const itemA = await (prisma[collection] as any).create({
                data: {
                    householdId: contextA.householdId,
                    title: collection === 'shoppingList' ? undefined : `Item A ${label}`,
                    name: collection === 'shoppingList' ? `List A` : undefined,
                    ingredients: collection === 'recipe' ? [] : undefined,
                    instructions: collection === 'recipe' ? [] : undefined,
                },
            });

            const itemB = await (prisma[collection] as any).create({
                data: {
                    householdId: contextB.householdId,
                    title: collection === 'shoppingList' ? undefined : `Item B ${label}`,
                    name: collection === 'shoppingList' ? `List B` : undefined,
                    ingredients: collection === 'recipe' ? [] : undefined,
                    instructions: collection === 'recipe' ? [] : undefined,
                },
            });

            // 2. Verify RLS as User A
            await prisma.$transaction(async (tx) => {
                await tx.$executeRawUnsafe('SET LOCAL ROLE authenticated');
                await tx.$executeRawUnsafe(`SET LOCAL "request.jwt.claims" = '{"sub": "${contextA.userId}"}'`);

                // User A should see Item A
                const myItems = await (tx[collection] as any).findMany({
                    where: { householdId: contextA.householdId }
                });
                expect(myItems.map((i: any) => i.id)).toContain(itemA.id);

                // User A should NOT see Item B
                const otherItems = await (tx[collection] as any).findMany({
                    where: { householdId: contextB.householdId }
                });
                expect(otherItems.length).toBe(0);

                // User A should NOT be able to insert into Household B
                await expect((tx[collection] as any).create({
                    data: {
                        householdId: contextB.householdId,
                        title: collection === 'shoppingList' ? undefined : `Stolen ${label}`,
                        name: collection === 'shoppingList' ? `Stolen List` : undefined,
                        ingredients: collection === 'recipe' ? [] : undefined,
                        instructions: collection === 'recipe' ? [] : undefined,
                    }
                })).rejects.toThrow();
            });

            // Cleanup
            await cleanupContext(contextA);
            await cleanupContext(contextB);
        }, 30000);
    });
});
